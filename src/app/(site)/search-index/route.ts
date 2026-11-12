import { connection, NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/data/public";

/** The list the navbar search loads the first time it is opened (every title, with a few details). */
export async function GET() {
  await connection();
  const index = await getSearchIndex();
  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" },
  });
}
