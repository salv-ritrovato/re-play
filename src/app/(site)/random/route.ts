import { cookies } from "next/headers";
import { connection, NextResponse } from "next/server";
import { getAllSlugs } from "@/lib/data/public";

/** How many of the games already shown "Surprise me" remembers, so it does not bring them back. */
const MEMORY = 30;
const SEEN_COOKIE = "random_seen";

/**
 * "Surprise me": redirects to a random game, never one of the last few it showed, so every click leads
 * to a different title (and, with a small archive, you see nearly all of them before any comes back).
 * The memory is a small cookie with the latest slugs; it is only used for this and holds nothing personal.
 */
export async function GET(request: Request) {
  await connection(); // a different answer on every request: never prerender this
  const slugs = await getAllSlugs();
  if (slugs.length === 0) return noStore(NextResponse.redirect(new URL("/library", request.url), 307));

  const seen = ((await cookies()).get(SEEN_COOKIE)?.value ?? "").split(",").filter(Boolean);
  // Remember as many as fit, but always leave at least one title to pick (the very last one stays out).
  const memory = Math.min(MEMORY, slugs.length - 1);
  const recent = memory > 0 ? seen.slice(-memory) : [];
  const pool = slugs.filter((s) => !recent.includes(s));
  const pick = pool[Math.floor(Math.random() * pool.length)];

  const response = NextResponse.redirect(new URL(`/games/${pick}`, request.url), 307);
  response.cookies.set(SEEN_COOKIE, [...recent, pick].slice(-MEMORY).join(","), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return noStore(response);
}

/** The answer is different every time: neither the browser nor a CDN may reuse it. */
function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
