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

  test("the backup download is for the owner only, and holds every game", async ({ page, request }) => {
    // Anonymous: sent to the login page, nothing is served.
    const anonymous = await request.get("/admin/export", { maxRedirects: 0 });
    expect(anonymous.status()).toBe(307);
    expect(anonymous.headers()["location"]).toContain("/login");

    // Signed in: a JSON file with the games, their reviews and their genres by name.
    await login(page);
    const res = await page.request.get("/admin/export");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-disposition"]).toMatch(/attachment; filename="replay-backup-\d{4}-\d{2}-\d{2}\.json"/);
    expect(res.headers()["cache-control"]).toContain("no-store");
    const backup = await res.json();
    expect(backup.app).toBe("Re:Play");
    expect(backup.games.length).toBe(backup.counts.games);
    expect(backup.games.length).toBeGreaterThan(0);
    const game = backup.games[0];
    for (const field of ["slug", "title", "rating", "review_en", "review_it", "pros", "cons", "launchers"]) {
      expect(game).toHaveProperty(field);
    }
    expect(Array.isArray(game.genres)).toBe(true);
    expect(typeof (game.genres[0] ?? "")).toBe("string");

    // The button on the games list points to it.
    await page.goto("/admin/games");
    await expect(page.getByRole("link", { name: "Backup" })).toHaveAttribute("href", "/admin/export");
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
