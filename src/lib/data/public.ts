import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  GameDetail,
  GameSummary,
  LibraryFilters,
  Taxonomy,
} from "@/lib/types";

export const PAGE_SIZE = 24;
export const REVIEWS_PAGE_SIZE = 12;

/** Cache tags, invalidated by the CMS server actions. */
export const TAGS = { games: "games", taxonomy: "taxonomy" } as const;

function fail(scope: string, error: { message: string }): never {
  throw new Error(`[${scope}] ${error.message}`);
}

// ---------------------------------------------------------------------------
// Library / reviews
// ---------------------------------------------------------------------------
export async function searchGames(
  filters: LibraryFilters,
  pageSize: number = PAGE_SIZE,
): Promise<{ items: GameSummary[]; total: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games, TAGS.taxonomy);

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("library_search", {
    p_query: filters.q || null,
    p_genres: filters.genres?.length ? filters.genres : null,
    p_platforms: filters.platforms?.length ? filters.platforms : null,
    p_years: filters.years?.length ? filters.years : null,
    p_min_rating: filters.minRating ?? null,
    p_max_rating: filters.maxRating ?? null,
    p_play_status: filters.status?.length ? filters.status : null,
    p_completion: filters.completion?.length ? filters.completion : null,
    p_developer: filters.developer || null,
    p_publisher: filters.publisher || null,
    p_reviewed_only: filters.reviewedOnly ?? false,
    p_sort: filters.sort,
    p_limit: pageSize,
    p_offset: (Math.max(filters.page, 1) - 1) * pageSize,
    p_online: filters.online ?? null,
  });
  if (error) fail("searchGames", error);

  const items = (data ?? []) as GameSummary[];
  return { items, total: items[0] ? Number(items[0].total_count) : 0 };
}

export async function getFilterOptions() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games, TAGS.taxonomy);

  const supabase = createPublicClient();
  const [genres, platforms, years, developers, publishers] = await Promise.all([
    supabase.from("genres").select("id, name, slug").order("name"),
    supabase.from("platforms").select("id, name, slug").order("name"),
    supabase.from("filter_years").select("year, games"),
    supabase.from("filter_developers").select("name, games"),
    supabase.from("filter_publishers").select("name, games"),
  ]);
  for (const r of [genres, platforms, years, developers, publishers]) {
    if (r.error) fail("getFilterOptions", r.error);
  }
  return {
    genres: (genres.data ?? []) as Taxonomy[],
    platforms: (platforms.data ?? []) as Taxonomy[],
    years: (years.data ?? []) as { year: number; games: number }[],
    developers: (developers.data ?? []) as { name: string; games: number }[],
    publishers: (publishers.data ?? []) as { name: string; games: number }[],
  };
}

// ---------------------------------------------------------------------------
// Game detail
// ---------------------------------------------------------------------------
const DETAIL_SELECT = `
  *,
  genres:game_genres(genre:genres(id, name, slug)),
  platforms:game_platforms(platform:platforms(id, name, slug)),
  tags:game_tags(tag:tags(id, name, slug)),
  images:game_images(id, game_id, kind, path, blur, width, height, position)
`;

type RawDetail = Omit<GameDetail, "genres" | "platforms" | "tags"> & {
  genres: { genre: Taxonomy }[];
  platforms: { platform: Taxonomy }[];
  tags: { tag: Taxonomy }[];
};

export function normalizeDetail(raw: RawDetail): GameDetail {
  const byName = (a: Taxonomy, b: Taxonomy) => a.name.localeCompare(b.name);
  return {
    ...raw,
    rating: raw.rating === null ? null : Number(raw.rating),
    playtime_hours: raw.playtime_hours === null ? null : Number(raw.playtime_hours),
    genres: raw.genres.map((g) => g.genre).sort(byName),
    platforms: raw.platforms.map((p) => p.platform).sort(byName),
    tags: raw.tags.map((t) => t.tag).sort(byName),
    images: [...raw.images].sort((a, b) => a.position - b.position),
  };
}

export const GAME_DETAIL_SELECT = DETAIL_SELECT;

export async function getGameBySlug(slug: string): Promise<GameDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games, `game:${slug}`);

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("games")
    .select(DETAIL_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("getGameBySlug", error);
  return data ? normalizeDetail(data as unknown as RawDetail) : null;
}

export async function getRelatedGames(game: GameDetail, limit = 6): Promise<GameSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  if (game.genres.length === 0) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("library_search", {
    p_genres: game.genres.map((g) => g.id),
    p_sort: "rating_desc",
    p_limit: limit + 1,
    p_offset: 0,
  });
  if (error) fail("getRelatedGames", error);
  return ((data ?? []) as GameSummary[]).filter((g) => g.id !== game.id).slice(0, limit);
}

export async function getAllSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("games").select("slug");
  if (error) fail("getAllSlugs", error);
  return (data ?? []).map((g) => g.slug as string);
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
export async function getHomeData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();
  const search = (sort: string, extra: Record<string, unknown> = {}, limit = 8) =>
    supabase.rpc("library_search", { p_sort: sort, p_limit: limit, p_offset: 0, ...extra });

  const [totals, added, reviewed, top, featured, currently] = await Promise.all([
    supabase.from("stats_totals").select("*").maybeSingle(),
    search("added"),
    search("reviewed", { p_reviewed_only: true }),
    search("rating_desc", { p_min_rating: 0 }),
    supabase
      .from("games")
      .select(DETAIL_SELECT)
      .eq("featured", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    search("played", { p_play_status: ["playing"] }, 6),
  ]);
  for (const r of [totals, added, reviewed, top, featured, currently]) {
    if (r.error) fail("getHomeData", r.error);
  }

  const rated = ((top.data ?? []) as GameSummary[]).filter((g) => g.rating !== null);

  return {
    totals: totals.data as StatsTotals | null,
    recentlyAdded: (added.data ?? []) as GameSummary[],
    recentlyReviewed: (reviewed.data ?? []) as GameSummary[],
    topRated: rated.slice(0, 6),
    currentlyPlaying: (currently.data ?? []) as GameSummary[],
    featured: featured.data
      ? normalizeDetail(featured.data as unknown as RawDetail)
      : null,
  };
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------
export interface StatsTotals {
  total_games: number;
  completed: number;
  dropped: number;
  playing: number;
  backlog: number;
  on_hold: number;
  reviewed: number;
  average_rating: number | null;
  total_playtime_hours: number;
}

export async function getStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games, TAGS.taxonomy);

  const supabase = createPublicClient();
  const [totals, genres, platforms, ratings, years] = await Promise.all([
    supabase.from("stats_totals").select("*").maybeSingle(),
    supabase.from("stats_genres").select("name, games"),
    supabase.from("stats_platforms").select("name, games"),
    supabase.from("stats_rating_distribution").select("bucket, games"),
    supabase.from("stats_games_by_year").select("year, games"),
  ]);
  for (const r of [totals, genres, platforms, ratings, years]) {
    if (r.error) fail("getStats", r.error);
  }

  const t = totals.data as StatsTotals | null;
  return {
    totals: t && {
      ...t,
      average_rating: t.average_rating === null ? null : Number(t.average_rating),
      total_playtime_hours: Number(t.total_playtime_hours),
    },
    genres: (genres.data ?? []) as { name: string; games: number }[],
    platforms: (platforms.data ?? []) as { name: string; games: number }[],
    ratings: (ratings.data ?? []) as { bucket: number; games: number }[],
    years: (years.data ?? []) as { year: number; games: number }[],
  };
}
