import { defineConfig, devices } from "@playwright/test";

// Tests run against the real Supabase project configured in .env.local.
try {
  process.loadEnvFile(".env.local");
} catch {
  /* env may come from the shell / CI instead */
}

const PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // tests mutate the same database
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"], browserName: "chromium" },
      testMatch: /responsive\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
