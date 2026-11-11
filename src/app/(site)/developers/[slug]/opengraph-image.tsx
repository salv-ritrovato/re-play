import { getDeveloperGames } from "@/lib/data/public";
import { coverUris, ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Games by a developer, rated on Re:Play";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const developer = await getDeveloperGames(slug);
  if (!developer) return renderOg({ eyebrow: "Developer", title: "Not in the archive" });

  const { name, games } = developer;
  const rated = games.filter((g) => g.rating !== null);
  const average = rated.length > 0 ? rated.reduce((sum, g) => sum + Number(g.rating), 0) / rated.length : null;
  const covers = await coverUris(games.map((g) => g.cover_path), 4);
  return renderOg({
    eyebrow: "Developer",
    title: name,
    subtitle:
      `${games.length} ${games.length === 1 ? "game" : "games"} in the archive` +
      (average !== null ? ` · average rating ${average.toFixed(1)}` : ""),
    panel: covers.length > 0 ? { kind: "covers", covers } : null,
  });
}
