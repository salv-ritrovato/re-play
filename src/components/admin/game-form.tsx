"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { saveGame } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/format";
import {
  COMPLETION_LABEL,
  COMPLETION_STATUSES,
  PLAY_STATUSES,
  PLAY_STATUS_LABEL,
  type GameDetail,
  type Taxonomy,
} from "@/lib/types";
import { gameSchema, type GameFormInput, type GameFormValues } from "@/lib/validation";
import { DeleteGameButton } from "./delete-game-button";
import { Field, FormSection } from "./field";
import { emptyMedia, MediaFields, type MediaState } from "./media-fields";
import { TagInput } from "./tag-input";
import { TaxonomyPicker } from "./taxonomy-picker";

function toDefaults(game?: GameDetail): GameFormInput {
  return {
    title: game?.title ?? "",
    slug: game?.slug ?? "",
    short_description: game?.short_description ?? "",
    description: game?.description ?? "",
    release_date: game?.release_date ?? "",
    developer: game?.developer ?? "",
    publisher: game?.publisher ?? "",
    genre_ids: game?.genres.map((g) => g.id) ?? [],
    platform_ids: game?.platforms.map((p) => p.id) ?? [],
    tags: game?.tags.map((t) => t.name) ?? [],
    rating: game?.rating === null || game?.rating === undefined ? "" : String(game.rating),
    play_status: game?.play_status ?? "backlog",
    completion_status: game?.completion_status ?? "none",
    playtime_hours:
      game?.playtime_hours === null || game?.playtime_hours === undefined ? "" : String(game.playtime_hours),
    started_on: game?.started_on ?? "",
    completed_on: game?.completed_on ?? "",
    reviewed_on: game?.reviewed_on ?? "",
    review_en: game?.review_en ?? "",
    review_it: game?.review_it ?? "",
    pros: game?.pros.join("\n") ?? "",
    cons: game?.cons.join("\n") ?? "",
    notes: game?.notes ?? "",
    featured: game?.featured ?? false,
    is_online: game?.is_online ?? false,
  };
}

