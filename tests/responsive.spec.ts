import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(1);
}

test.describe("responsive layouts", () => {
  for (const path of ["/", "/library", "/library?view=list", "/reviews", "/statistics", "/about", "/login"]) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoHorizontalScroll(page);
    });
  }

  test("navigation is reachable (menu on small screens, bar on large)", async ({ page, viewport }) => {
    await page.goto("/");
    if ((viewport?.width ?? 1024) < 768) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Library" }).click();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Library" }).click();
    }
    await expect(page).toHaveURL(/\/library$/);
  });

  test("library toolbar and filter sheet fit the viewport", async ({ page, viewport }) => {
    await page.goto("/library");
    await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();
    await page.getByRole("button", { name: /Filters/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    const box = await sheet.boundingBox();
    expect(box!.width).toBeLessThanOrEqual((viewport?.width ?? 1280) + 1);
    await expect(page.getByRole("button", { name: "Clear all" })).toBeVisible();
  });
});
