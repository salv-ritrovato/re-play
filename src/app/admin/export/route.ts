import { NextResponse } from "next/server";
import { assertOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * A backup of the whole archive as one JSON file: every game with all its fields (reviews in both languages,
 * pros and cons, genres and platforms by name), plus the genres and platforms lists. Only the owner can
 * download it. Cover images stay in Storage (the file lists their paths).
 */
export async function GET() {
  try {
    await assertOwner();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const [games, genres, platforms] = await Promise.all([
    supabase
      .from("games")
      .select("*, genres:game_genres(genre:genres(name)), platforms:game_platforms(platform:platforms(name))")
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase.from("genres").select("name, slug").order("name"),
    supabase.from("platforms").select("name, slug").order("name"),
  ]);
  const failure = games.error ?? genres.error ?? platforms.error;
  if (failure) return NextResponse.json({ error: failure.message }, { status: 500 });
  const gameRows = games.data ?? [];
  const genreRows = genres.data ?? [];
  const platformRows = platforms.data ?? [];

  type Row = { genres: { genre: { name: string } }[]; platforms: { platform: { name: string } }[] } & Record<string, unknown>;
  const backup = {
    app: "Re:Play",
    exportedAt: new Date().toISOString(),
    counts: { games: gameRows.length, genres: genreRows.length, platforms: platformRows.length },
    genres: genreRows,
    platforms: platformRows,
    games: (gameRows as unknown as Row[]).map((g) => ({
      ...g,
      genres: g.genres.map((x) => x.genre.name).sort(),
      platforms: g.platforms.map((x) => x.platform.name).sort(),
    })),
  };

  const day = backup.exportedAt.slice(0, 10);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="replay-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
