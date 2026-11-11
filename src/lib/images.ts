import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // raw input, before compression
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff"]);

export interface ProcessedImage {
  buffer: Buffer;
  blur: string;
  width: number;
  height: number;
  /** Size in bytes after compression. */
  bytes: number;
}

export class ImageError extends Error {}

// 3:4 poster, plenty for retina grids; next/image then serves smaller AVIF/WebP.
const COVER = { width: 900, height: 1200, quality: 80 } as const;
const ASPECT = COVER.width / COVER.height;
/** Art within 4% of 3:4 is cropped to fit (the loss is invisible); anything else is shown whole. */
const CROP_TOLERANCE = 0.04;

/**
 * Validates and optimizes an uploaded cover: auto-rotates from EXIF, strips metadata, fits it in a 3:4
 * frame, caps the size and re-encodes to WebP. Also generates a tiny blur placeholder.
 *
 * Fitting never cuts the artwork off: when the proportions are not (nearly) 3:4, the whole image is
 * scaled to fit inside the frame and the empty sides are filled with a blurred, darkened copy of it.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (file.size === 0) throw new ImageError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError("The image is larger than 10 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());

  // Trust the actual bytes, not the declared MIME type.
  let format: string | undefined;
  try {
    format = (await sharp(input, { limitInputPixels: 80_000_000 }).metadata()).format;
  } catch {
    throw new ImageError("The file is not a valid image.");
  }
  if (!format || !ALLOWED_FORMATS.has(format)) {
    throw new ImageError("Unsupported format. Use JPEG, PNG, WebP or AVIF.");
  }

  const open = () => sharp(input, { limitInputPixels: 80_000_000 }).rotate();

  // Proportions after the EXIF rotation (orientations 5-8 swap width and height).
  const meta = await sharp(input, { limitInputPixels: 80_000_000 }).metadata();
  const turned = (meta.orientation ?? 1) >= 5;
  const width = (turned ? meta.height : meta.width) ?? 1;
  const height = (turned ? meta.width : meta.height) ?? 1;
  const closeEnough = Math.abs(width / height / ASPECT - 1) <= CROP_TOLERANCE;

  let framed: ReturnType<typeof sharp>;
  if (closeEnough) {
    framed = open().resize({
      width: COVER.width,
      height: COVER.height,
      fit: "cover",
      position: sharp.strategy.attention,
      withoutEnlargement: true,
    });
  } else {
    const backdrop = await open()
      .resize({ width: COVER.width, height: COVER.height, fit: "cover" })
      .blur(30)
      .modulate({ brightness: 0.5 })
      .toBuffer();
    const artwork = await open()
      .resize({ width: COVER.width, height: COVER.height, fit: "inside" })
      .toBuffer();
    framed = sharp(backdrop).composite([{ input: artwork, gravity: "centre" }]);
  }

  const { data, info } = await framed
    .webp({ quality: COVER.quality, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  const blurBuffer = await sharp(data)
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();

  return {
    buffer: data,
    blur: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
    width: info.width,
    height: info.height,
    bytes: data.byteLength,
  };
}
