import { connection, NextResponse } from "next/server";
import { getAllSlugs } from "@/lib/data/public";

/** "Surprise me": redirects to a random game (or to the library when the archive is empty). */
export async function GET(request: Request) {
  await connection(); // a different answer on every request: never prerender this
  const slugs = await getAllSlugs();
  const target = slugs.length > 0 ? `/games/${slugs[Math.floor(Math.random() * slugs.length)]}` : "/library";
  return NextResponse.redirect(new URL(target, request.url), 307);
}
