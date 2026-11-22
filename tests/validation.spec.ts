import { expect, test } from "@playwright/test";
import { decimalPoint, stripAsterisks } from "../src/lib/text";
import { gameSchema } from "../src/lib/validation";

// The rules the server applies to a game before saving it, without a browser.
const base = {
  title: "A game",
  slug: "a-game",
  short_description: "",
  description: "",
  release_date: "",
  release_year_only: false,
  developer: "",
  publisher: "",
  genre_ids: [],
  platform_ids: [],
  launchers: [],
  rating: "",
  play_status: "completed",
  completion_status: "none",
  playtime_hours: "",
  completed_on: "",
  review_en: "",
  review_it: "",
  pros: "",
  cons: "",
  featured: false,
  is_online: false,
  rank: "",
};

test.describe("release date", () => {
  test("a year alone is saved as the 1st of January of that year; a full date and an empty date stay as they are", () => {
    expect(gameSchema.parse({ ...base, release_date: "1997" }).release_date).toBe("1997-01-01");
    expect(gameSchema.parse({ ...base, release_date: " 2005 " }).release_date).toBe("2005-01-01");
    expect(gameSchema.parse({ ...base, release_date: "2021-06-15" }).release_date).toBe("2021-06-15");
    expect(gameSchema.parse({ ...base, release_date: "" }).release_date).toBeNull();
  });

  test("anything else is rejected", () => {
    for (const bad of ["97", "19977", "1997-13-40", "abc", "1850", "2500", "1997/06/15"]) {
      expect(gameSchema.safeParse({ ...base, release_date: bad }).success, bad).toBe(false);
    }
  });
});

test.describe("developer", () => {
  test("a long list of studios fits (Assassin's Creed Odyssey), but not an unbounded one", () => {
    const studios = "Ubisoft Quebec, Ubisoft Montreal, Ubisoft Bucharest, Ubisoft Singapore, Ubisoft Montpellier, Ubisoft Kiev, Ubisoft Shanghai";
    expect(studios.length).toBeGreaterThan(120);
    expect(gameSchema.parse({ ...base, developer: studios }).developer).toBe(studios);
    expect(gameSchema.safeParse({ ...base, developer: "x".repeat(301) }).success).toBe(false);
  });
});

test.describe("play status", () => {
  test("'occasional' (played now and then) is only for online games", () => {
    expect(gameSchema.safeParse({ ...base, is_online: true, play_status: "occasional", completion_status: "none" }).success).toBe(true);
    const offline = gameSchema.safeParse({ ...base, is_online: false, play_status: "occasional" });
    expect(offline.success).toBe(false);
    // an online game can be playing, occasional, on hold or dropped, never completed
    for (const ok of ["playing", "occasional", "on_hold", "dropped"]) {
      expect(gameSchema.safeParse({ ...base, is_online: true, play_status: ok }).success, ok).toBe(true);
    }
    expect(gameSchema.safeParse({ ...base, is_online: true, play_status: "completed" }).success).toBe(false);
  });
});

test.describe("pros and cons", () => {
  test("never end with a full stop, whatever was typed or pasted", () => {
    const parsed = gameSchema.parse({
      ...base,
      pros: "Great world.\nFast combat . \nWait for it...\nNo dots at all\nVersion 2.5 is out",
      cons: "Too long.\n.\nStill fine",
    });
    expect(parsed.pros).toEqual(["Great world", "Fast combat", "Wait for it", "No dots at all", "Version 2.5 is out"]);
    expect(parsed.cons).toEqual(["Too long", "Still fine"]);
  });

  test("never start with a dash or bullet (a pasted list), but keep hyphens inside words", () => {
    const parsed = gameSchema.parse({
      ...base,
      pros: "- Great world\n-Fast combat\n\u2013 Tight controls\n\u2014 Nice music\n\u2022 Good story\n* Pretty\nCompletely free-to-play",
      cons: " - Short\n-- Dated\n- .\n- Version 2.5 bugs.",
    });
    expect(parsed.pros).toEqual([
      "Great world",
      "Fast combat",
      "Tight controls",
      "Nice music",
      "Good story",
      "Pretty",
      "Completely free-to-play",
    ]);
    expect(parsed.cons).toEqual(["Short", "Dated", "Version 2.5 bugs"]);
  });
});

test.describe("pasted asterisks", () => {
  test("stripAsterisks removes every asterisk and nothing else", () => {
    expect(stripAsterisks("**bold** and *italic*")).toBe("bold and italic");
    expect(stripAsterisks("no markers here")).toBe("no markers here");
    expect(stripAsterisks("***")).toBe("");
  });

  test("texts are saved without asterisks: reviews, descriptions, pros and cons", () => {
    const parsed = gameSchema.parse({
      ...base,
      short_description: "A *short* one",
      description: "The **long** description",
      review_en: "Despite these issues, **it is an outstanding platformer** that proves a lot.",
      review_it: "Un **ottimo** gioco",
      pros: "*Fast*\n**Stable**\n",
      cons: "  *Short*  ",
    });
    expect(parsed.short_description).toBe("A short one");
    expect(parsed.description).toBe("The long description");
    expect(parsed.review_en).toBe("Despite these issues, it is an outstanding platformer that proves a lot.");
    expect(parsed.review_it).toBe("Un ottimo gioco");
    expect(parsed.pros).toEqual(["Fast", "Stable"]);
    expect(parsed.cons).toEqual(["Short"]);
  });

  test("a text made only of asterisks counts as empty, and the pair-of-languages rule still holds", () => {
    expect(gameSchema.parse({ ...base, review_en: "**", review_it: "*" }).review_en).toBeNull();
    const result = gameSchema.safeParse({ ...base, review_en: "**Only English**" });
    expect(result.success).toBe(false); // the Italian version is still required
  });

  test("decimals use a dot: a comma is turned into one, and nothing else changes", () => {
    const parsed = gameSchema.parse({ ...base, rating: "8,5", playtime_hours: "12,25" });
    expect(parsed.rating).toBe(8.5);
    expect(parsed.playtime_hours).toBe(12.3); // one decimal, like the rating
    expect(gameSchema.parse({ ...base, rating: "9.5", playtime_hours: "100" }).playtime_hours).toBe(100);
    expect(decimalPoint("1,5")).toBe("1.5");
    expect(gameSchema.safeParse({ ...base, rating: "8,5,1" }).success).toBe(false);
    // scores go from 1 to 10: 1 and 10 are fine, 0.5 and 10.5 are not
    expect(gameSchema.parse({ ...base, rating: "1" }).rating).toBe(1);
    expect(gameSchema.parse({ ...base, rating: "10" }).rating).toBe(10);
    expect(gameSchema.safeParse({ ...base, rating: "0.5" }).success).toBe(false);
    expect(gameSchema.safeParse({ ...base, rating: "10.5" }).success).toBe(false);
  });
});
