import { coverUris, ogContentType, ogSize, renderOg } from "@/lib/og";
import { getOgOverview } from "@/lib/data/public";

export const alt = "Re:Play - My journey through gaming, a personal archive of every video game I've played";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  const { topCovers, games } = await getOgOverview();
  const covers = await coverUris(topCovers, 4);
  return renderOg({
    eyebrow: "Video game archive",
    title: "A quiet record of every world I've wandered through",
    subtitle:
      games > 0
        ? `Ratings, reviews and a visual history of ${games} games I've played.`
        : "Ratings, reviews and a visual history of every game I've played.",
    panel: covers.length > 0 ? { kind: "covers", covers } : null,
  });
}
