import { expect, test } from "@playwright/test";
import { formatRating, ratingTier } from "../src/lib/format";

// Pure formatting rules, no browser.
test.describe("rating format", () => {
  test("ratings have one decimal, except 10, the top of the scale", () => {
    expect(formatRating(10)).toBe("10");
    expect(formatRating("10.0" as unknown as number)).toBe("10");
    expect(formatRating(9.96)).toBe("10"); // rounds up to the top
    expect(formatRating(9.5)).toBe("9.5");
    expect(formatRating(9)).toBe("9.0");
    expect(formatRating(0)).toBe("0.0");
    expect(formatRating(7.25)).toBe("7.3");
  });

  test("9 and above stand out, below 5 is a warning, the rest is neutral", () => {
    expect(ratingTier(10)).toBe("high");
    expect(ratingTier(9)).toBe("high");
    expect(ratingTier(8.9)).toBe("mid");
    expect(ratingTier(5)).toBe("mid");
    expect(ratingTier(4.9)).toBe("low");
    expect(ratingTier(0)).toBe("low");
    expect(ratingTier(null)).toBe("mid");
    expect(ratingTier("9.5" as unknown as number)).toBe("high"); // numeric columns can arrive as text
  });

  test("no rating is a dash", () => {
    expect(formatRating(null)).toBe("-");
    expect(formatRating(undefined)).toBe("-");
  });
});
