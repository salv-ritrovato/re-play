import { expect, type Page } from "@playwright/test";
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
