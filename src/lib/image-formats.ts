/**
 * Which image files a cover may be, shared by the browser (before upload) and the server (the final check).
 * Pure functions, no dependencies, so both sides use exactly the same rules.
 */

/** What the owner is told the site accepts. */
export const SUPPORTED_LABEL = "JPEG, PNG, WebP or AVIF";

/**
 * Whether the format that `sharp` reports for a file is accepted.
 *
 * sharp names an AVIF file "heif" (compression "av1"), never "avif": checking the name "avif" would reject
 * every AVIF. Real HEIC photos (compression "hevc") are also "heif" but cannot be decoded here.
 */
export function isAcceptedFormat(format: string | undefined, compression?: string): boolean {
  if (!format) return false;
  if (format === "heif") return compression === "av1";
  return ["jpeg", "png", "webp", "avif", "gif", "tiff"].includes(format);
}

/** The error to show for a file that is not accepted, naming the common reasons. */
export function unsupportedMessage(format: string | undefined, compression?: string): string {
  if (format === "heif" && compression !== "av1") {
    return `HEIC / HEIF photos are not supported. Export the image as ${SUPPORTED_LABEL} and try again.`;
  }
  if (format === "svg") return `SVG drawings are not supported. Export the image as ${SUPPORTED_LABEL} and try again.`;
  return `Unsupported format. Use ${SUPPORTED_LABEL}.`;
}

/**
 * The real type of an image, read from its first bytes. File names and the browser's guess can be missing or
 * wrong (a download without an extension, a renamed file), the content cannot.
 */
export function sniffImageType(head: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | "image/avif" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}
