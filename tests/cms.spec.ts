import { expect, test, type Page } from "@playwright/test";
import { cleanupE2E } from "./cleanup";
import { login, makeImage, owner, uniqueTitle } from "./helpers";

test.skip(!owner.username || !owner.password, "E2E_USERNAME / E2E_PASSWORD not set");

// One game travels through its whole life: create → browse → edit → statistics → delete.
test.describe.serial("CMS end to end", () => {
  const title = uniqueTitle();
  let slug = "";
  let gamesBefore = 0;

  async function totalGames(page: Page) {
    await page.goto("/statistics");
    await expect(page.getByRole("heading", { name: "The journey in numbers" })).toBeVisible();
    const figure = page.locator("dt", { hasText: "Games played" }).locator("xpath=following-sibling::dd");
    // With an empty archive the page shows an empty state instead of the figures.
    const empty = page.getByText("No data to chart yet");
    await expect(figure.or(empty)).toBeVisible();
    if (await empty.isVisible()) return 0;
    return Number(await figure.textContent());
  }

  async function chooseOption(page: Page, trigger: string, option: string) {
    await page.locator(trigger).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  }

  // Whatever happens above, leave no test genres or games behind.
  test.afterAll(async () => {
    await cleanupE2E();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("create a game with cover and both reviews", async ({ page }) => {
    gamesBefore = await totalGames(page);

    await page.goto("/admin/games/new");
    await page.locator("#title").fill(title);
    // Start date and review date no longer exist; the completion date is optional.
    await expect(page.locator("#started_on")).toHaveCount(0);
    await expect(page.locator("#reviewed_on")).toHaveCount(0);
    await expect(page.locator("#completed_on")).toHaveCount(1);
    slug = await page.locator("#slug").inputValue();
    expect(slug).toMatch(/^e2e-game-[a-z0-9]+$/); // auto-generated from the title

    await page.locator("#short_description").fill("Created by the Playwright suite.");
    await page.locator("#release_date").fill("2021-06-15");
    await page.locator("#developer").fill("E2E Studio");
    await page.locator("#publisher").fill("E2E Publishing");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page.getByRole("button", { name: "PC", exact: true }).click();
    await page.getByRole("button", { name: "Steam", exact: true }).click();
    await page.getByRole("button", { name: "Ubisoft Connect", exact: true }).click();
    await page.locator("#tags").fill("e2e-tag");
    await page.locator("#tags").press("Enter");
    await page.getByRole("switch", { name: "Online / competitive game" }).click(); // flag as online / competitive

    await page.locator("#rating").fill("7.5");
    await page.locator("#playtime_hours").fill("12");
    await chooseOption(page, "#play_status", "Completed");
    await chooseOption(page, "#completion_status", "Main story + side quests");
    await page.locator("#completed_on").fill("2021-07-20");

    // Server + client validation: a review needs both languages.
    await page.locator("#review_en").fill("An English review written by the test suite.");
    await page.getByRole("button", { name: "Add game" }).last().click();
    await expect(page.getByText("Add the Italian version of the review")).toBeVisible();
    await page.locator("#review_it").fill("Una recensione italiana scritta dalla suite di test.");
    await page.locator("#pros").fill("Fast\nStable");
    await page.locator("#cons").fill("Fake");

    // Cover (large, so client-side compression is exercised).
    const cover = await makeImage(2400, 3200, "#4b3f8f", "jpeg");
    await page.locator('input[type="file"]').setInputFiles(cover);
    await expect(page.getByAltText(`Cover preview for ${title}`)).toBeVisible();
    await expect(page.getByText(/Cover ready/)).toBeVisible();

    // Personal notes and extra screenshots/artwork no longer exist.
    await expect(page.locator("#notes")).toHaveCount(0);
    await expect(page.getByText("Screenshots & additional artwork")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add images" })).toHaveCount(0);

    await page.getByRole("button", { name: "Add game" }).last().click();
    await expect(page).toHaveURL(/\/admin\/games$/);
    await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();

    // Same session, client-side navigation: the next new game must NOT be pre-filled with this one.
    await page.getByRole("link", { name: "Add game" }).first().click();
    await expect(page).toHaveURL(/\/admin\/games\/new$/);
    await expect(page.locator("#title")).toHaveValue("");
    await expect(page.locator("#slug")).toHaveValue("");
    await expect(page.locator("#developer")).toHaveValue("");
    await expect(page.locator("#rating")).toHaveValue("");
    await expect(page.locator("#review_en")).toHaveValue("");
    await expect(page.locator("#review_it")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Adventure", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Steam", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByAltText(/Cover preview/)).toHaveCount(0);
  });

  test("adding a new genre keeps everything already typed in the form", async ({ page }) => {
    await page.goto("/admin/games/new");
    await page.locator("#title").fill("Typed before adding a genre");
    await page.locator("#developer").fill("Some studio");
    await page.locator("#review_en").fill("A long review that must survive.");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    // A full page reload would wipe this marker; a re-mounted form would wipe the values.
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));

    const genre = `E2E Genre ${Date.now().toString(36)}`;
    await page.getByRole("textbox", { name: "New genre name" }).fill(genre);
    await page.getByRole("textbox", { name: "New genre name" }).press("Enter");
    await expect(page.getByText(`Added “${genre}”`)).toBeVisible();
    await expect(page.getByRole("button", { name: genre, exact: true })).toHaveAttribute("aria-pressed", "true");

    // Give any refresh triggered by the action time to land, then check nothing was lost.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
    await expect(page.locator("#title")).toHaveValue("Typed before adding a genre");
    await expect(page.locator("#developer")).toHaveValue("Some studio");
    await expect(page.locator("#review_en")).toHaveValue("A long review that must survive.");
    await expect(page.getByRole("button", { name: "Adventure", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: genre, exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("a form with unsaved changes warns before the page is reloaded", async ({ page }) => {
    // The browser asks before leaving only if the page cancels the beforeunload event.
    const wouldWarn = () =>
      page.evaluate(() => {
        const event = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      });

    await page.goto("/admin/games/new");
    expect(await wouldWarn()).toBe(false); // pristine form: leaving is silent

    await page.locator("#title").fill("Unsaved work");
    await expect.poll(wouldWarn).toBe(true); // dirty form: the browser must ask first

    // Cancelling discards the draft, so there is nothing left to warn about.
    await page.getByRole("link", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/admin\/games$/);
    await page.getByRole("link", { name: "Add game" }).first().click();
    expect(await wouldWarn()).toBe(false);
  });

  test("cancelling a half-typed form leaves no draft behind", async ({ page }) => {
    await page.goto("/admin/games");
    await page.getByRole("link", { name: "Add game" }).first().click();
    await page.locator("#title").fill("Half-typed draft");
    await page.locator("#developer").fill("Draft studio");
    await page.getByRole("link", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/admin\/games$/);
    await page.getByRole("link", { name: "Add game" }).first().click();
    await expect(page.locator("#title")).toHaveValue("");
    await expect(page.locator("#developer")).toHaveValue("");
  });

  test("duplicate slugs are rejected with a clear message", async ({ page }) => {
    await page.goto("/admin/games/new");
    await page.locator("#title").fill(`${title} copy`);
    await page.locator("#slug").fill(slug);
    await page.getByRole("button", { name: "Add game" }).last().click();
    await expect(page.getByText("Slug already in use")).toBeVisible();
  });

  test("the new game shows up in the library, search and detail page", async ({ page }) => {
    await page.goto(`/library?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();

    // Combine several filters.
    await page.goto(`/library?q=${encodeURIComponent(title)}&status=completed&min=7&max=8&sort=rating_desc&view=list`);
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    // A filter that excludes it.
    await page.goto(`/library?q=${encodeURIComponent(title)}&status=dropped`);
    await expect(page.getByText("No games match these filters")).toBeVisible();

    // Launchers filter the library: the game is on Steam and Ubisoft Connect, not on Battle.net.
    await page.goto(`/library?q=${encodeURIComponent(title)}&launcher=ubisoft-connect`);
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await page.goto(`/library?q=${encodeURIComponent(title)}&launcher=battle-net`);
    await expect(page.getByText("No games match these filters")).toBeVisible();
    await page.goto(`/library?q=${encodeURIComponent(title)}`);
    await expect(page.getByTitle("Steam")).toBeVisible(); // the brand icon on the card

    // "Main story + side quests" is its own completion level, distinct from plain "Main story".
    await page.goto(`/library?q=${encodeURIComponent(title)}&completion=main_story_side_quests`);
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await page.goto(`/library?q=${encodeURIComponent(title)}&completion=main_story`);
    await expect(page.getByText("No games match these filters")).toBeVisible();

    // Online / competitive games stay in the library, flagged and filterable.
    await page.goto(`/library?q=${encodeURIComponent(title)}`);
    await expect(page.getByText("Online", { exact: true })).toBeVisible();
    await page.goto(`/library?q=${encodeURIComponent(title)}&type=online`);
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await page.goto(`/library?q=${encodeURIComponent(title)}&type=solo`);
    await expect(page.getByText("No games match these filters")).toBeVisible();

    await page.goto(`/games/${slug}`);
    await expect(page.getByText("Online / competitive")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    // Pros get a green "+", cons a red "-".
    await expect(page.getByRole("listitem").filter({ hasText: "Fast" }).first()).toContainText("+");
    await expect(page.getByRole("listitem").filter({ hasText: "Fake" }).first()).toContainText("-");
    await expect(page.getByText("E2E Studio").first()).toBeVisible();
    await expect(page.getByText("Main story + side quests")).toBeVisible();
    const launchers = page.locator("dt", { hasText: "Played via" }).locator("xpath=following-sibling::dd");
    await expect(launchers).toContainText("Steam");
    await expect(launchers).toContainText("Ubisoft Connect");
    await expect(page.getByText("7.5").first()).toBeVisible();

    // Both languages are available, English first.
    await expect(page.getByText("An English review written by the test suite.")).toBeVisible();
    await page.getByRole("tab", { name: "Italiano" }).click();
    await expect(page.getByText("Una recensione italiana scritta dalla suite di test.")).toBeVisible();

    // Cover is optimized: served by next/image as AVIF/WebP, not the original upload.
    const img = page.getByAltText(`${title} cover`);
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", /\/_next\/image\?url=/);
  });

  test("clicking a developer opens a page with all their games", async ({ page }) => {
    // On a card the developer is its own link; the rest of the card still opens the game.
    await page.goto(`/library?q=${encodeURIComponent(title)}`);
    const cover = page.getByAltText(`${title} cover`);
    await expect(cover).toBeVisible();
    const box = (await cover.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(new RegExp(`/games/${slug}$`));

    await page.goto(`/library?q=${encodeURIComponent(title)}`);
    await page.getByRole("link", { name: "E2E Studio" }).click();
    await expect(page).toHaveURL(/\/developers\/e2e-studio$/);
    await expect(page.getByRole("heading", { level: 1, name: "E2E Studio" })).toBeVisible();
    await expect(page.getByText("1 game in the archive")).toBeVisible();
    await expect(page.getByRole("link", { name: title })).toBeVisible();

    // The same link is on the game page, in the list view and in the details.
    await page.goto(`/games/${slug}`);
    await expect(page.getByRole("link", { name: "E2E Studio" })).toHaveCount(2);
    await page.goto(`/library?q=${encodeURIComponent(title)}&view=list`);
    await page.getByRole("link", { name: "E2E Studio" }).click();
    await expect(page).toHaveURL(/\/developers\/e2e-studio$/);
  });

  test("the review appears in the reviews section in both languages", async ({ page }) => {
    await page.goto(`/reviews?q=${encodeURIComponent(title)}`);
    await expect(page.getByText("An English review written by the test suite.")).toBeVisible();
    await page.getByRole("button", { name: "Leggi le recensioni in italiano" }).click();
    await expect(page.getByText("Una recensione italiana scritta dalla suite di test.")).toBeVisible();
    await expect(page.getByText("Leggi la recensione completa")).toBeVisible();
  });

  test("statistics are computed from the database", async ({ page }) => {
    expect(await totalGames(page)).toBe(gamesBefore + 1);
  });

  test("start from an existing game, then add and add another", async ({ page }) => {
    const second = uniqueTitle();
    await page.goto("/admin/games/new");

    // Copy the shared details (studio, genres, platforms, online flag) from the first game.
    await page.getByRole("searchbox", { name: "Search a game to copy from" }).fill(title);
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await expect(page.getByText(`Copied from ${title}`)).toBeVisible();
    await expect(page.locator("#developer")).toHaveValue("E2E Studio");
    await expect(page.locator("#publisher")).toHaveValue("E2E Publishing");
    await expect(page.getByRole("button", { name: "Adventure", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "PC", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("switch", { name: "Online / competitive game" })).toBeChecked();
    await expect(page.getByRole("button", { name: "Steam", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Ubisoft Connect", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Battle.net", exact: true })).toHaveAttribute("aria-pressed", "false");
    // Nothing personal is copied.
    for (const field of ["#title", "#slug", "#rating", "#review_en", "#review_it", "#release_date"]) {
      await expect(page.locator(field)).toHaveValue("");
    }

    await page.locator("#title").fill(second);
    // Several studios in one field are listed separately, each with its own page.
    await page.locator("#developer").fill("E2E Studio, E2E Partner");
    await page.getByRole("button", { name: "Add and add another" }).click();
    await expect(page.getByText(`${second} added. Ready for the next one.`)).toBeVisible();

    // Still on the form, which is blank again (nothing leaks from the game just saved).
    await expect(page).toHaveURL(/\/admin\/games\/new$/);
    await expect(page.locator("#title")).toHaveValue("");
    await expect(page.locator("#title")).toBeFocused();
    await expect(page.locator("#developer")).toHaveValue("");
    await expect(page.getByRole("switch", { name: "Online / competitive game" })).not.toBeChecked();
    await expect(page.getByText(/^Copied from/)).toHaveCount(0);

    await page.goto("/developers/e2e-partner");
    await expect(page.getByRole("heading", { level: 1, name: "E2E Partner" })).toBeVisible();
    await expect(page.getByText("1 game in the archive")).toBeVisible();
    await page.goto("/developers/e2e-studio");
    await expect(page.getByText("2 games in the archive")).toBeVisible();
    await expect(page.getByRole("link", { name: second })).toBeVisible();
    await expect(page.getByRole("link", { name: title })).toBeVisible();

    // The game was saved: remove it again so the rest of the run counts one game.
    await page.goto(`/admin/games?q=${encodeURIComponent(second)}`);
    await expect(page.getByRole("link", { name: second, exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Delete ${second}` }).click();
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await expect(page.getByText(`“${second}” was deleted`)).toBeVisible();
  });

  test("edit rating and review, then see it reflected everywhere", async ({ page }) => {
    await page.goto(`/admin/games?q=${encodeURIComponent(title)}`);
    await page.getByRole("link", { name: `Edit ${title}` }).click();
    await expect(page.locator("#title")).toHaveValue(title);
    await expect(page.locator("#slug")).toHaveValue(slug);

    await page.locator("#rating").fill("9.5");
    await page.locator("#review_en").fill("Updated English review.");
    await page.locator("#review_it").fill("Recensione italiana aggiornata.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/admin\/games$/);

    await page.goto(`/games/${slug}`);
    await expect(page.getByText("9.5").first()).toBeVisible();
    await expect(page.getByText("Updated English review.")).toBeVisible();
    await page.getByRole("tab", { name: "Italiano" }).click();
    await expect(page.getByText("Recensione italiana aggiornata.")).toBeVisible();

    // Rating distribution reflects the change (8-9 bucket → 9-10 bucket).
    await page.goto("/statistics");
    await expect(page.getByText("9-10")).toBeVisible();
  });

  test("replace and remove the cover", async ({ page }) => {
    await page.goto(`/admin/games?q=${encodeURIComponent(title)}`);
    await page.getByRole("link", { name: `Edit ${title}` }).click();
    const replacement = await makeImage(1200, 1600, "#8f3f3f", "png");
    await page.locator('input[type="file"]').setInputFiles(replacement);
    await expect(page.getByText(/Cover ready/)).toBeVisible();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/admin\/games$/);

    await page.getByRole("link", { name: `Edit ${title}` }).click();
    await page.getByRole("button", { name: "Remove cover" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/admin\/games$/);
    await page.goto("/admin");
    await expect(page.getByText(title).first()).toBeVisible(); // now listed under "missing cover"
  });

  test("delete asks for confirmation and removes the game", async ({ page }) => {
    await page.goto(`/admin/games?q=${encodeURIComponent(title)}`);
    await page.getByRole("button", { name: `Delete ${title}` }).click();
    await expect(page.getByRole("heading", { name: new RegExp(`Delete “${title}”\\?`) })).toBeVisible();

    // Cancelling keeps the game.
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Delete ${title}` }).click();
    await page.getByRole("button", { name: "Delete permanently" }).click();
    // Wait for the server action to finish before looking at anything else.
    await expect(page.getByText(`“${title}” was deleted`)).toBeVisible();
    await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(0);

    const res = await page.goto(`/games/${slug}`);
    await expect(page.getByRole("heading", { name: /isn't in the archive/ })).toBeVisible();
    expect(res?.status()).toBeLessThan(500);
    expect(await totalGames(page)).toBe(gamesBefore);
  });
});

test.describe("admin 404", () => {
  test.skip(!owner.username || !owner.password, "E2E_USERNAME / E2E_PASSWORD not set");

  test("a missing record shows the 404 inside the admin shell", async ({ page }) => {
    await login(page);
    await page.goto("/admin/games/00000000-0000-0000-0000-000000000000/edit");
    await expect(page.getByRole("heading", { name: "This record doesn't exist" })).toBeVisible();
    // Admin chrome stays, and the public site header is not duplicated on top of it.
    await expect(page.getByRole("navigation", { name: "Admin" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
    await page.getByRole("link", { name: "Back to games" }).click();
    await expect(page).toHaveURL(/\/admin\/games$/);
  });
});
