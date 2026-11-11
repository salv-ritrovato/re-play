import { cacheLife, cacheTag } from "next/cache";
import { splitDevelopers } from "@/lib/developers";
import { slugify } from "@/lib/format";
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
    p_launchers: filters.launchers?.length ? filters.launchers : null,
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
  tags:game_tags(tag:tags(id, name, slug))
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
// Developer page: everything one studio made
// ---------------------------------------------------------------------------
const SUMMARY_SELECT = `
  id, slug, title, short_description, release_date, developer, publisher, rating,
  play_status, completion_status, playtime_hours, review_en, review_it,
  cover_path, cover_blur, created_at, is_online, launchers,
  genres:game_genres(genre:genres(id, name, slug)),
  platforms:game_platforms(platform:platforms(id, name, slug))
`;

export async function getDeveloperGames(
  slug: string,
): Promise<{ name: string; games: GameSummary[] } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();

  // 1. The developer field lists one or several studios, so find the name behind this slug.
  const { data: options, error: optionsError } = await supabase
    .from("filter_developers")
    .select("name, games");
  if (optionsError) fail("getDeveloperGames", optionsError);

  const spellings = new Map<string, number>();
  for (const option of options ?? []) {
    for (const name of splitDevelopers(option.name as string)) {
      if (slugify(name) === slug) spellings.set(name, (spellings.get(name) ?? 0) + Number(option.games));
    }
  }
  if (spellings.size === 0) return null;
  const [name] = [...spellings.entries()].sort((a, b) => b[1] - a[1])[0];

  // 2. Narrow down in the database, then keep only games where it really is one of the studios.
  const pattern = `%${name.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const { data, error } = await supabase
    .from("games")
    .select(SUMMARY_SELECT)
    .ilike("developer", pattern);
  if (error) fail("getDeveloperGames", error);

  type Row = Omit<GameSummary, "genres" | "platforms" | "total_count" | "rating" | "playtime_hours"> & {
    rating: number | string | null;
    playtime_hours: number | string | null;
    genres: { genre: Taxonomy }[];
    platforms: { platform: Taxonomy }[];
  };
  const byName = (a: Taxonomy, b: Taxonomy) => a.name.localeCompare(b.name);
  const games = ((data ?? []) as unknown as Row[])
    .filter((g) => splitDevelopers(g.developer).some((n) => slugify(n) === slug))
    .map<GameSummary>((g) => ({
      ...g,
      rating: g.rating === null ? null : Number(g.rating),
      playtime_hours: g.playtime_hours === null ? null : Number(g.playtime_hours),
      genres: g.genres.map((x) => x.genre).sort(byName),
      platforms: g.platforms.map((x) => x.platform).sort(byName),
      total_count: 0,
    }))
    // Newest first; games without a release date go last.
    .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? "") || a.title.localeCompare(b.title));

  if (games.length === 0) return null;
  return { name, games: games.map((g) => ({ ...g, total_count: games.length })) };
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
/** The home page "Recently added" shelf only shows games added within this many days. */
export const RECENT_DAYS = 7;

export async function getHomeData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();
  const search = (sort: string, extra: Record<string, unknown> = {}, limit = 8) =>
    supabase.rpc("library_search", { p_sort: sort, p_limit: limit, p_offset: 0, ...extra });

  const [totals, added, top, featured, lowest, genreCounts] = await Promise.all([
    supabase.from("stats_totals").select("*").maybeSingle(),
    search("added"),
    search("rating_desc", { p_min_rating: 0 }),
    supabase
      .from("games")
      .select(DETAIL_SELECT)
      .eq("featured", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    search("rating_asc", { p_min_rating: 0 }),
    supabase.from("genres").select("id, name, game_genres(count)"),
  ]);
  for (const r of [totals, added, top, featured, lowest, genreCounts]) {
    if (r.error) fail("getHomeData", r.error);
  }

  const rated = ((top.data ?? []) as GameSummary[]).filter((g) => g.rating !== null);
  // "The blunt truth": the lowest rated games, never the same ones as the highest rated shelf.
  const topIds = new Set(rated.slice(0, 6).map((g) => g.id));
  const lowestRated = ((lowest.data ?? []) as GameSummary[])
    .filter((g) => g.rating !== null && !topIds.has(g.id))
    .slice(0, 6);

  // Genres with at least one game, biggest first, for the "Browse by genre" tiles.
  type GenreRow = { id: string; name: string; game_genres: { count: number }[] };
  const genreTiles = ((genreCounts.data ?? []) as unknown as GenreRow[])
    .map((g) => ({ id: g.id, name: g.name, games: Number(g.game_genres?.[0]?.count ?? 0) }))
    .filter((g) => g.games > 0)
    .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name))
    .slice(0, 10);

  const recentSince = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const recent = ((added.data ?? []) as GameSummary[]).filter((g) => new Date(g.created_at).getTime() >= recentSince);

  return {
    totals: totals.data as StatsTotals | null,
    recentlyAdded: recent,
    topRated: rated.slice(0, 6),
    lowestRated,
    genreTiles,
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
