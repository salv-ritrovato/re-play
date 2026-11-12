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
  });
});
