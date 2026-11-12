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

  test("statistics charts never show a vertical scrollbar", async ({ page }) => {
    await page.goto("/statistics");
    await page.waitForLoadState("networkidle");
    const scrollers = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("main *")]
        .filter((el) => getComputedStyle(el).overflowX === "auto" || getComputedStyle(el).overflowY === "auto")
        .map((el) => ({ extra: el.scrollHeight - el.clientHeight, y: getComputedStyle(el).overflowY })),
    );
    for (const s of scrollers) {
      expect(s.y, "chart containers must not scroll vertically").not.toBe("auto");
      expect(s.extra).toBeLessThanOrEqual(1);
    }
  });

  test("the standout carousel works on this screen: swipe, looping arrows and dots", async ({ page, viewport }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const carousel = page.getByRole("region", { name: "Standout reviews" });
    await expect(carousel).toBeVisible();
    const slides = carousel.getByRole("group", { name: /^\d+ of \d+$/ });
    const count = await slides.count();
    test.skip(count < 2, "needs two or more standout reviews in the archive");

    // The carousel fits the screen and a slide is exactly as wide as the carousel (one at a time).
    const track = carousel.locator("ul").first();
    const trackBox = (await track.boundingBox())!;
    expect(trackBox.width).toBeLessThanOrEqual((viewport?.width ?? 1024) + 1);
    const inner = await track.evaluate((el) => el.clientWidth); // inside the 1px border
    expect(Math.abs((await slides.first().boundingBox())!.width - inner)).toBeLessThanOrEqual(1);
    await expectNoHorizontalScroll(page);

    const dot = (n: number) => carousel.getByRole("button", { name: new RegExp(`\\(${n} of ${count}\\)`) });
    await expect(dot(1)).toHaveAttribute("aria-current", "true");

    // A real swipe with a finger: drag the carousel sideways and it settles on the next review.
    await track.scrollIntoViewIfNeeded();
    const swipeBox = (await track.boundingBox())!;
    const screenHeight = viewport?.height ?? 800;
    // Aim at the middle of the part of the carousel that is on screen.
    const y = Math.round((Math.max(swipeBox.y, 0) + Math.min(swipeBox.y + swipeBox.height, screenHeight)) / 2);
    const startX = Math.round(swipeBox.x + swipeBox.width * 0.85);
    const endX = Math.round(swipeBox.x + swipeBox.width * 0.25);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", startX);
    for (let step = 1; step <= 12; step++) {
      await touch("touchMove", Math.round(startX + ((endX - startX) * step) / 12));
      await page.waitForTimeout(16);
    }
    await touch("touchEnd", endX);
    await expect(dot(2)).toHaveAttribute("aria-current", "true");
    await expectNoHorizontalScroll(page);

    // The arrows are on every screen size, and they loop at both ends.
    const next = carousel.getByRole("button", { name: "Next review" });
    const previous = carousel.getByRole("button", { name: "Previous review" });
    await expect(next).toBeVisible();
    await expect(previous).toBeVisible();
    for (let n = 3; n <= count; n++) {
      await next.click();
      await expect(dot(n)).toHaveAttribute("aria-current", "true");
    }
    await next.click(); // past the last: back to the first
    await expect(dot(1)).toHaveAttribute("aria-current", "true");
    await previous.click(); // back from the first: the last
    await expect(dot(count)).toHaveAttribute("aria-current", "true");

    // The dots jump straight to a review and the page never scrolls sideways.
    await dot(1).click();
    await expect(dot(1)).toHaveAttribute("aria-current", "true");
    await expectNoHorizontalScroll(page);
  });

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

  test("the month calendar keeps readable squares and the hero wall stays out of small screens", async ({ page }) => {
    await page.goto("/statistics");
    await page.waitForLoadState("networkidle");
    const squares = page.getByRole("table", { name: "Games finished per month" }).locator("tbody td div");
    if ((await squares.count()) > 0) {
      const widths = await squares.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
      expect(Math.min(...widths), "calendar squares are too small to see").toBeGreaterThanOrEqual(14);
      await expectNoHorizontalScroll(page);
    }

    // The tilted wall of covers is for large screens only: on a phone or tablet it is not even shown.
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const wall = page.locator("section [aria-hidden='true'] img");
    for (let i = 0; i < (await wall.count()); i++) await expect(wall.nth(i)).toBeHidden();
    await expectNoHorizontalScroll(page);
  });

  test("on a touch screen nothing slides over the covers (no hover details to get stuck)", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phones only");
    await page.goto("/library");
    const card = page.locator("main li").first();
    await card.locator("a").first().waitFor();
    const opacities = await card.locator("div[aria-hidden='true']").evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
    for (const opacity of opacities) expect(opacity).toBe("0");
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
