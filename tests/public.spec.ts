import { expect, test } from "@playwright/test";

test.describe("public navigation", () => {
  test("navigates between every main section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: "Re:Play" }).first()).toBeVisible();
    await expect(page.getByText("My journey through gaming").first()).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, url, heading] of [
      ["Library", /\/library$/, "My collection of games"],
      ["Reviews", /\/reviews$/, "What I thought"],
      ["Statistics", /\/statistics$/, "The journey in numbers"],
      ["About", /\/about$/, "Hi, I'm Salvatore"],
      ["Overview", /\/$/, null],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
      if (heading) await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("the about page tells the story in English and Italian", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1, name: "Hi, I'm Salvatore" })).toBeVisible();
    await expect(page.getByText("Jurassic War").first()).toBeVisible();
    await expect(page.getByText("World of Warcraft, Hearthstone, League of Legends, Rainbow Six: Siege", { exact: true })).toBeVisible();
    await expect(page.getByText("League of Legends and Rainbow Six: Siege")).toBeVisible();
    await expect(page.getByText("as a kid I dreamed of becoming a game reviewer, a critic")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Beyond the games" })).toBeVisible();
    await expect(page.getByText("anime, manga, comics, TV series, fantasy books")).toBeVisible();
    await expect(page.getByText("AI-Assisted Software Developer")).toBeVisible();
    await expect(page.getByText("bodybuilding in particular")).toBeVisible();

    const steam = page.getByRole("complementary").getByRole("link", { name: /My Steam profile/ });
    await expect(steam).toHaveAttribute("href", "https://steamcommunity.com/profiles/76561198066959401/");
    await expect(steam).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: /Steam/ })).toBeVisible();

    await page.getByRole("tab", { name: "Italiano" }).click();
    await expect(page.getByRole("link", { name: /Il mio profilo Steam/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Ciao, sono Salvatore" })).toBeVisible();
    await expect(page.getByText("mia madre, che non c'è più")).toBeVisible();
    await expect(page.getByText("League of Legends e Rainbow Six: Siege")).toBeVisible();
    await expect(page.getByText("da ragazzino avevo il sogno di fare il recensore, il critico")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Oltre i videogiochi" })).toBeVisible();
    await expect(page.getByText("anime, manga, fumetti, serie TV, libri fantasy")).toBeVisible();
    await expect(page.locator("div[lang=it]")).toBeVisible();

    await page.getByRole("tab", { name: "English" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Hi, I'm Salvatore" })).toBeVisible();
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

  test("the home page invites to explore: genres, a random game, who is behind it", async ({ page, request }) => {
    await page.goto("/");
    test.skip(await page.getByText("Nothing here yet").isVisible(), "needs at least one game in the archive");

    // Genre tiles open the library already filtered.
    const genres = page.locator("section").filter({ has: page.getByRole("heading", { name: "Browse by genre" }) });
    const tiles = genres.getByRole("list").getByRole("link"); // (the section header has its own "All games" link)
    await expect(tiles.first()).toBeVisible();
    await tiles.first().click();
    await expect(page).toHaveURL(/\/library\?genre=[0-9a-f-]{36}$/);

    // "The blunt truth" never repeats the highest rated shelf.
    await page.goto("/");
    const titlesIn = async (heading: string) => {
      const shelf = page.locator("section").filter({ has: page.getByRole("heading", { name: heading, exact: true }) });
      return (await shelf.locator("h3").allInnerTexts()).map((t) => t.trim());
    };
    const lowest = await titlesIn("Lowest rated");
    const highest = await titlesIn("Highest rated");
    expect(lowest.filter((t) => highest.includes(t))).toEqual([]);

    // "Surprise me" lands on a game page, and the route itself is a redirect.
    await page.getByRole("link", { name: /Surprise me/ }).click();
    await expect(page).toHaveURL(/\/games\/[a-z0-9-]+$/);
    const res = await request.get("/random", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/(games\/[a-z0-9-]+|library)$/);
    expect(res.headers()["cache-control"]).toContain("no-store");

    // Every click leads to a different title: never the same twice in a row, and no repeats while the
    // archive still has unseen games (the request context keeps the memory cookie, like a browser).
    await page.goto("/library");
    const total = Number((await page.getByText(/^\d+ games?/).first().innerText()).match(/\d+/)![0]);
    const picks: string[] = [];
    for (let i = 0; i < Math.min(8, total - 1); i++) {
      const r = await request.get("/random", { maxRedirects: 0 });
      picks.push(r.headers()["location"]);
    }
    expect(new Set(picks).size).toBe(picks.length);

    // A short word about the owner, with the way to the About page.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Who's behind the reviews" })).toBeVisible();
    await page.getByRole("link", { name: /More about me/ }).click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test("the footer keeps the owner's profiles apart from the site links", async ({ page }) => {
    await page.goto("/");
    const social = page.getByRole("list", { name: "Social links" });
    const expected = {
      Steam: "https://steamcommunity.com/profiles/76561198066959401/",
      Instagram: "https://www.instagram.com/salv.ritrovato/",
      AniList: "https://anilist.co/home",
      inLumine: "https://www.inlumine.it/",
    };
    for (const [name, href] of Object.entries(expected)) {
      const link = social.getByRole("link", { name: new RegExp(name) });
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
    // The site links stay a separate group, without the outside profiles.
    const siteLinks = page.getByRole("navigation", { name: "Footer" });
    await expect(siteLinks.getByRole("link", { name: "Library" })).toBeVisible();
    await expect(siteLinks.getByRole("link", { name: /Steam|Instagram|AniList|inLumine/ })).toHaveCount(0);
  });

  test("an unknown developer renders the not-found page", async ({ page }) => {
    await page.goto("/developers/nobody-ever-made-this");
    await expect(page.getByRole("heading", { name: /isn't in the archive/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "My collection of games" })).toBeVisible();
  });
});
