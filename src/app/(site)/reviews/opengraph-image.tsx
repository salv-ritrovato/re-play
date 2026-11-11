import { coverUris, ogContentType, ogSize, renderOg } from "@/lib/og";
import { getOgOverview } from "@/lib/data/public";

export const alt = "Reviews on Re:Play, in English and Italian";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  const { topCovers } = await getOgOverview();
  // The covers after the top four, so this image differs from the home page one.
  const covers = await coverUris(topCovers.slice(4), 4);
  return renderOg({
    eyebrow: "Reviews",
    title: "What I thought",
    subtitle: "Honest, personal write-ups of the games I've played, in English and Italian.",
    panel: covers.length > 0 ? { kind: "covers", covers } : null,
  });
}