export function GameForm({
  game,
  genres: initialGenres,
  platforms: initialPlatforms,
  tagSuggestions,
}: {
  game?: GameDetail;
  genres: Taxonomy[];
  platforms: Taxonomy[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const isEdit = Boolean(game);
  const [isSaving, startSaving] = useTransition();
  const [genres, setGenres] = useState(initialGenres);
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [media, setMedia] = useState<MediaState>(emptyMedia);
  // Auto-generate the slug from the title until the user edits it by hand.
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const form = useForm<GameFormInput, unknown, GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: toDefaults(game),
    mode: "onTouched",
  });
  const { register, control, setValue, formState } = form;
  const errors = formState.errors;
  const title = useWatch({ control, name: "title" });

  function err(name: keyof GameFormInput) {
    const e = errors[name];
    return typeof e?.message === "string" ? e.message : undefined;
  }
  const aria = (name: keyof GameFormInput) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  /**
   * Next keeps the state of pages you have already visited (so "back" is instant), which means
   * a finished or cancelled form would reappear pre-filled the next time it is opened.
   * Reset explicitly when the work is done or abandoned.
   */
  function resetForm({ values }: { values: boolean }) {
    if (media.cover) URL.revokeObjectURL(media.cover.previewUrl);
    media.extras.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    setMedia(emptyMedia);
    if (values) {
      form.reset(toDefaults(game));
      setSlugTouched(isEdit);
    }
  }

  function submit() {
    // Validate with the shared schema, but send the raw field values: the server
    // re-validates and normalizes them with the very same schema.
    form.handleSubmit(
      () => {
        const fd = new FormData();
        fd.set("payload", JSON.stringify(form.getValues()));
        if (game) fd.set("id", game.id);
        if (media.cover) fd.set("cover", media.cover.file);
        if (media.removeCover) fd.set("removeCover", "true");
        for (const e of media.extras) {
          fd.append(e.kind === "screenshot" ? "screenshots" : "artwork", e.file);
        }
        fd.set("removeImageIds", JSON.stringify(media.removedImageIds));

        startSaving(async () => {
          const res = await saveGame(fd);
          if (!res.ok) {
            toast.error(res.error);
            for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
              form.setError(field as keyof GameFormInput, { message });
            }
            return;
          }
          toast.success(isEdit ? "Changes saved" : "Game added to the archive");
          // A new game starts from a blank form next time; an edited one keeps its (saved) values.
          resetForm({ values: !isEdit });
          router.push("/admin/games");
          router.refresh();
        });
      },
      () => {
        toast.error("Please fix the highlighted fields.");
        const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
        first?.focus();
      },
    )();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
      className="space-y-10"
    >
      {/* Basic information --------------------------------------------------- */}
      <FormSection title="Basic information" description="What the game officially is.">
        <Field id="title" label="Title" required error={err("title")} className="sm:col-span-2">
          <Input
            id="title"
            autoComplete="off"
            {...register("title", {
              onChange: (e) => {
                if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: true });
              },
            })}
            {...aria("title")}
          />
        </Field>
        <Field
          id="slug"
          label="Slug"
          required
          error={err("slug")}
          hint="Used in the page address: /games/your-slug"
          className="sm:col-span-2"
        >
          <Input
            id="slug"
            autoComplete="off"
            {...register("slug")}
            onInput={() => setSlugTouched(true)}
            {...aria("slug")}
          />
        </Field>
        <Field id="short_description" label="Short description" error={err("short_description")} hint="One or two sentences, shown on cards and previews." className="sm:col-span-2">
          <Textarea id="short_description" rows={2} {...register("short_description")} {...aria("short_description")} />
        </Field>
        <Field id="description" label="Full description" error={err("description")} className="sm:col-span-2">
          <Textarea id="description" rows={6} {...register("description")} {...aria("description")} />
        </Field>
        <Field id="release_date" label="Release date" error={err("release_date")}>
          <Input id="release_date" type="date" {...register("release_date")} {...aria("release_date")} />
        </Field>
        <div className="hidden sm:block" />
        <Field id="developer" label="Developer" error={err("developer")}>
          <Input id="developer" {...register("developer")} {...aria("developer")} />
        </Field>
        <Field id="publisher" label="Publisher" error={err("publisher")}>
          <Input id="publisher" {...register("publisher")} {...aria("publisher")} />
        </Field>
      </FormSection>

      {/* Classification ------------------------------------------------------ */}
      <FormSection title="Classification" description="Genres and platforms power the filters and statistics.">
        <Controller
          control={control}
          name="genre_ids"
          render={({ field }) => (
            <TaxonomyPicker
              kind="genres"
              label="Genres"
              options={genres}
              value={field.value}
              onChange={field.onChange}
              onCreated={(item) => setGenres((g) => [...g, item].sort((a, b) => a.name.localeCompare(b.name)))}
            />
          )}
        />
        <Controller
          control={control}
          name="platform_ids"
          render={({ field }) => (
            <TaxonomyPicker
              kind="platforms"
              label="Platforms"
              options={platforms}
              value={field.value}
              onChange={field.onChange}
              onCreated={(item) => setPlatforms((p) => [...p, item].sort((a, b) => a.name.localeCompare(b.name)))}
            />
          )}
        />
        <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4 sm:col-span-2">
          <div>
            <label htmlFor="is_online" className="text-sm font-medium">Online / competitive game</label>
            <p className="text-xs text-subtle">
              Stays in the library with its own &ldquo;Online&rdquo; label, and can be filtered in or out.
            </p>
          </div>
          <Controller
            control={control}
            name="is_online"
            render={({ field }) => (
              <Switch id="is_online" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
        <Field id="tags" label="Personal tags" className="sm:col-span-2" hint="Your own labels, e.g. “comfort game”, “co-op”, “replayable”.">
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagInput id="tags" value={field.value} onChange={field.onChange} suggestions={tagSuggestions} />
            )}
          />
        </Field>
      </FormSection>

      {/* Personal ------------------------------------------------------------ */}
      <FormSection title="Personal" description="Your experience with the game.">
        <Field id="rating" label="Rating (0-10)" error={err("rating")} hint="Decimals allowed, e.g. 8.5">
          <Input id="rating" type="number" inputMode="decimal" step="0.1" min="0" max="10" {...register("rating")} {...aria("rating")} />
        </Field>
        <Field id="playtime_hours" label="Total playtime (hours)" error={err("playtime_hours")}>
          <Input id="playtime_hours" type="number" inputMode="decimal" step="0.1" min="0" {...register("playtime_hours")} {...aria("playtime_hours")} />
        </Field>
        <Field id="play_status" label="Playing status">
          <Controller
            control={control}
            name="play_status"
            render={({ field }) => (
              <OptionSelect
                id="play_status"
                value={field.value}
                onValueChange={field.onChange}
                options={PLAY_STATUSES.map((s) => ({ value: s, label: PLAY_STATUS_LABEL[s] }))}
              />
            )}
          />
        </Field>
        <Field id="completion_status" label="Completion status">
          <Controller
            control={control}
            name="completion_status"
            render={({ field }) => (
              <OptionSelect
                id="completion_status"
                value={field.value}
                onValueChange={field.onChange}
                options={COMPLETION_STATUSES.map((s) => ({ value: s, label: COMPLETION_LABEL[s] }))}
              />
            )}
          />
        </Field>
        <Field id="started_on" label="Start date" error={err("started_on")}>
          <Input id="started_on" type="date" {...register("started_on")} {...aria("started_on")} />
        </Field>
        <Field id="completed_on" label="Completion date" error={err("completed_on")}>
          <Input id="completed_on" type="date" {...register("completed_on")} {...aria("completed_on")} />
        </Field>
        <Field id="reviewed_on" label="Review date" error={err("reviewed_on")}>
          <Input id="reviewed_on" type="date" {...register("reviewed_on")} {...aria("reviewed_on")} />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4 sm:self-end">
          <div>
            <label htmlFor="featured" className="text-sm font-medium">Feature on the home page</label>
            <p className="text-xs text-subtle">Only one game is shown at a time (the latest updated).</p>
          </div>
          <Controller
            control={control}
            name="featured"
            render={({ field }) => (
              <Switch id="featured" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </FormSection>

      {/* Editorial ------------------------------------------------------------ */}
      <FormSection title="Editorial" description="Your review, shown prominently on the game page.">
        <Field id="review_en" label="Review (English)" error={err("review_en")} className="sm:col-span-2" hint="Separate paragraphs with a blank line. Every review needs both an English and an Italian version.">
          <Textarea id="review_en" lang="en" rows={10} className="leading-relaxed" {...register("review_en")} {...aria("review_en")} />
        </Field>
        <Field id="review_it" label="Recensione (Italiano)" error={err("review_it")} className="sm:col-span-2" hint="Separa i paragrafi con una riga vuota.">
          <Textarea id="review_it" lang="it" rows={10} className="leading-relaxed" {...register("review_it")} {...aria("review_it")} />
        </Field>
        <Field id="pros" label="Pros" error={err("pros")} hint="One per line">
          <Textarea id="pros" rows={5} {...register("pros")} {...aria("pros")} />
        </Field>
        <Field id="cons" label="Cons" error={err("cons")} hint="One per line">
          <Textarea id="cons" rows={5} {...register("cons")} {...aria("cons")} />
        </Field>
        <Field id="notes" label="Personal notes" error={err("notes")} className="sm:col-span-2">
          <Textarea id="notes" rows={4} {...register("notes")} {...aria("notes")} />
        </Field>
      </FormSection>

      {/* Media ----------------------------------------------------------------- */}
      <FormSection title="Media" description="Cover artwork is the visual centre of the archive.">
        <MediaFields
          title={title}
          existingCoverPath={game?.cover_path ?? null}
          existingImages={game?.images ?? []}
          value={media}
          onChange={setMedia}
        />
      </FormSection>

      {/* Actions ---------------------------------------------------------------- */}
      <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2">
          {game && (
            <>
              <DeleteGameButton id={game.id} title={game.title} redirectTo="/admin/games" variant="outline" label="Delete" />
              <ButtonLink
                variant="ghost"
                className="gap-2"
                href={`/games/${game.slug}`} target="_blank"
              >
                <ExternalLink /> View page
              </ButtonLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink variant="ghost" href="/admin/games" onClick={() => resetForm({ values: true })}>
            Cancel
          </ButtonLink>
          <Button type="submit" disabled={isSaving} className="min-w-32 gap-2">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isEdit ? "Save changes" : "Add game"}
          </Button>
        </div>
      </div>
    </form>
  );
}
