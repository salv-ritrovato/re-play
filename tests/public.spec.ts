import { expect, test } from "@playwright/test";

test.describe("public navigation", () => {
  test("navigates between every main section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: "Re:Play" }).first()).toBeVisible();
    await expect(page.getByText("My journey through gaming").first()).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, url, heading] of [
      ["Library", /\/library$/, "Every game, in one place."],
      ["Reviews", /\/reviews$/, "What I thought."],
      ["Statistics", /\/statistics$/, "The journey in numbers."],
      ["About", /\/about$/, "Hi, I'm Salvatore."],
      ["Overview", /\/$/, null],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
      if (heading) await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("the about page tells the story in English and Italian", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1, name: "Hi, I'm Salvatore." })).toBeVisible();
    await expect(page.getByText("Jurassic War").first()).toBeVisible();
    await expect(page.getByText("World of Warcraft, Hearthstone, League of Legends, Rainbow Six: Siege", { exact: true })).toBeVisible();
    await expect(page.getByText("League of Legends and Rainbow Six: Siege")).toBeVisible();

    await page.getByRole("tab", { name: "Italiano" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ciao, sono Salvatore." })).toBeVisible();
    await expect(page.getByText("mia madre, che non c'è più")).toBeVisible();
    await expect(page.getByText("League of Legends e Rainbow Six: Siege")).toBeVisible();
    await expect(page.locator("div[lang=it]")).toBeVisible();

    await page.getByRole("tab", { name: "English" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Hi, I'm Salvatore." })).toBeVisible();
  });

  test("unknown routes and unknown games render the not-found page", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /isn't in the archive/ })).toBeVisible();

    await page.goto("/games/definitely-not-a-real-game");
    await expect(page.getByRole("heading", { name: /isn't in the archive/ })).toBeVisible();

    // The 404 page keeps the site chrome and offers a way out.
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse the library" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to the overview" })).toBeVisible();
  });

  test("library filters live in the URL and can be combined and cleared", async ({ page }) => {
    await page.goto("/library");
    await page.getByRole("button", { name: /Filters/ }).click();
    await page.getByRole("button", { name: "Completed", exact: true }).click();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(page).toHaveURL(/status=completed/);
    await expect(page).toHaveURL(/genre=/);
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page).not.toHaveURL(/status=/);
    await expect(page).not.toHaveURL(/genre=/);
  });

  test("invalid query params are ignored instead of crashing", async ({ page }) => {
    const res = await page.goto("/library?genre=not-a-uuid&min=abc&sort=hack&page=-4&status=nope");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Every game, in one place." })).toBeVisible();
  });
});
