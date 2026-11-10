"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import type { GameImage } from "@/lib/types";

export function ScreenshotGallery({ images, title }: { images: GameImage[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);

  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step]);

  if (images.length === 0) return null;
  const current = active === null ? null : images[active];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((img, i) => {
          const src = mediaUrl(img.path);
          if (!src) return null;
          return (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Open ${img.kind} ${i + 1} of ${images.length} for ${title}`}
                className="group relative block aspect-video w-full overflow-hidden rounded-md border border-border bg-card outline-offset-4"
              >
                <Image
                  src={src}
                  alt={`${title} ${img.kind} ${i + 1}`}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  quality={60}
                  placeholder={img.blur ? "blur" : "empty"}
                  blurDataURL={img.blur ?? undefined}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-[min(96vw,1200px)] gap-0 border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-[min(96vw,1200px)]">
          <DialogTitle className="sr-only">{title} — image gallery</DialogTitle>
          <DialogDescription className="sr-only">
            Use the arrow keys to move between images.
          </DialogDescription>
          {current && mediaUrl(current.path) && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
              <Image
                src={mediaUrl(current.path)!}
                alt={`${title} ${current.kind} ${(active ?? 0) + 1}`}
                fill
                sizes="96vw"
                quality={85}
                className="object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => step(-1)}
                    className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => step(1)}
                    className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronRight />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
