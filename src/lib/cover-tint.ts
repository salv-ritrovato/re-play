import "server-only";
import sharp from "sharp";

/**
 * The main colour of a cover, taken from its tiny blur placeholder (a data URL already stored with the game),
 * slightly boosted so grey covers still give a hint. Used for the soft glow behind a game's title.
 * Returns null when there is no usable placeholder.
 */
export async function coverTint(blur: string | null | undefined): Promise<{ r: number; g: number; b: number } | null> {
  const match = blur?.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) return null;
  try {
    const { data } = await sharp(Buffer.from(match[1], "base64"))
      .modulate({ saturation: 1.5 })
      .resize(1, 1, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // A dark cover would give a glow nobody sees: scale the colour up (never more than 3x) to a clear brightness.
    const factor = Math.min(3, 200 / Math.max(data[0], data[1], data[2], 1));
    const lift = (n: number) => Math.min(255, Math.round(n * factor));
    return { r: lift(data[0]), g: lift(data[1]), b: lift(data[2]) };
  } catch {
    return null; // a damaged placeholder just means no glow
  }
}
