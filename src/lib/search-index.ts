/** One game as the navbar search sees it: just enough to find it and show a line for it. */
export interface SearchEntry {
  slug: string;
  title: string;
  developer: string | null;
  publisher: string | null;
  year: number | null;
  rating: number | null;
  cover_path: string | null;
  cover_blur: string | null;
}

/** Lowercase and without accents, so "pokemon" finds "Pokémon". */
const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * The games that answer a typed query: every word must appear in the title, developer or publisher.
 * Titles that start with the query come first, then titles that contain it, then the rest, A to Z.
 */
export function searchEntries(
  entries: readonly SearchEntry[],
  query: string,
  limit = 6,
): { items: SearchEntry[]; total: number } {
  const q = fold(query).trim();
  if (!q) return { items: [], total: 0 };
  const words = q.split(/\s+/);

  const scored: { entry: SearchEntry; score: number; title: string }[] = [];
  for (const entry of entries) {
    const title = fold(entry.title);
    const haystack = `${title} ${fold(entry.developer ?? "")} ${fold(entry.publisher ?? "")}`;
    if (!words.every((w) => haystack.includes(w))) continue;
    const score = title.startsWith(q) ? 0 : title.includes(q) ? 1 : words.every((w) => title.includes(w)) ? 2 : 3;
    scored.push({ entry, score, title });
  }
  scored.sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));
  return { items: scored.slice(0, limit).map((s) => s.entry), total: scored.length };
}
