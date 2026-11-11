import { ogContentType, ogSize, renderOg } from "@/lib/og";
import { getOgOverview } from "@/lib/data/public";

export const alt = "Statistics on Re:Play: the journey in numbers";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  const { games, hours, average } = await getOgOverview();
  return renderOg({
    eyebrow: "Statistics",
    title: "The journey in numbers",
    subtitle: "Everything calculated live from the collection.",
    panel: {
      kind: "stats",
      items: [
        { label: "Games", value: String(games) },
        { label: "Hours played", value: String(Number(hours.toFixed(1))) },
        { label: "Average rating", value: average === null ? "-" : average.toFixed(1) },
      ],
    },
  });
}
