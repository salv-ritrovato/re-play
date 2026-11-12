import type { LibraryFilters, LibraryRecord } from "@/lib/types";

/**
 * Filters and sorts the whole library in the browser, so a change shows up instantly with no round trip.
 * It mirrors the `library_search` SQL function (substring search on title, developer and publisher; within a
 * group any match counts, across groups all must; same sort keys, ties broken by "recently added"). The
 * SQL function still serves the home page and the reviews page, so keep the two in step.
 */
export function filterLibrary<T extends LibraryRecord>(games: readonly T[], f: LibraryFilters): T[] {
  const q = f.q?.trim().toLowerCase() || null;
  const genres = f.genres?.length ? new Set(f.genres) : null;
  const platforms = f.platforms?.length ? new Set(f.platforms) : null;
  const years = f.years?.length ? new Set(f.years) : null;
  const status = f.status?.length ? new Set<string>(f.status) : null;
  const completion = f.completion?.length ? new Set<string>(f.completion) : null;
  const launchers = f.launchers?.length ? f.launchers : null;

  const matches = (g: T) => {
    if (
      q &&
      !g.title.toLowerCase().includes(q) &&
      !(g.developer ?? "").toLowerCase().includes(q) &&
      !(g.publisher ?? "").toLowerCase().includes(q)
    ) {
      return false;
    }
    if (genres && !g.genres.some((x) => genres.has(x.id))) return false;
    if (platforms && !g.platforms.some((x) => platforms.has(x.id))) return false;
    if (years) {
      const year = g.release_date ? Number(g.release_date.slice(0, 4)) : null;
      if (year === null || !years.has(year)) return false;
    }
    if (f.minRating !== undefined && !(g.rating !== null && g.rating >= f.minRating)) return false;
    if (f.maxRating !== undefined && !(g.rating !== null && g.rating <= f.maxRating)) return false;
    if (status && !status.has(g.play_status)) return false;
    if (completion && !completion.has(g.completion_status)) return false;
    if (f.developer && g.developer !== f.developer) return false;
    if (f.publisher && g.publisher !== f.publisher) return false;
    if (f.online !== undefined && g.is_online !== f.online) return false;
    if (launchers && !g.launchers.some((l) => launchers.includes(l))) return false;
    return true;
  };

  return sortLibrary(games.filter(matches), f.sort);
}

type Cmp = (a: LibraryRecord, b: LibraryRecord) => number;

const compare = <T extends string | number>(x: T, y: T) => (x < y ? -1 : x > y ? 1 : 0);

/** Compare by an optional value, with games that have none always at the end. */
const byOptional =
  <T extends string | number>(get: (g: LibraryRecord) => T | null, direction: 1 | -1): Cmp =>
  (a, b) => {
    const x = get(a);
    const y = get(b);
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    return compare(x, y) * direction;
  };

const byAdded: Cmp = (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at);

const SORTS: Record<LibraryFilters["sort"], Cmp> = {
  added: byAdded,
  played: byOptional((g) => g.completed_on, -1),
  rating_desc: byOptional((g) => g.rating, -1),
  rating_asc: byOptional((g) => g.rating, 1),
  title: (a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase(), "en"),
  release_desc: byOptional((g) => g.release_date, -1),
  release_asc: byOptional((g) => g.release_date, 1),
};

export function sortLibrary<T extends LibraryRecord>(games: T[], sort: LibraryFilters["sort"]): T[] {
  const primary: (a: LibraryRecord, b: LibraryRecord) => number = SORTS[sort] ?? byAdded;
  return [...games].sort((a, b) => primary(a, b) || byAdded(a, b));
}
