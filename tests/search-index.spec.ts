import { expect, test } from "@playwright/test";
import { searchEntries, type SearchEntry } from "../src/lib/search-index";

// The ranking behind the navbar search, without a browser.
const entry = (title: string, developer: string | null = null, publisher: string | null = null): SearchEntry => ({
  slug: title.toLowerCase().replace(/\W+/g, "-"),
  title,
  developer,
  publisher,
  year: null,
  rating: null,
  cover_path: null,
  cover_blur: null,
});

const entries = [
  entry("Batman: Arkham Knight", "Rocksteady Studios", "Warner Bros."),
  entry("Arkham Asylum Redux", "Rocksteady Studios"),
  entry("The Witcher 3", "CD Projekt RED"),
  entry("Pokémon Legends: Arceus", "Game Freak", "Nintendo"),
];
const titles = (query: string) => searchEntries(entries, query).items.map((e) => e.title);

test.describe("navbar search ranking", () => {
  test("titles that start with the query come first, then titles that contain it", () => {
    expect(titles("arkham")).toEqual(["Arkham Asylum Redux", "Batman: Arkham Knight"]);
  });

  test("every word has to match, in any order, and the developer and publisher count too", () => {
    expect(titles("knight batman")).toEqual(["Batman: Arkham Knight"]);
    expect(titles("rocksteady")).toEqual(["Arkham Asylum Redux", "Batman: Arkham Knight"]);
    expect(titles("nintendo")).toEqual(["Pokémon Legends: Arceus"]);
  });

  test("case and accents do not matter", () => {
    expect(titles("POKEMON")).toEqual(["Pokémon Legends: Arceus"]);
    expect(titles("pokémon")).toEqual(["Pokémon Legends: Arceus"]);
  });

  test("an empty or unmatched query finds nothing, and the list is capped with the real total", () => {
    expect(titles("")).toEqual([]);
    expect(titles("   ")).toEqual([]);
    expect(titles("zzzz")).toEqual([]);
    const many = Array.from({ length: 20 }, (_, i) => entry(`Game ${i}`));
    expect(searchEntries(many, "game", 6)).toMatchObject({ total: 20 });
    expect(searchEntries(many, "game", 6).items).toHaveLength(6);
  });
});
