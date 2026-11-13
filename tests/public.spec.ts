import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectPreviewImage } from "./helpers";

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

    // How the games are played and reviewed, and the only PC clients in use.
    await expect(page.getByRole("heading", { level: 2, name: "How I play and review" })).toBeVisible();
    await expect(page.getByText("DLC and expansions included, so I get the whole experience")).toBeVisible();
    await expect(page.getByText("they earned a paragraph of their own")).toBeVisible();
    await expect(page.getByText("Steam, Ubisoft Connect, Battle.net, EA app", { exact: true })).toBeVisible();

    const steam = page.getByRole("complementary").getByRole("link", { name: /My Steam profile/ });
    await expect(steam).toHaveAttribute("href", "https://steamcommunity.com/profiles/76561198066959401/");
    await expect(steam).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: /Steam/ })).toBeVisible();

    await page.getByRole("tab", { name: "Italiano" }).click();
    await expect(page.getByRole("link", { name: /Il mio profilo Steam/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Ciao, sono Salvatore" })).toBeVisible();
    await expect(page.getByText("mia madre, che non c'è più")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Come gioco e recensisco" })).toBeVisible();
    await expect(page.getByText("Steam, Ubisoft Connect, Battle.net, EA app", { exact: true })).toBeVisible();
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

    // The key figures count the studios met so far. Not "highest rating" (always 10) nor "favourite genre"
    // (Action is broad enough to win every time): neither says anything.
    const studios = page.locator("dt", { hasText: "Studios" }).locator("xpath=following-sibling::dd");
    expect(Number((await studios.innerText()).trim())).toBeGreaterThanOrEqual(1);
    await expect(page.getByText("Highest rating")).toHaveCount(0);
    await expect(page.getByText("Favourite genre")).toHaveCount(0);
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

  test("every section has its own preview image for sharing", async ({ page, request }) => {
    const paths = ["/", "/library", "/reviews", "/statistics", "/about"];
    const images: string[] = [];
    for (const path of paths) {
      await page.goto(path);
      images.push(await expectPreviewImage(page, request));
    }
    // One image per section, not the same one everywhere.
    expect(new Set(images).size).toBe(paths.length);
  });

  test("responses carry basic security headers, and crawlers are kept out of the private routes", async ({ page, request }) => {
    const res = await request.get("/");
    const headers = res.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");

    const robots = await (await request.get("/robots.txt")).text();
    for (const path of ["/admin", "/login", "/random"]) expect(robots).toContain(`Disallow: ${path}`);

    // The sign-in page is not meant for search engines either.
    await page.goto("/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("a publisher works like a developer: its name opens the page with its games", async ({ page, request }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    test.skip(!url || !key, "needs the Supabase variables from .env.local");
    const { data } = await createClient(url!, key!).from("games").select("slug, publisher").not("publisher", "is", null).limit(50);
    // A game whose publisher is a single name (no comma): the link text is the whole field.
    const game = (data ?? []).find((g) => g.publisher && !/[,;]/.test(g.publisher));
    test.skip(!game, "needs a game with a publisher");

    await page.goto(`/games/${game!.slug}`);
    const link = page.locator("dd a[href^='/publishers/']").first();
    await expect(link).toHaveText(game!.publisher);
    await link.click();
    await expect(page).toHaveURL(/\/publishers\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1, name: game!.publisher })).toBeVisible();
    await expect(page.getByText(/\d+ games? in the archive/)).toBeVisible();
    await expect(page.locator("p.eyebrow", { hasText: "Publisher" })).toBeVisible();
    await expectPreviewImage(page, request);

    await page.goto("/publishers/nobody-ever-published-this");
    await expect(page.getByRole("heading", { name: /isn't in the archive/ })).toBeVisible();
  });

  test("the navbar search finds a game by title from any page", async ({ page, request }) => {
    // The list it loads is public and light: one entry per game.
    const res = await request.get("/search-index");
    expect(res.status()).toBe(200);
    const index: { slug: string; title: string }[] = await res.json();
    test.skip(index.length === 0, "needs at least one game in the archive");
    const target = index[0];

    await page.goto("/about");
    await page.getByRole("button", { name: "Search games" }).click();
    const box = page.getByRole("combobox", { name: "Search by title or developer" });
    await expect(box).toBeFocused();

    // Typing a piece of the title lists the game; Enter opens the best match.
    await box.fill(target.title.slice(0, 5).toLowerCase());
    const results = page.getByRole("listbox", { name: "Results" });
    await expect(results.getByRole("option", { name: new RegExp(target.title.slice(0, 5), "i") }).first()).toBeVisible();
    await box.fill(target.title);
    await expect(results.getByRole("option").first()).toContainText(target.title);
    await box.press("Enter");
    await expect(page).toHaveURL(new RegExp("/games/" + target.slug + "$"));
    await expect(page.getByRole("combobox", { name: "Search by title or developer" })).toHaveCount(0);

    // "/" opens it from anywhere; a query with no match says so, and Enter falls back to the library.
    await page.keyboard.press("/");
    await expect(box).toBeFocused();
    await box.fill("zzzz nothing is called this");
    await expect(page.getByText("No game matches")).toBeVisible();
    await box.press("Enter");
    await expect(page).toHaveURL(/library\?q=zzzz/);
    await expect(page.getByText("No games match these filters")).toBeVisible();

    // Escape closes it.
    await page.keyboard.press("Control+k");
    await expect(box).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(box).toHaveCount(0);
  });

  test("statistics also show where games are played, single-player vs online, and the most played", async ({ page, request }) => {
    const index: { slug: string }[] = await (await request.get("/search-index")).json();
    test.skip(index.length === 0, "needs at least one game in the archive");
    await page.goto("/statistics");

    const section = (title: string) =>
      page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    const rows = (title: string) => section(title).getByRole("listitem");
    const counts = async (title: string) =>
      (await rows(title).allInnerTexts()).map((t) => Number(t.trim().split(/\s+/).at(-1))).filter((n) => !Number.isNaN(n));

    // Single-player and online add up to every game in the archive.
    await expect(rows("Single-player and online")).toHaveCount(2);
    const [solo, online] = await counts("Single-player and online");
    expect(solo + online).toBe(index.length);

    // A game can be on several launchers, so the launcher counts need only be sane, biggest first.
    await expect(section("Games by launcher")).toBeVisible();
    const launchers = await counts("Games by launcher");
    expect(launchers.length).toBeGreaterThan(0);
    expect([...launchers].sort((a, b) => b - a)).toEqual(launchers);

    // The most played are in hours, biggest first, at most five.
    const hours = await counts("Most hours played");
    expect(hours.length).toBeLessThanOrEqual(5);
    expect([...hours].sort((a, b) => b - a)).toEqual(hours);
  });

  test("the look: ratings are coloured by tier, the hero wall is decoration, cards fade in only if motion is welcome", async ({ page }) => {
    // The wall of covers behind the hero is hidden from assistive technology and has no alternative text.
    await page.goto("/");
    const wall = page.locator("div[aria-hidden='true'] img");
    test.skip((await wall.count()) === 0, "needs at least six covers");
    expect(await wall.count()).toBeGreaterThanOrEqual(6);
    for (const alt of await wall.evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")))) expect(alt).toBe("");

    // In the library, a rating of 9 or more is gold and one under 5 is red; the others keep the normal colour.
    await page.goto("/library");
    const tone = (value: string) => page.locator("main li [aria-label^='Rated " + value + "'] span").first();
    const cards = page.locator("main li [aria-label^='Rated']");
    const labels = await cards.evaluateAll((els) => els.map((el) => el.getAttribute("aria-label") ?? ""));
    const rated = labels.map((l) => Number(/Rated ([0-9.]+)/.exec(l)?.[1]));
    const high = rated.find((n) => n >= 9);
    const low = rated.find((n) => n < 5);
    const mid = rated.find((n) => n >= 5 && n < 9);
    if (high !== undefined) await expect(tone(high === 10 ? "10" : high.toFixed(1))).toHaveClass(/text-rating-high/);
    if (low !== undefined) await expect(tone(low.toFixed(1))).toHaveClass(/text-rating-low/);
    if (mid !== undefined) await expect(tone(mid.toFixed(1))).not.toHaveClass(/text-rating-(high|low)/);

    // With reduced motion asked for, the cards simply appear (no animation on them).
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/library");
    const animation = await page.locator("main ul li").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe("none");
  });

  test("polish: carousel glow, hover details, month calendar, reading layout, app manifest, cover morph", async ({ page, request }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    // Carousel: each slide has a soft glow in the colour of its cover (only decoration).
    await page.goto("/");
    const glow = page.getByRole("region", { name: "Standout reviews" }).locator("li[role=group] > div[aria-hidden='true']");
    if ((await page.getByRole("region", { name: "Standout reviews" }).count()) > 0) {
      expect(await glow.count()).toBeGreaterThan(0);
      expect(await glow.first().evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("radial-gradient");

      // The title and the cover both open the game's page (the same one as "Read the full review").
      const slide = page.getByRole("region", { name: "Standout reviews" }).locator("li[role=group]").first();
      const href = await slide.getByRole("link", { name: /Read the full review/ }).getAttribute("href");
      expect(href).toMatch(/^\/games\//);
      await expect(slide.locator("h3 a")).toHaveAttribute("href", href!);
      await expect(slide.locator(`a[aria-hidden='true'][href='${href}'] img`).first()).toBeVisible();
      await slide.locator(`a[aria-hidden='true'][href='${href}']`).click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await page.goto("/");
      await page.getByRole("region", { name: "Standout reviews" }).locator("li[role=group] h3 a").first().click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    }

    // Library: hovering a card slides up the genres and hours over the cover.
    await page.goto("/library");
    const card = page.locator("main li").first();
    const details = card.locator("div[aria-hidden='true']").filter({ hasText: /./ }).first();
    if ((await details.count()) > 0) {
      await expect(details).toHaveCSS("opacity", "0");
      await card.hover();
      await expect(details).toHaveCSS("opacity", "1");
      await page.mouse.move(0, 0);
    }

    // The cover morph names the cover on both pages: opening a game and coming back raises no error.
    await page.locator("main h3 a").first().click();
    await expect(page).toHaveURL(/\/games\//);
    await page.goBack();
    await expect(page.locator("main h3").first()).toBeVisible();

    // Statistics: the month calendar counts every game that has a completion date.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key) {
      const { data } = await createClient(url, key).from("games").select("completed_on").not("completed_on", "is", null);
      const dated = data?.length ?? 0;
      await page.goto("/statistics");
      const table = page.getByRole("table", { name: "Games finished per month" });
      if (dated > 0) {
        await expect(table).toBeVisible();
        const counts = await table.locator("tbody td").allInnerTexts();
        expect(counts.length % 12).toBe(0); // whole years, twelve months each
        expect(counts.reduce((sum, t) => sum + Number(t.trim() || 0), 0)).toBe(dated);
      } else {
        await expect(table).toHaveCount(0);
      }
    }

    // A written review reads as paragraphs, the first one as a lead-in.
    await page.goto("/reviews");
    const first = page.locator("main article h2 a").first();
    if ((await first.count()) > 0) {
      await first.click();
      const paragraphs = page.locator("#review-panel p");
      await expect(paragraphs.first()).toBeVisible();
      if ((await paragraphs.count()) > 1) {
        const size = (index: number) => paragraphs.nth(index).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(await size(0)).toBeGreaterThan(await size(1));
      }
    }

    // The site can be added to a phone's home screen: manifest, icons and the touch icon exist.
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.status()).toBe(200);
    const parsed = await manifest.json();
    expect(parsed.short_name).toBe("Re:Play");
    expect(parsed.display).toBe("standalone");
    expect(parsed.icons.map((i: { purpose: string }) => i.purpose)).toEqual(expect.arrayContaining(["any", "maskable"]));
    for (const icon of parsed.icons as { src: string }[]) {
      const res = await request.get(icon.src);
      expect(res.status(), icon.src).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
    }
    await page.goto("/");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

    expect(errors, "the pages raised console errors").toEqual([]);
  });

  test("the sitemap lists every public page, and the reviews have an RSS feed", async ({ page, request }) => {
    // Sitemap: sections, every game, and it is announced in robots.txt.
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(sitemap.headers()["content-type"]).toContain("xml");
    const xml = await sitemap.text();
    for (const path of ["/library", "/reviews", "/genres", "/statistics", "/about"]) expect(xml).toContain(path + "</loc>");
    const index: { slug: string }[] = await (await request.get("/search-index")).json();
    test.skip(index.length === 0, "needs at least one game in the archive");
    for (const { slug } of index) expect(xml).toContain("/games/" + slug + "</loc>");
    expect(xml).not.toContain("/admin");

    // RSS: valid enough for a reader (channel, items with title, link, date), and found from the reviews page.
    const feed = await request.get("/reviews/feed.xml");
    expect(feed.status()).toBe(200);
    expect(feed.headers()["content-type"]).toContain("application/rss+xml");
    const rss = await feed.text();
    expect(rss).toContain('<rss version="2.0"');
    expect(rss).toContain("<channel>");
    expect(rss.match(/<item>/g)?.length ?? 0).toBeGreaterThan(0);
    expect(rss).toMatch(/<item>[\s\S]*<title>[^<]+<\/title>[\s\S]*<link>[^<]+\/games\/[a-z0-9-]+<\/link>[\s\S]*<pubDate>/);
    // Each item carries the whole review (not just the start) next to a short description.
    const item = rss.split("<item>")[1];
    const description = /<description>([^<]*)<\/description>/.exec(item)?.[1] ?? "";
    const full = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/.exec(item)?.[1] ?? "";
    expect(full).toContain("<p>");
    expect(full.length).toBeGreaterThanOrEqual(description.length);
    expect(rss).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#)/); // every ampersand is escaped
    await page.goto("/reviews");
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", /\/reviews\/feed\.xml$/); // (made absolute from the site address)
    await expect(page.getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/reviews/feed.xml");
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

  test("the library searches, filters, sorts and pages in the browser, without asking the server", async ({ page }) => {
    // Anything that goes back to the server for /library (a page load or an RSC fetch) counts.
    const trips: string[] = [];
    page.on("request", (req) => {
      if (new URL(req.url()).pathname === "/library") trips.push(req.url());
    });

    await page.goto("/library");
    const summary = page.locator("p[aria-live=polite]");
    await expect(summary).toHaveText(/^\d+ games?/);
    const total = Number((await summary.innerText()).match(/\d+/)![0]);
    test.skip(total < 3, "needs a few games in the archive");
    const firstTitle = (await page.locator("main h3").first().innerText()).trim();
    trips.length = 0;

    // Typing narrows the results on the spot (no wait for the URL, no round trip).
    const search = page.getByRole("searchbox", { name: "Search" });
    await search.fill(firstTitle);
    await expect(page.locator("main h3", { hasText: firstTitle }).first()).toBeVisible();
    await expect(summary).toHaveText(/matches? your search/);
    await expect(page).toHaveURL(/q=/);
    await search.fill("zzzz no game is called this");
    await expect(page.getByText("No games match these filters")).toBeVisible();
    await search.fill("");
    await expect(summary).toHaveText(new RegExp(`^${total} games?$`));
    await expect(page).not.toHaveURL(/q=/);

    // A filter and a new sort order apply at once.
    await page.getByRole("button", { name: /Filters/ }).click();
    await page.getByRole("button", { name: "Completed", exact: true }).click();
    await expect(page).toHaveURL(/status=completed/);
    await page.keyboard.press("Escape");
    await page.getByRole("combobox", { name: "Sort by" }).click();
    await page.getByRole("option", { name: "Lowest rated" }).click();
    await expect(page).toHaveURL(/sort=rating_asc/);
    const ratings = await page.locator("main li [aria-label^='Rated']").evaluateAll((els) =>
      els.map((el) => Number(/Rated ([d.]+)/.exec(el.getAttribute("aria-label") ?? "")?.[1])),
    );
    expect(ratings.length).toBeGreaterThan(1);
    expect([...ratings].sort((x, y) => x - y)).toEqual(ratings);

    // Back to everything, then to the second page, when there is one.
    await page.getByRole("button", { name: /Filters/ }).click();
    await page.getByRole("button", { name: "Clear all" }).click();
    await page.keyboard.press("Escape");
    await expect(summary).toHaveText(new RegExp(`^${total} games?$`));
    if (total > 24) {
      const before = (await page.locator("main h3").first().innerText()).trim();
      await page.getByRole("link", { name: "Page 2" }).click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.locator("main h3").first()).not.toHaveText(before);
      await page.getByRole("link", { name: "Page 1" }).click();
      await expect(page.locator("main h3").first()).toHaveText(before);
    }

    expect(trips, "the library asked the server for something").toEqual([]);

    // A shared link still arrives already filtered.
    await page.goto(`/library?q=${encodeURIComponent(firstTitle)}`);
    await expect(page.locator("main h3", { hasText: firstTitle }).first()).toBeVisible();
    await expect(summary).toHaveText(/matches? your search/);
    await expect(search).toHaveValue(firstTitle);
  });

  test("the reviews search, sort and language switch work in the browser, without asking the server", async ({ page }) => {
    const trips: string[] = [];
    page.on("request", (req) => {
      if (new URL(req.url()).pathname === "/reviews") trips.push(req.url());
    });

    await page.goto("/reviews");
    const summary = page.locator("p[aria-live=polite]");
    await expect(summary).toHaveText(/^\d+ reviews?$/);
    const total = Number((await summary.innerText()).match(/\d+/)![0]);
    test.skip(total < 2, "needs a few reviewed games");
    const firstTitle = (await page.locator("main article h2").first().innerText()).trim();
    trips.length = 0;

    // Typing narrows the list on the spot.
    const search = page.getByRole("searchbox", { name: "Search" });
    await search.fill(firstTitle);
    await expect(page.locator("main article h2", { hasText: firstTitle }).first()).toBeVisible();
    await expect(page).toHaveURL(/q=/);
    await search.fill("zzzz no review has this");
    await expect(page.getByText("No review matches your search.")).toBeVisible();
    await search.fill("");
    await expect(summary).toHaveText(new RegExp("^" + total + " reviews?$"));

    // Another order, and the Italian texts, with no round trip either.
    await page.getByRole("combobox", { name: "Sort by" }).click();
    await page.getByRole("option", { name: "Alphabetical" }).click();
    await expect(page).toHaveURL(/sort=title/);
    const titles = (await page.locator("main article h2").allInnerTexts()).map((t) => t.trim().toLowerCase());
    expect([...titles].sort((a, b) => a.localeCompare(b, "en"))).toEqual(titles);
    await page.getByRole("button", { name: "Leggi le recensioni in italiano" }).click();
    await expect(page).toHaveURL(/lang=it/);
    await expect(page.locator("main article p[lang=it]").first()).toBeVisible();
    await expect(page.getByText("Leggi la recensione completa").first()).toBeVisible();

    expect(trips, "the reviews page asked the server for something").toEqual([]);

    // A shared link still arrives in the right language and order.
    await page.goto("/reviews?lang=it&sort=title");
    await expect(page.locator("main article p[lang=it]").first()).toBeVisible();
  });

  test("genres lead to the games of that genre, and every genre has its place", async ({ page }) => {
    await page.goto("/");
    test.skip(await page.getByText("Nothing here yet").isVisible(), "needs at least one game in the archive");

    // The home shows only the biggest genres; "All genres" opens the complete list.
    const home = page.locator("section").filter({ has: page.getByRole("heading", { name: "Browse by genre" }) });
    const onHome = await home.getByRole("list").getByRole("link").count();
    await home.getByRole("link", { name: "All genres" }).click();
    await expect(page).toHaveURL(/\/genres$/);
    await expect(page.getByRole("heading", { level: 1, name: "All the genres" })).toBeVisible();
    const tiles = page.locator("main").getByRole("list").getByRole("link");
    await expect(tiles.first()).toBeVisible();
    expect(await tiles.count()).toBeGreaterThanOrEqual(onHome);

    // A genre opens the library with only its games.
    await tiles.first().click();
    await expect(page).toHaveURL(/\/library\?genre=[0-9a-f-]{36}$/);
    await expect(page.locator("p[aria-live=polite]")).toHaveText(/match/);

    // On a game, the genre names are links too.
    await page.goto("/library");
    await page.locator("main h3 a").first().click();
    const genre = page.getByRole("link", { name: /^[^/]+$/ }).and(page.locator("a[href^='/library?genre=']")).first();
    await genre.click();
    await expect(page).toHaveURL(/\/library\?genre=[0-9a-f-]{36}$/);
  });

  test("invalid query params are ignored instead of crashing", async ({ page }) => {
    const res = await page.goto("/library?genre=not-a-uuid&min=abc&sort=hack&page=-4&status=nope");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "My collection of games" })).toBeVisible();
  });
});
