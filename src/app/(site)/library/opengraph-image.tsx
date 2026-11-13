import { coverUris, ogContentType, ogSize, renderOg } from "@/lib/og";
import { getOgOverview } from "@/lib/data/public";

export const alt = "My collection of games on Re:Play";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  const { recentCovers } = await getOgOverview();
  const covers = await coverUris(recentCovers, 4);
  return renderOg({
    eyebrow: "Library",
    title: "My collection of games",
    subtitle: "Filters, search and my personal ratings.",
    panel: covers.length > 0 ? { kind: "covers", covers } : null,
  });
}
