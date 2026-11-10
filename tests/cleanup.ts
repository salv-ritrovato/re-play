/**
 * Removes leftover "E2E Game" records (and their images) created by interrupted test runs.
 * Uses the owner session through the public API: same permissions as the CMS, no service key.
 *
 *   node --env-file=.env.local --experimental-strip-types tests/cleanup.ts
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const username = process.env.E2E_USERNAME!;
const password = process.env.E2E_PASSWORD!;

async function main() {
  const email = username.includes("@") ? username : `${username.toLowerCase()}@re.local`;
  const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  if (!auth.access_token) throw new Error("Could not sign in as the owner");
  const headers = { apikey: key, Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" };

  const games: { id: string; slug: string; cover_path: string | null; game_images: { path: string }[] }[] = await fetch(
    `${url}/rest/v1/games?select=id,slug,cover_path,game_images(path)&title=like.E2E%20Game%25`,
    { headers },
  ).then((r) => r.json());

  for (const g of games) {
    const paths = [g.cover_path, ...g.game_images.map((i) => i.path)].filter(Boolean) as string[];
    if (paths.length) {
      await fetch(`${url}/storage/v1/object/game-media`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ prefixes: paths }),
      });
    }
    await fetch(`${url}/rest/v1/games?id=eq.${g.id}`, { method: "DELETE", headers });
    console.log("removed", g.slug);
  }
  console.log(`Done: ${games.length} leftover game(s) removed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
