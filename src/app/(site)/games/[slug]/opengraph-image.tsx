import { getGameBySlug } from "@/lib/data/public";
import { yearOf } from "@/lib/format";
import { coverUri, ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "A game reviewed on Re:Play";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return renderOg({ eyebrow: "Game", title: "Not in the archive" });

  const cover = await coverUri(game.cover_path);
  const eyebrow = [yearOf(game.release_date), game.developer].filter(Boolean).join(" · ") || "Game";
  return renderOg({
    eyebrow,
    title: game.title,
    subtitle: game.rating === null ? "Reviewed on Re:Play" : `My rating: ${game.rating.toFixed(1)} / 10`,
    panel: cover ? { kind: "cover", cover } : null,
  });
}
