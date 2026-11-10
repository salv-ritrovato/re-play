"use server";

import { updateTag } from "next/cache";
import { assertOwner } from "@/lib/auth";
import { TAGS } from "@/lib/data/public";
import { slugify } from "@/lib/format";
import { ImageError, processImage } from "@/lib/images";
import { MEDIA_BUCKET } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { gameSchema, taxonomyNameSchema } from "@/lib/validation";

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function files(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0);
}

function invalidate(...slugs: (string | null | undefined)[]) {
  updateTag(TAGS.games);
  updateTag(TAGS.taxonomy);
  for (const s of new Set(slugs)) if (s) updateTag(`game:${s}`);
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------
export async function saveGame(
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await assertOwner();
  const supabase = await createClient();

  // 1. Validate the structured payload (server-side, same schema as the form).
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { ok: false, error: "Malformed form data." };
  }
  const parsed = gameSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const v = parsed.data;
  const id = (formData.get("id") as string | null) || null;
  const isEdit = Boolean(id);

  // 2. Validate + optimize media BEFORE touching the database.
  const coverFile = files(formData, "cover")[0];

  let cover: Awaited<ReturnType<typeof processImage>> | undefined;
  try {
    if (coverFile) cover = await processImage(coverFile);
  } catch (e) {
    if (e instanceof ImageError) return { ok: false, error: e.message };
    console.error("[saveGame] image processing failed", e);
    return { ok: false, error: "Could not process the uploaded image." };
  }

  // 3. Existing record (edit).
  let previous: { slug: string; cover_path: string | null } | null = null;
  if (isEdit) {
    const { data } = await supabase
      .from("games")
      .select("slug, cover_path")
      .eq("id", id!)
      .maybeSingle();
    if (!data) return { ok: false, error: "This game no longer exists." };
    previous = data;
  }

  // 4. Upsert the game row.
  const row = {
    slug: v.slug,
    title: v.title,
    short_description: v.short_description,
    description: v.description,
    release_date: v.release_date,
    developer: v.developer,
    publisher: v.publisher,
    rating: v.rating,
    play_status: v.play_status,
    completion_status: v.completion_status,
    playtime_hours: v.playtime_hours,
    completed_on: v.completed_on,
    review_en: v.review_en,
    review_it: v.review_it,
    pros: v.pros,
    cons: v.cons,
    featured: v.featured,
    is_online: v.is_online,
  };

  const write = isEdit
    ? await supabase.from("games").update(row).eq("id", id!).select("id").single()
    : await supabase.from("games").insert(row).select("id").single();

  if (write.error) {
    if (write.error.code === "23505") {
      return {
        ok: false,
        error: "Another game already uses this slug.",
        fieldErrors: { slug: "Slug already in use" },
      };
    }
    console.error("[saveGame] write failed", write.error);
    return { ok: false, error: "Could not save the game." };
  }
  const gameId = write.data.id as string;
  const uploaded: string[] = [];

  try {
    // 5. Relations.
    await replaceLinks(supabase, "game_genres", "genre_id", gameId, v.genre_ids);
    await replaceLinks(supabase, "game_platforms", "platform_id", gameId, v.platform_ids);
    await syncTags(supabase, gameId, v.tags);

    // 6. Cover.
    const removeCover = formData.get("removeCover") === "true";
    if (cover) {
      const path = `${gameId}/cover-${Date.now()}.webp`;
      await upload(supabase, path, cover.buffer);
      uploaded.push(path);
      const { error } = await supabase
        .from("games")
        .update({ cover_path: path, cover_blur: cover.blur })
        .eq("id", gameId);
      if (error) throw error;
      if (previous?.cover_path) await removeObjects(supabase, [previous.cover_path]);
    } else if (removeCover && previous?.cover_path) {
      const { error } = await supabase
        .from("games")
        .update({ cover_path: null, cover_blur: null })
        .eq("id", gameId);
      if (error) throw error;
      await removeObjects(supabase, [previous.cover_path]);
    }

  } catch (e) {
    console.error("[saveGame] post-write step failed", e);
    if (!isEdit) {
      // Don't leave a half-created record behind.
      await removeObjects(supabase, uploaded);
      await supabase.from("games").delete().eq("id", gameId);
    }
    return { ok: false, error: "The game was saved only partially. Please try again." };
  }

  invalidate(v.slug, previous?.slug);
  return { ok: true, id: gameId, slug: v.slug };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteGame(id: string): Promise<ActionResult> {
  await assertOwner();
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("slug, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (!game) return { ok: false, error: "Game not found." };

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    console.error("[deleteGame]", error);
    return { ok: false, error: "Could not delete the game." };
  }

  if (game.cover_path) await removeObjects(supabase, [game.cover_path as string]);

  invalidate(game.slug as string);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Taxonomy (genres / platforms created on the fly from the form)
// ---------------------------------------------------------------------------
export async function createTaxonomy(
  kind: "genres" | "platforms",
  name: string,
): Promise<ActionResult<{ item: { id: string; name: string; slug: string } }>> {
  await assertOwner();
  const parsed = taxonomyNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const slug = slugify(parsed.data);
  if (!slug) return { ok: false, error: "Use at least one letter or number." };

  const { data, error } = await supabase
    .from(kind)
    .insert({ name: parsed.data, slug })
    .select("id, name, slug")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That name already exists." };
    console.error("[createTaxonomy]", error);
    return { ok: false, error: "Could not create it." };
  }
  // Deliberately NO cache invalidation here: it would make Next re-render the page under the
  // form while the owner is still typing. The public caches are refreshed when the game is
  // saved (saveGame invalidates the taxonomy tag), which is when the new genre becomes visible.
  return { ok: true, item: data };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type Client = Awaited<ReturnType<typeof createClient>>;

async function upload(supabase: Client, path: string, body: Buffer) {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
}

async function removeObjects(supabase: Client, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  if (error) console.error("[storage.remove]", error);
}

async function replaceLinks(
  supabase: Client,
  table: "game_genres" | "game_platforms",
  column: "genre_id" | "platform_id",
  gameId: string,
  ids: string[],
) {
  const del = await supabase.from(table).delete().eq("game_id", gameId);
  if (del.error) throw del.error;
  if (ids.length === 0) return;
  const ins = await supabase
    .from(table)
    .insert([...new Set(ids)].map((id) => ({ game_id: gameId, [column]: id })));
  if (ins.error) throw ins.error;
}

async function syncTags(supabase: Client, gameId: string, names: string[]) {
  const del = await supabase.from("game_tags").delete().eq("game_id", gameId);
  if (del.error) throw del.error;
  if (names.length === 0) return;

  const unique = new Map<string, string>();
  for (const n of names) {
    const slug = slugify(n);
    if (slug) unique.set(slug, n);
  }
  const { data, error } = await supabase
    .from("tags")
    .upsert(
      [...unique].map(([slug, name]) => ({ slug, name })),
      { onConflict: "slug", ignoreDuplicates: false },
    )
    .select("id");
  if (error) throw error;

  const ins = await supabase
    .from("game_tags")
    .insert((data ?? []).map((t) => ({ game_id: gameId, tag_id: t.id })));
  if (ins.error) throw ins.error;
}
