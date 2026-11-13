import { coverUris, ogContentType, ogSize, renderOg } from "@/lib/og";
import { getOgOverview } from "@/lib/data/public";

export const alt = "Statistics on Re:Play: the journey in numbers";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  const { topCovers } = await getOgOverview();
  const covers = await coverUris(topCovers, 4);
  return renderOg({
    eyebrow: "Statistics",
    title: "The journey in numbers",
    // No figures in the picture: a shared preview is kept for days and they would be out of date.
    subtitle: "Genres, platforms, ratings, hours and years, calculated live from the collection.",
    panel: covers.length > 0 ? { kind: "covers", covers } : null,
  });
}
