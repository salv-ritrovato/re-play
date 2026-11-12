import { expect, test } from "@playwright/test";
import { formatRating } from "../src/lib/format";

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

  test("no rating is a dash", () => {
    expect(formatRating(null)).toBe("-");
    expect(formatRating(undefined)).toBe("-");
  });
});
