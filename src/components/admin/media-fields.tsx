"use client";

import { ImagePlus, Loader2, Trash2, Undo2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientImageError, compressForUpload, formatBytes } from "@/lib/client-image";
import { mediaUrl } from "@/lib/media";
import type { GameImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PendingImage {
  key: string;
  file: File;
  previewUrl: string;
  kind: "screenshot" | "artwork";
}

export interface MediaState {
  cover: { file: File; previewUrl: string } | null;
  removeCover: boolean;
  extras: PendingImage[];
  removedImageIds: string[];
}

export const emptyMedia: MediaState = {
  cover: null,
  removeCover: false,
  extras: [],
  removedImageIds: [],
};

export function MediaFields({
  title,
  existingCoverPath,
  existingImages,
  value,
  onChange,
}: {
  title: string;
  existingCoverPath: string | null;
  existingImages: GameImage[];
  value: MediaState;
  onChange: (next: MediaState) => void;
}) {
  const coverInput = useRef<HTMLInputElement>(null);
  const extraInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [extraKind, setExtraKind] = useState<"screenshot" | "artwork">("screenshot");
  const uid = useId();

  // Always keep the latest value reachable for async handlers + cleanup.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });

  // Preview URLs are revoked when an image is replaced, discarded or the form is reset (see
  // GameForm.resetForm). Not on unmount: Next keeps visited pages alive, so unmount != gone.

  async function pickCover(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressForUpload(file, { maxSide: 1800 });
      if (latest.current.cover) URL.revokeObjectURL(latest.current.cover.previewUrl);
      onChange({
        ...latest.current,
        cover: { file: compressed, previewUrl: URL.createObjectURL(compressed) },
        removeCover: false,
      });
      toast.success(`Cover ready · ${formatBytes(file.size)} → ${formatBytes(compressed.size)}`);
    } catch (e) {
      toast.error(e instanceof ClientImageError ? e.message : "Could not read that image.");
    } finally {
      setBusy(false);
      if (coverInput.current) coverInput.current.value = "";
    }
  }

  async function pickExtras(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const added: PendingImage[] = [];
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressForUpload(file, { maxSide: 2200, quality: 0.82 });
        added.push({
          key: crypto.randomUUID(),
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          kind: extraKind,
        });
      } catch (e) {
        toast.error(e instanceof ClientImageError ? e.message : `Could not read “${file.name}”.`);
      }
    }
    if (added.length > 0) {
      onChange({ ...latest.current, extras: [...latest.current.extras, ...added] });
    }
    setBusy(false);
    if (extraInput.current) extraInput.current.value = "";
  }

  const coverSrc = value.cover
    ? value.cover.previewUrl
    : value.removeCover
      ? null
      : mediaUrl(existingCoverPath);

  const keptExisting = existingImages.filter((i) => !value.removedImageIds.includes(i.id));

  return (
    <div className="space-y-10 sm:col-span-2">
      {/* Cover ------------------------------------------------------------ */}
      <div className="grid gap-6 sm:grid-cols-[11rem_1fr]">
        <div
          className={cn(
            "relative aspect-[3/4] w-44 overflow-hidden rounded-md border bg-card",
            coverSrc ? "border-border" : "border-dashed border-border",
          )}
        >
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={`Cover preview for ${title || "this game"}`}
              fill
              sizes="176px"
              unoptimized={Boolean(value.cover)}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-subtle">
              <ImagePlus className="size-5" />
              No cover
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Cover artwork</p>
            <p className="mt-1 text-xs text-subtle">
              JPEG, PNG, WebP or AVIF. Automatically resized and compressed to WebP (3:4) before and
              after upload.
            </p>
          </div>
          <input
            ref={coverInput}
            id={`${uid}-cover`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(e) => pickCover(e.target.files)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={busy}
              onClick={() => coverInput.current?.click()}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Upload />}
              {coverSrc ? "Replace cover" : "Upload cover"}
            </Button>
            {value.cover && (
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                onClick={() => {
                  URL.revokeObjectURL(value.cover!.previewUrl);
                  onChange({ ...value, cover: null });
                }}
              >
                <Undo2 /> Discard new
              </Button>
            )}
            {!value.cover && existingCoverPath && !value.removeCover && (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => onChange({ ...value, removeCover: true })}
              >
                <Trash2 /> Remove cover
              </Button>
            )}
            {value.removeCover && (
              <Button type="button" variant="ghost" className="gap-2" onClick={() => onChange({ ...value, removeCover: false })}>
                <Undo2 /> Keep cover
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Screenshots / artwork --------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Screenshots &amp; additional artwork</p>
            <p className="mt-1 text-xs text-subtle">Optional. Up to 12 new images per save.</p>
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Type of the images to add" className="flex rounded-lg border border-border p-0.5 text-xs">
              {(["screenshot", "artwork"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={extraKind === k}
                  onClick={() => setExtraKind(k)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 capitalize transition-colors",
                    extraKind === k ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
            <input
              ref={extraInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              aria-label="Add screenshots or artwork"
              onChange={(e) => pickExtras(e.target.files)}
            />
            <Button type="button" variant="outline" className="gap-2" disabled={busy} onClick={() => extraInput.current?.click()}>
              {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              Add images
            </Button>
          </div>
        </div>

        {keptExisting.length + value.extras.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-subtle">
            No additional images.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {keptExisting.map((img) => {
              const src = mediaUrl(img.path);
              return (
                <li key={img.id} className="group relative aspect-video overflow-hidden rounded-md border border-border bg-card">
                  {src && <Image src={src} alt={`${img.kind} for ${title}`} fill sizes="25vw" quality={60} className="object-cover" />}
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.625rem] text-white capitalize">{img.kind}</span>
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => onChange({ ...value, removedImageIds: [...value.removedImageIds, img.id] })}
                    className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-md bg-black/70 text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
            {value.extras.map((img) => (
              <li key={img.key} className="group relative aspect-video overflow-hidden rounded-md border border-violet/50 bg-card">
                <Image src={img.previewUrl} alt={`New ${img.kind}`} fill sizes="25vw" unoptimized className="object-cover" />
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.625rem] text-white capitalize">
                  New {img.kind} · {formatBytes(img.file.size)}
                </span>
                <button
                  type="button"
                  aria-label="Discard new image"
                  onClick={() => {
                    URL.revokeObjectURL(img.previewUrl);
                    onChange({ ...value, extras: value.extras.filter((e) => e.key !== img.key) });
                  }}
                  className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-md bg-black/70 text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {value.removedImageIds.length > 0 && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => onChange({ ...value, removedImageIds: [] })}
          >
            Undo {value.removedImageIds.length} removal{value.removedImageIds.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
