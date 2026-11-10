import {
  COMPLETION_STATUSES,
  PLAY_STATUSES,
  REVIEW_SORT_OPTIONS,
  SORT_OPTIONS,
  type CompletionStatus,
  type LibraryFilters,
  type PlayStatus,
  type SortKey,
} from "@/lib/types";

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(",")).filter(Boolean);
const num = (v: string | undefined) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Defensive parsing: anything invalid in the URL is silently dropped. */
export function parseLibraryParams(
  raw: RawParams,
  mode: "library" | "reviews" = "library",
): LibraryFilters {
  const sortOptions = mode === "reviews" ? REVIEW_SORT_OPTIONS : SORT_OPTIONS;
  const sortParam = first(raw.sort);
  const sort = (sortOptions.find((o) => o.value === sortParam)?.value ??
    (mode === "reviews" ? "reviewed" : "added")) as SortKey;

  const page = Math.max(1, Math.floor(num(first(raw.page)) ?? 1));

  return {
    q: first(raw.q)?.trim().slice(0, 100) || undefined,
    genres: list(raw.genre).filter((g) => UUID.test(g)),
    platforms: list(raw.platform).filter((p) => UUID.test(p)),
    years: list(raw.year)
      .map(Number)
      .filter((y) => Number.isInteger(y) && y > 1950 && y < 2100),
    minRating: clampRating(num(first(raw.min))),
    maxRating: clampRating(num(first(raw.max))),
    status: list(raw.status).filter((s): s is PlayStatus =>
      (PLAY_STATUSES as readonly string[]).includes(s),
    ),
    completion: list(raw.completion).filter((s): s is CompletionStatus =>
      (COMPLETION_STATUSES as readonly string[]).includes(s),
    ),
    developer: first(raw.developer)?.slice(0, 120) || undefined,
    publisher: first(raw.publisher)?.slice(0, 120) || undefined,
    reviewedOnly: mode === "reviews",
    online: first(raw.type) === "online" ? true : first(raw.type) === "solo" ? false : undefined,
    sort,
    page,
    view: first(raw.view) === "list" ? "list" : "grid",
  };
}

function clampRating(n: number | undefined) {
  if (n === undefined) return undefined;
  return Math.min(10, Math.max(0, n));
}

/** Number of active (non-default) filters, excluding search, sort, view and page. */
export function countActiveFilters(f: LibraryFilters): number {
  return (
    (f.genres?.length ?? 0) +
    (f.platforms?.length ?? 0) +
    (f.years?.length ?? 0) +
    (f.status?.length ?? 0) +
    (f.completion?.length ?? 0) +
    (f.minRating !== undefined ? 1 : 0) +
    (f.maxRating !== undefined ? 1 : 0) +
    (f.developer ? 1 : 0) +
    (f.publisher ? 1 : 0) +
    (f.online !== undefined ? 1 : 0)
  );
}
