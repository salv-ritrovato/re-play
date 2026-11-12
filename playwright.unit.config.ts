import { defineConfig } from "@playwright/test";

// The tests that need no browser, no server and no login: rules and helpers only. They run in a second, so
// they are what the automatic checks on GitHub run. (The "against the real database" test inside
// library-filter skips itself when the Supabase variables are missing.)
try {
  process.loadEnvFile(".env.local");
} catch {
  /* nothing to load: that is the normal case on GitHub */
}

export default defineConfig({
  testDir: "./tests",
  testMatch: /(format|image-formats|library-filter|search-index|validation)\.spec\.ts/,
  reporter: [["list"]],
  workers: 1,
});
