import "server-only";
import { createClient } from "@/lib/supabase/server";
import { GAME_DETAIL_SELECT, normalizeDetail } from "@/lib/data/public";
import type { GameDetail, PlayStatus, Taxonomy } from "@/lib/types";

export const ADMIN_PAGE_SIZE = 20;

export interface AdminGameRow {
  id: string;
  slug: string;
  title: string;
  rating: number | null;
  play_status: PlayStatus;
  cover_path: string | null;
  cover_blur: string | null;
  review_en: string | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Admin reads always go through the session client (never cached, RLS applies). */
export async function getAdminDashboard() {
  const supabase = await createClient();
  const [totals, recent, noCover, noReview] = await Promise.all([
    supabase.from("games").select("id", { count: "exact", head: true }),
    supabase
      .from("games")
      .select("id, slug, title, cover_path, cover_blur, created_at, play_status")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("games")
      .select("id, slug, title", { count: "exact" })
      .is("cover_path", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("games")
      .select("id, slug, title", { count: "exact" })
      .or("review_en.is.null,review_en.eq.")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  for (const r of [totals, recent, noCover, noReview]) {
    if (r.error) throw new Error(`[getAdminDashboard] ${r.error.message}`);
  }
  return {
    total: totals.count ?? 0,
    recent: recent.data ?? [],
    missingCover: { count: noCover.count ?? 0, items: noCover.data ?? [] },
    missingReview: { count: noReview.count ?? 0, items: noReview.data ?? [] },
  };
}

export async function listAdminGames(params: {
  q?: string;
  status?: PlayStatus;
  missing?: "cover" | "review";
  page: number;
}) {
  const supabase = await createClient();
  const from = (params.page - 1) * ADMIN_PAGE_SIZE;

  let query = supabase
    .from("games")
    .select(
      "id, slug, title, rating, play_status, cover_path, cover_blur, review_en, release_date, created_at, updated_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  if (params.q) {
    // Strip characters that would break PostgREST's `or` filter syntax.
    const safe = params.q.replace(/[,()%*]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,developer.ilike.%${safe}%,publisher.ilike.%${safe}%`);
  }
  if (params.status) query = query.eq("play_status", params.status);
  if (params.missing === "cover") query = query.is("cover_path", null);
  if (params.missing === "review") query = query.or("review_en.is.null,review_en.eq.");

  const { data, count, error } = await query;
  if (error) throw new Error(`[listAdminGames] ${error.message}`);
  return { rows: (data ?? []) as AdminGameRow[], total: count ?? 0 };
}

export async function getGameForEdit(id: string): Promise<GameDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select(GAME_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`[getGameForEdit] ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data ? normalizeDetail(data as any) : null;
}

export async function getTaxonomies(): Promise<{ genres: Taxonomy[]; platforms: Taxonomy[]; tags: Taxonomy[] }> {
  const supabase = await createClient();
  const [genres, platforms, tags] = await Promise.all([
    supabase.from("genres").select("id, name, slug").order("name"),
    supabase.from("platforms").select("id, name, slug").order("name"),
    supabase.from("tags").select("id, name, slug").order("name"),
  ]);
  for (const r of [genres, platforms, tags]) {
    if (r.error) throw new Error(`[getTaxonomies] ${r.error.message}`);
  }
  return {
    genres: (genres.data ?? []) as Taxonomy[],
    platforms: (platforms.data ?? []) as Taxonomy[],
    tags: (tags.data ?? []) as Taxonomy[],
  };
}
