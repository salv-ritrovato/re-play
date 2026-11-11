import { expect, type APIRequestContext, type Page } from "@playwright/test";
import sharp from "sharp";

export const owner = {
  username: process.env.E2E_USERNAME ?? "",
  password: process.env.E2E_PASSWORD ?? "",
};

export async function login(page: Page, next = "/admin") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.locator("#username").fill(owner.username);
  await page.locator("#password").fill(owner.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/\//g, "\\/")}$`));
}

/** A real, decodable PNG built on the fly (no binary fixtures in the repo). */
export async function makeImage(width: number, height: number, color: string, format: "png" | "jpeg" = "png") {
  const img = sharp({ create: { width, height, channels: 3, background: color } });
  const buffer = format === "png" ? await img.png().toBuffer() : await img.jpeg().toBuffer();
  return { name: `fixture.${format === "png" ? "png" : "jpg"}`, mimeType: `image/${format}`, buffer };
}

export const uniqueTitle = (prefix = "E2E Game") => `${prefix} ${Date.now().toString(36)}`;

/**
 * Checks the preview image a page declares for sharing (Open Graph): the page points to it, it is a
 * real 1200x630 PNG and the page asks for the large card on X. Returns the image address.
 */
export async function expectPreviewImage(page: Page, request: APIRequestContext): Promise<string> {
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og, "the page must declare an og:image").toBeTruthy();
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

  // The address is absolute (site URL); ask the server under test for the same path.
  const res = await request.get(new URL(og!).pathname + new URL(og!).search);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const png = await sharp(await res.body()).metadata();
  expect([png.format, png.width, png.height]).toEqual(["png", 1200, 630]);
  return new URL(og!).pathname;
}
