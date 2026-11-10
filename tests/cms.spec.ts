import { expect, test, type Page } from "@playwright/test";
import { login, makeImage, owner, uniqueTitle } from "./helpers";

test.skip(!owner.username || !owner.password, "E2E_USERNAME / E2E_PASSWORD not set");

// One game travels through its whole life: create → browse → edit → statistics → delete.
test.describe.serial("CMS end to end", () => {
  const title = uniqueTitle();
  let slug = "";
  let gamesBefore = 0;

  async function totalGames(page: Page) {
    await page.goto("/statistics");
    await expect(page.getByRole("heading", { name: "The journey in numbers." })).toBeVisible();
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

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("create a game with cover, screenshot and both reviews", async ({ page }) => {
    gamesBefore = await totalGames(page);

    await page.goto("/admin/games/new");
    await page.locator("#title").fill(title);
    slug = await page.locator("#slug").inputValue();
    expect(slug).toMatch(/^e2e-game-[a-z0-9]+$/); // auto-generated from the title

    await page.locator("#short_description").fill("Created by the Playwright suite.");
    await page.locator("#release_date").fill("2021-06-15");
    await page.locator("#developer").fill("E2E Studio");
    await page.locator("#publisher").fill("E2E Publishing");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page.getByRole("button", { name: "PC", exact: true }).click();
    await page.locator("#tags").fill("e2e-tag");
    await page.locator("#tags").press("Enter");
    await page.getByRole("switch", { name: "Online / competitive game" }).click(); // flag as online / competitive

    await page.locator("#rating").fill("7.5");
    await page.locator("#playtime_hours").fill("12");
    await chooseOption(page, "#play_status", "Completed");
    await chooseOption(page, "#completion_status", "Main story");
    await page.locator("#started_on").fill("2021-07-01");
    await page.locator("#completed_on").fill("2021-07-20");
    await page.locator("#reviewed_on").fill("2021-07-21");

    // Server + client validation: a review needs both languages.
    await page.locator("#review_en").fill("An English review written by the test suite.");
    await page.getByRole("button", { name: "Add game" }).last().click();
    await expect(page.getByText("Add the Italian version of the review")).toBeVisible();
    await page.locator("#review_it").fill("Una recensione italiana scritta dalla suite di test.");
    await page.locator("#pros").fill("Fast\nStable");
    await page.locator("#cons").fill("Fake");

    // Cover (large, so client-side compression is exercised) + one screenshot.
    const cover = await makeImage(2400, 3200, "#4b3f8f", "jpeg");
    await page.locator('input[type="file"]:not([multiple])').setInputFiles(cover);
    await expect(page.getByAltText(`Cover preview for ${title}`)).toBeVisible();
    await expect(page.getByText(/Cover ready/)).toBeVisible();
    const shot = await makeImage(1600, 900, "#1d3b4f", "png");
    await page.locator('input[type="file"][multiple]').setInputFiles(shot);
    await expect(page.getByText(/New screenshot/i)).toBeVisible();

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
    await expect(page.getByAltText(/Cover preview/)).toHaveCount(0);
    await expect(page.getByText(/New screenshot/i)).toHaveCount(0);
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
    // Pros get a green "+", cons a red "−".
    await expect(page.getByText("+", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("−", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("E2E Studio").first()).toBeVisible();
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

  test("the review appears in the reviews section in both languages", async ({ page }) => {
    await page.goto(`/reviews?q=${encodeURIComponent(title)}`);
    await expect(page.getByText("An English review written by the test suite.")).toBeVisible();
    await page.getByRole("button", { name: "Leggi le recensioni in italiano" }).click();
    await expect(page.getByText("Una recensione italiana scritta dalla suite di test.")).toBeVisible();
    await expect(page.getByText(/Recensito il/)).toBeVisible();
  });

  test("statistics are computed from the database", async ({ page }) => {
    expect(await totalGames(page)).toBe(gamesBefore + 1);
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
    await expect(page.getByText("9–10")).toBeVisible();
  });

  test("replace and remove the cover", async ({ page }) => {
    await page.goto(`/admin/games?q=${encodeURIComponent(title)}`);
    await page.getByRole("link", { name: `Edit ${title}` }).click();
    const replacement = await makeImage(1200, 1600, "#8f3f3f", "png");
    await page.locator('input[type="file"]:not([multiple])').setInputFiles(replacement);
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
