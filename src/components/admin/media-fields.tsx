"use client";

import { ImagePlus, Loader2, Trash2, Undo2, Upload } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientImageError, compressForUpload, formatBytes } from "@/lib/client-image";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export interface MediaState {
  cover: { file: File; previewUrl: string } | null;
  removeCover: boolean;
}

export const emptyMedia: MediaState = {
  cover: null,
  removeCover: false,
};

/** Cover artwork picker: validates and compresses in the browser before upload. */
export function MediaFields({
  title,
  existingCoverPath,
  value,
  onChange,
}: {
  title: string;
  existingCoverPath: string | null;
  value: MediaState;
  onChange: (next: MediaState) => void;
}) {
  const coverInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const uid = useId();

  async function pickCover(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressForUpload(file, { maxSide: 1800 });
      if (value.cover) URL.revokeObjectURL(value.cover.previewUrl);
      onChange({
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

  const coverSrc = value.cover
    ? value.cover.previewUrl
    : value.removeCover
      ? null
      : mediaUrl(existingCoverPath);

  return (
    <div className="grid gap-6 sm:col-span-2 sm:grid-cols-[11rem_1fr]">
      <div
        className={cn(
          "relative aspect-[3/4] w-44 overflow-hidden rounded-md border bg-card",
          coverSrc ? "border-border" : "border-dashed border-border",
        )}
      >
        {coverSrc ? (
          <>
            {/* A new upload is shown whole, over a blurred copy: what the server will store (the stored cover is already 3:4). */}
            {value.cover && (
              <Image
                src={coverSrc}
                alt=""
                aria-hidden
                fill
                sizes="176px"
                unoptimized
                className="scale-110 object-cover opacity-50 blur-xl"
              />
            )}
            <Image
              src={coverSrc}
              alt={`Cover preview for ${title || "this game"}`}
              fill
              sizes="176px"
              unoptimized={Boolean(value.cover)}
              className={value.cover ? "object-contain" : "object-cover"}
            />
          </>
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
            after upload. Art that is not 3:4 is never cropped: it is shown whole, with a blurred copy filling the
            sides.
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
  );
}
