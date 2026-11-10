/**
 * Removes leftover test data: "E2E Game" records (with their cover) and "E2E Genre" genres.
 * Uses the owner session through the public API: same permissions as the CMS, no service key.
 *
 *   node --env-file=.env.local --experimental-strip-types tests/cleanup.ts
 *
 * Also imported by the Playwright specs (`cleanupE2E`) to tidy up after themselves.
 */
export async function cleanupE2E(log: (message: string) => void = () => {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const username = process.env.E2E_USERNAME!;
  const password = process.env.E2E_PASSWORD!;

  const email = username.includes("@") ? username : `${username.toLowerCase()}@re.local`;
  const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  if (!auth.access_token) throw new Error("Could not sign in as the owner");
  const headers = { apikey: key, Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" };

  const games: { id: string; slug: string; cover_path: string | null }[] = await fetch(
    `${url}/rest/v1/games?select=id,slug,cover_path&title=like.E2E%20Game%25`,
    { headers },
  ).then((r) => r.json());

  for (const g of games) {
    if (g.cover_path) {
      await fetch(`${url}/storage/v1/object/game-media`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ prefixes: [g.cover_path] }),
      });
    }
    await fetch(`${url}/rest/v1/games?id=eq.${g.id}`, { method: "DELETE", headers });
    log(`removed game ${g.slug}`);
  }

  const genres: { id: string; name: string }[] = await fetch(
    `${url}/rest/v1/genres?select=id,name&name=like.E2E%20Genre%25`,
    { headers },
  ).then((r) => r.json());
  for (const g of genres) {
    await fetch(`${url}/rest/v1/genres?id=eq.${g.id}`, { method: "DELETE", headers });
    log(`removed genre ${g.name}`);
  }

  return { games: games.length, genres: genres.length };
}

// Run as a script (not when imported by Playwright).
if (process.argv[1]?.replace(/\\/g, "/").endsWith("tests/cleanup.ts")) {
  cleanupE2E((m) => console.log(m))
    .then((r) => console.log(`Done: ${r.games} game(s) and ${r.genres} genre(s) removed.`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
