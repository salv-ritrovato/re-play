import { expect, test } from "@playwright/test";
import { login, owner } from "./helpers";

test.describe("authentication & route protection", () => {
  test.skip(!owner.username || !owner.password, "E2E_USERNAME / E2E_PASSWORD not set");

  test("admin routes redirect anonymous visitors to the login page", async ({ page }) => {
    for (const path of ["/admin", "/admin/games", "/admin/games/new"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?next=/);
    }
    await expect(page.getByRole("heading", { name: "Owner sign in" })).toBeVisible();
  });

  test("wrong credentials show an error and stay on the login page", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#username").fill(owner.username);
    await page.locator("#password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid username or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("empty form shows field errors", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter your username")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("owner can sign in and out", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("anonymous visitors cannot write through the public API (RLS)", async ({ request }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const res = await request.post(`${url}/rest/v1/games`, {
      headers: { apikey: key, "Content-Type": "application/json" },
      data: { slug: "anon-attack", title: "anon attack" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    const read = await request.get(`${url}/rest/v1/games?select=slug&slug=eq.anon-attack`, {
      headers: { apikey: key },
    });
    expect(await read.json()).toEqual([]);
  });
});
