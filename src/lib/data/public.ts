import { cacheLife, cacheTag } from "next/cache";
import { splitDevelopers } from "@/lib/developers";
import { excerpt, slugify } from "@/lib/format";
import { createPublicClient } from "@/lib/supabase/public";
import { LAUNCHER_NAME } from "@/lib/types";
import type { SearchEntry } from "@/lib/search-index";
import type {
  GameDetail,
  GameSummary,
  LibraryRecord,
  ReviewEntry,
  Taxonomy,
} from "@/lib/types";

/** Cache tags, invalidated by the CMS server actions. */
export const TAGS = { games: "games", taxonomy: "taxonomy" } as const;

function fail(scope: string, error: { message: string }): never {
  throw new Error(`[${scope}] ${error.message}`);
}

// ---------------------------------------------------------------------------
// Library / reviews
// ---------------------------------------------------------------------------
/** The library is small enough to ship whole to the browser, which then filters it instantly. */
const LIBRARY_MAX = 1000;

/** Every game, newest first, without the review texts: the browser does the searching and filtering. */
export async function getLibraryGames(): Promise<LibraryRecord[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games, TAGS.taxonomy);

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("library_search", {
    p_sort: "added",
    p_limit: LIBRARY_MAX,
    p_offset: 0,
  });
  if (error) fail("getLibraryGames", error);

  return ((data ?? []) as (GameSummary & { completed_on: string | null })[]).map(
    (g): LibraryRecord => ({
      id: g.id,
      slug: g.slug,
      title: g.title,
      release_date: g.release_date,
      developer: g.developer,
      publisher: g.publisher,
      rating: g.rating === null ? null : Number(g.rating),
      play_status: g.play_status,
      completion_status: g.completion_status,
      playtime_hours: g.playtime_hours === null ? null : Number(g.playtime_hours),
      cover_path: g.cover_path,
      cover_blur: g.cover_blur,
      created_at: g.created_at,
      completed_on: g.completed_on ?? null,
      is_online: g.is_online,
      launchers: g.launchers,
      genres: g.genres,
      platforms: g.platforms,
    }),
  );
}

/** Every reviewed game with the start of its reviews (in both languages), for the Reviews page. */
export async function getReviewEntries(): Promise<ReviewEntry[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games, TAGS.taxonomy);

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("library_search", {
    p_reviewed_only: true,
    p_sort: "added",
    p_limit: LIBRARY_MAX,
    p_offset: 0,
  });
  if (error) fail("getReviewEntries", error);

  return ((data ?? []) as (GameSummary & { completed_on: string | null })[]).map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    release_date: g.release_date,
    developer: g.developer,
    publisher: g.publisher,
    rating: g.rating === null ? null : Number(g.rating),
    play_status: g.play_status,
    completion_status: g.completion_status,
    playtime_hours: g.playtime_hours === null ? null : Number(g.playtime_hours),
    cover_path: g.cover_path,
    cover_blur: g.cover_blur,
    created_at: g.created_at,
    completed_on: g.completed_on ?? null,
    is_online: g.is_online,
    launchers: g.launchers,
    genres: g.genres,
    platforms: g.platforms,
    excerpt_en: excerpt(g.review_en, 360),
    excerpt_it: g.review_it ? excerpt(g.review_it, 360) : null,
  }));
}

/** The latest reviews with their full English text, for the RSS feed. */
export async function getFeedReviews(limit = 20) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("library_search", {
    p_reviewed_only: true,
    p_sort: "added",
    p_limit: limit,
    p_offset: 0,
  });
  if (error) fail("getFeedReviews", error);

  return ((data ?? []) as GameSummary[]).map((g) => ({
    slug: g.slug,
    title: g.title,
    rating: g.rating === null ? null : Number(g.rating),
    created_at: g.created_at,
    review: g.review_en ?? "",
  }));
}

/** Everything the sitemap lists: the games (with their last change) and the pages of developers and publishers. */
export async function getSitemapData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();
  const [games, developers, publishers] = await Promise.all([
    supabase.from("games").select("slug, updated_at"),
    supabase.from("filter_developers").select("name"),
    supabase.from("filter_publishers").select("name"),
  ]);
  for (const r of [games, developers, publishers]) if (r.error) fail("getSitemapData", r.error);

  const slugsOf = (rows: { name: unknown }[] | null) =>
    [...new Set((rows ?? []).flatMap((r) => splitDevelopers(r.name as string).map((n) => slugify(n))))].filter(Boolean);
  return {
    games: (games.data ?? []) as { slug: string; updated_at: string | null }[],
    developers: slugsOf(developers.data),
    publishers: slugsOf(publishers.data),
  };
}

