export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_INPUT_BYTES = 25 * 1024 * 1024; // what we accept to even try to decode

export class ClientImageError extends Error {}

/**
 * Validates a user-selected image and downsizes/re-encodes it in the browser BEFORE upload,
 * so requests stay small. The server then runs the final, authoritative optimization pass.
 */
export async function compressForUpload(
  file: File,
  { maxSide, quality = 0.86 }: { maxSide: number; quality?: number },
): Promise<File> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ClientImageError(`“${file.name}” is not a JPEG, PNG, WebP or AVIF image.`);
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ClientImageError(`“${file.name}” is larger than 25 MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ClientImageError(`“${file.name}” could not be read as an image.`);
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ClientImageError("Your browser can't process images.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new ClientImageError(`“${file.name}” could not be compressed.`);

  // Never make things worse: keep the original if re-encoding didn't help.
  if (blob.size >= file.size && scale === 1) return file;

  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${name}.webp`, { type: "image/webp" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
