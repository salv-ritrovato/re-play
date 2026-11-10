import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // raw input, before compression
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff"]);

export type ImageVariant = "cover" | "screenshot";

export interface ProcessedImage {
  buffer: Buffer;
  blur: string;
  width: number;
  height: number;
  /** Size in bytes after compression. */
  bytes: number;
}

export class ImageError extends Error {}

const VARIANTS = {
  // 3:4 poster, plenty for retina grids; next/image then serves smaller AVIF/WebP.
  cover: { width: 900, height: 1200, quality: 80 },
  // Keep the original aspect ratio, cap the width.
  screenshot: { width: 1920, height: 1920, quality: 76 },
} as const;

/**
 * Validates and optimizes an uploaded image: auto-rotates from EXIF, strips metadata,
 * resizes to a sane maximum and re-encodes to WebP. Also generates a tiny blur placeholder.
 */
export async function processImage(
  file: File,
  variant: ImageVariant,
): Promise<ProcessedImage> {
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

  const { width, height, quality } = VARIANTS[variant];
  const pipeline = sharp(input, { limitInputPixels: 80_000_000 }).rotate();

  const resized =
    variant === "cover"
      ? pipeline.resize({
          width,
          height,
          fit: "cover",
          position: sharp.strategy.attention,
          withoutEnlargement: true,
        })
      : pipeline.resize({
          width,
          height,
          fit: "inside",
          withoutEnlargement: true,
        });

  const { data, info } = await resized
    .webp({ quality, effort: 5, smartSubsample: true })
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