/** Every title with a few details, for the navbar search. */
export async function getSearchIndex(): Promise<SearchEntry[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  return (await getLibraryGames()).map((g) => ({
    slug: g.slug,
    title: g.title,
    developer: g.developer,
    publisher: g.publisher,
    year: g.release_date ? Number(g.release_date.slice(0, 4)) : null,
    rating: g.rating,
    cover_path: g.cover_path,
    cover_blur: null, // the thumbnails are tiny: no placeholder needed, and the list stays light
  }));
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
  platforms:game_platforms(platform:platforms(id, name, slug))
`;

type RawDetail = Omit<GameDetail, "genres" | "platforms"> & {
  genres: { genre: Taxonomy }[];
  platforms: { platform: Taxonomy }[];
};

export function normalizeDetail(raw: RawDetail): GameDetail {
  const byName = (a: Taxonomy, b: Taxonomy) => a.name.localeCompare(b.name);
  return {
    ...raw,
    rating: raw.rating === null ? null : Number(raw.rating),
    playtime_hours: raw.playtime_hours === null ? null : Number(raw.playtime_hours),
    genres: raw.genres.map((g) => g.genre).sort(byName),
    platforms: raw.platforms.map((p) => p.platform).sort(byName),
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

type CompanyGames = { name: string; games: GameSummary[] } | null;

/** Everything one developer made (null when the slug matches nobody). */
export async function getDeveloperGames(slug: string): Promise<CompanyGames> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);
  return companyGames("developer", slug);
}

/** Everything one publisher released (null when the slug matches nobody). */
export async function getPublisherGames(slug: string): Promise<CompanyGames> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);
  return companyGames("publisher", slug);
}

async function companyGames(field: "developer" | "publisher", slug: string): Promise<CompanyGames> {
  const supabase = createPublicClient();

  // 1. The field lists one or several companies, so find the name behind this slug.
  const { data: options, error: optionsError } = await supabase
    .from(field === "developer" ? "filter_developers" : "filter_publishers")
    .select("name, games");
  if (optionsError) fail("companyGames", optionsError);

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
    .ilike(field, pattern);
  if (error) fail("companyGames", error);

  type Row = Omit<GameSummary, "genres" | "platforms" | "total_count" | "rating" | "playtime_hours"> & {
    rating: number | string | null;
    playtime_hours: number | string | null;
    genres: { genre: Taxonomy }[];
    platforms: { platform: Taxonomy }[];
  };
  const byName = (a: Taxonomy, b: Taxonomy) => a.name.localeCompare(b.name);
  const games = ((data ?? []) as unknown as Row[])
    .filter((g) => splitDevelopers(g[field]).some((n) => slugify(n) === slug))
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
// Preview images (Open Graph): numbers and a few covers
// ---------------------------------------------------------------------------
export async function getOgOverview() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();
  const [totals, top, recent] = await Promise.all([
    supabase.from("stats_totals").select("*").maybeSingle(),
    supabase
      .from("games")
      .select("cover_path")
      .not("cover_path", "is", null)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(12),
    supabase
      .from("games")
      .select("cover_path")
      .not("cover_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  for (const r of [totals, top, recent]) {
    if (r.error) fail("getOgOverview", r.error);
  }
  const t = totals.data as StatsTotals | null;
  const paths = (rows: { cover_path: string | null }[] | null) =>
    (rows ?? []).map((r) => r.cover_path).filter((p): p is string => Boolean(p));
  return {
    games: t?.total_games ?? 0,
    hours: Number(t?.total_playtime_hours ?? 0),
    average: t?.average_rating === null || t?.average_rating === undefined ? null : Number(t.average_rating),
    topCovers: paths(top.data),
    recentCovers: paths(recent.data),
  };
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
/** The home page carousel shows the reviews of games rated at least this much, at most STANDOUT_MAX of them. */
const STANDOUT_MIN_RATING = 9;
const STANDOUT_MAX = 5;

/** The home page "Recently added" shelf only shows games added within this many days. */
const RECENT_DAYS = 7;

export async function getHomeData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games);

  const supabase = createPublicClient();
  const search = (sort: string, extra: Record<string, unknown> = {}, limit = 8) =>
    supabase.rpc("library_search", { p_sort: sort, p_limit: limit, p_offset: 0, ...extra });

  const [totals, added, top, featured, lowest, genreCounts, standout, developerNames, library] = await Promise.all([
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
    search("rating_desc", { p_min_rating: STANDOUT_MIN_RATING, p_reviewed_only: true }, STANDOUT_MAX),
    supabase.from("filter_developers").select("name"),
    getLibraryGames(),
  ]);
  for (const r of [totals, added, top, featured, lowest, genreCounts, standout, developerNames]) {
    if (r.error) fail("getHomeData", r.error);
  }

  const rated = ((top.data ?? []) as GameSummary[]).filter((g) => g.rating !== null);

  // How many different studios the archive covers (one field may list several: "A, B" counts both).
  const studios = new Set(
    (developerNames.data ?? []).flatMap((row) => splitDevelopers(row.name as string).map((n) => slugify(n))),
  );
  studios.delete("");

  // "The blunt truth": the lowest rated games, never the same ones as the highest rated shelf.
  const topIds = new Set(rated.slice(0, 6).map((g) => g.id));
  const lowestRated = ((lowest.data ?? []) as GameSummary[])
    .filter((g) => g.rating !== null && !topIds.has(g.id))
    .slice(0, 6);

  // The ten biggest genres, for the "Browse by genre" tiles (the Genres page lists them all).
  const genreTiles = toGenreList(genreCounts.data).slice(0, 10);

  // The covers of the best rated games, for the wall behind the hero.
  const heroCovers = library
    .filter((g) => g.cover_path && g.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title))
    .slice(0, 18)
    .map((g) => g.cover_path as string);

  const recentSince = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const recent = ((added.data ?? []) as GameSummary[]).filter((g) => new Date(g.created_at).getTime() >= recentSince);

  return {
    totals: totals.data as StatsTotals | null,
    recentlyAdded: recent,
    topRated: rated.slice(0, 6),
    lowestRated,
    genreTiles,
    studioCount: studios.size,
    heroCovers,
    standout: ((standout.data ?? []) as GameSummary[]).filter((g) => g.rating !== null),
    featured: featured.data
      ? normalizeDetail(featured.data as unknown as RawDetail)
      : null,
  };
}

type GenreRow = { id: string; name: string; game_genres: { count: number }[] };

/** Genres with at least one game, biggest first. */
function toGenreList(rows: unknown): { id: string; name: string; games: number }[] {
  return ((rows ?? []) as GenreRow[])
    .map((g) => ({ id: g.id, name: g.name, games: Number(g.game_genres?.[0]?.count ?? 0) }))
    .filter((g) => g.games > 0)
    .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
}

/** Every genre that has games, with how many, for the Genres page. */
export async function getGenreList() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.games, TAGS.taxonomy);

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("genres").select("id, name, game_genres(count)");
  if (error) fail("getGenreList", error);
  return toGenreList(data);
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------
interface StatsTotals {
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
  const [totals, genres, platforms, ratings, years, library] = await Promise.all([
    supabase.from("stats_totals").select("*").maybeSingle(),
    supabase.from("stats_genres").select("name, games"),
    supabase.from("stats_platforms").select("name, games"),
    supabase.from("stats_rating_distribution").select("bucket, games"),
    supabase.from("stats_games_by_year").select("year, games"),
    getLibraryGames(),
  ]);
  for (const r of [totals, genres, platforms, ratings, years]) {
    if (r.error) fail("getStats", r.error);
  }

  // The figures that need no view of their own: counted from the games themselves.
  const launcherCounts = new Map<string, number>();
  for (const g of library) {
    if (g.launchers.length === 0) launcherCounts.set("Console / none", (launcherCounts.get("Console / none") ?? 0) + 1);
    for (const id of g.launchers) launcherCounts.set(LAUNCHER_NAME[id] ?? id, (launcherCounts.get(LAUNCHER_NAME[id] ?? id) ?? 0) + 1);
  }
  const launchers = [...launcherCounts.entries()]
    .map(([name, games]) => ({ name, games }))
    .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
  const online = library.filter((g) => g.is_online).length;
  const mostPlayed = library
    .filter((g) => (g.playtime_hours ?? 0) > 0)
    .sort((a, b) => (b.playtime_hours ?? 0) - (a.playtime_hours ?? 0))
    .slice(0, 5)
    .map((g) => ({ title: g.title, hours: g.playtime_hours ?? 0 }));

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
    launchers,
    types: { solo: library.length - online, online },
    mostPlayed,
  };
}
