import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { filterLibrary } from "../src/lib/library-filter";
import { SORT_OPTIONS, type LibraryFilters, type LibraryRecord } from "../src/lib/types";

// Not a browser test: the in-browser library filter against fixtures, and against the database's own search.

const base: LibraryFilters = { sort: "added", page: 1, view: "grid" };

function game(over: Partial<LibraryRecord> & { id: string }): LibraryRecord {
  return {
    slug: over.id,
    title: over.id,
    release_date: null,
    developer: null,
    publisher: null,
    rating: null,
    play_status: "completed",
    completion_status: "main_story",
    playtime_hours: null,
    cover_path: null,
    cover_blur: null,
    created_at: "2026-01-01T00:00:00Z",
    completed_on: null,
    is_online: false,
    launchers: [],
    genres: [],
    platforms: [],
    ...over,
  } as LibraryRecord;
}

const tax = (id: string) => ({ id, name: id, slug: id });

const games = [
  game({ id: "a", title: "Alpha", developer: "Valve", rating: 9, release_date: "2020-05-01", genres: [tax("g1")], created_at: "2026-01-03T00:00:00Z", launchers: ["steam"] }),
  game({ id: "b", title: "beta", developer: "Ubisoft", publisher: "Ubisoft", rating: 6.5, release_date: "2018-01-01", genres: [tax("g1"), tax("g2")], platforms: [tax("p1")], created_at: "2026-01-02T00:00:00Z" }),
  game({ id: "c", title: "Gamma", developer: "Valve", rating: null, release_date: null, is_online: true, created_at: "2026-01-01T00:00:00Z", completed_on: "2025-12-31" }),
];

const ids = (list: LibraryRecord[]) => list.map((g) => g.id);

test.describe("library filter (in the browser)", () => {
  test("searches title, developer and publisher without caring about case", () => {
    expect(ids(filterLibrary(games, { ...base, q: "ALPH" }))).toEqual(["a"]);
    expect(ids(filterLibrary(games, { ...base, q: "valve" }))).toEqual(["a", "c"]);
    expect(ids(filterLibrary(games, { ...base, q: "ubi" }))).toEqual(["b"]);
    expect(filterLibrary(games, { ...base, q: "nothing like this" })).toEqual([]);
  });

  test("within a group any match counts, across groups all must match", () => {
    expect(ids(filterLibrary(games, { ...base, genres: ["g1", "g2"] }))).toEqual(["a", "b"]);
    expect(ids(filterLibrary(games, { ...base, genres: ["g2"] }))).toEqual(["b"]);
    expect(ids(filterLibrary(games, { ...base, genres: ["g1"], developer: "Valve" }))).toEqual(["a"]);
    expect(ids(filterLibrary(games, { ...base, years: [2018, 2020] }))).toEqual(["a", "b"]);
    expect(ids(filterLibrary(games, { ...base, online: true }))).toEqual(["c"]);
    expect(ids(filterLibrary(games, { ...base, online: false }))).toEqual(["a", "b"]);
    expect(ids(filterLibrary(games, { ...base, launchers: ["steam"] }))).toEqual(["a"]);
    expect(ids(filterLibrary(games, { ...base, platforms: ["p1"] }))).toEqual(["b"]);
  });

  test("a rating range leaves out the games without a rating", () => {
    expect(ids(filterLibrary(games, { ...base, minRating: 0 }))).toEqual(["a", "b"]);
    expect(ids(filterLibrary(games, { ...base, minRating: 7 }))).toEqual(["a"]);
    expect(ids(filterLibrary(games, { ...base, maxRating: 7 }))).toEqual(["b"]);
  });

  test("sorts like the database does: missing values last, ties by recently added", () => {
    expect(ids(filterLibrary(games, { ...base, sort: "rating_desc" }))).toEqual(["a", "b", "c"]);
    expect(ids(filterLibrary(games, { ...base, sort: "rating_asc" }))).toEqual(["b", "a", "c"]);
    expect(ids(filterLibrary(games, { ...base, sort: "title" }))).toEqual(["a", "b", "c"]);
    expect(ids(filterLibrary(games, { ...base, sort: "release_desc" }))).toEqual(["a", "b", "c"]);
    expect(ids(filterLibrary(games, { ...base, sort: "release_asc" }))).toEqual(["b", "a", "c"]);
    expect(ids(filterLibrary(games, { ...base, sort: "played" }))).toEqual(["c", "a", "b"]);
    expect(ids(filterLibrary(games, base))).toEqual(["a", "b", "c"]);
  });

  test("never changes the list it is given", () => {
    const copy = ids(games);
    filterLibrary(games, { ...base, sort: "title" });
    expect(ids(games)).toEqual(copy);
  });
});

test.describe("library filter against the real database", () => {
  test("gives the same games in the same order as library_search", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    test.skip(!url || !key, "needs the Supabase variables from .env.local");
    const supabase = createClient(url!, key!);

    const { data, error } = await supabase.rpc("library_search", { p_sort: "added", p_limit: 1000, p_offset: 0 });
    expect(error).toBeNull();
    const all = (data ?? []).map((g: LibraryRecord) => ({ ...g, rating: g.rating === null ? null : Number(g.rating) })) as LibraryRecord[];
    test.skip(all.length === 0, "needs games in the archive");

    const first = all[0];
    const filterSets: { name: string; filters: Partial<LibraryFilters>; rpc: Record<string, unknown> }[] = [
      { name: "nothing", filters: {}, rpc: {} },
      { name: "search", filters: { q: "a" }, rpc: { p_query: "a" } },
      { name: "search (two words)", filters: { q: "of" }, rpc: { p_query: "of" } },
      { name: "genre", filters: { genres: [first.genres[0]?.id ?? "x"] }, rpc: { p_genres: [first.genres[0]?.id ?? "x"] } },
      { name: "platform", filters: { platforms: [first.platforms[0]?.id ?? "x"] }, rpc: { p_platforms: [first.platforms[0]?.id ?? "x"] } },
      { name: "rating range", filters: { minRating: 7, maxRating: 9 }, rpc: { p_min_rating: 7, p_max_rating: 9 } },
      { name: "online", filters: { online: true }, rpc: { p_online: true } },
      { name: "single-player", filters: { online: false }, rpc: { p_online: false } },
      { name: "launcher", filters: { launchers: ["steam"] }, rpc: { p_launchers: ["steam"] } },
      { name: "status", filters: { status: ["completed"] }, rpc: { p_play_status: ["completed"] } },
      { name: "developer", filters: { developer: first.developer ?? undefined }, rpc: { p_developer: first.developer } },
    ];

    for (const { name, filters, rpc } of filterSets) {
      for (const { value: sort } of SORT_OPTIONS) {
        const expected = await supabase.rpc("library_search", { p_sort: sort, p_limit: 1000, p_offset: 0, ...rpc });
        expect(expected.error).toBeNull();
        const want = (expected.data ?? []).map((g: { id: string }) => g.id);
        const got = ids(filterLibrary(all, { ...base, ...filters, sort }));
        expect(got, `${name}, sorted by ${sort}`).toEqual(want);
      }
    }
  });
});
