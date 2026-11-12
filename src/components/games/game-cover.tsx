import Image from "next/image";
import { ViewTransition } from "react";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

interface GameCoverProps {
  title: string;
  path: string | null;
  blur?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Scale the artwork slightly on hover (parent needs the `group` class). */
  zoom?: boolean;
  /** Small label pinned to the top-left corner of the artwork. */
  badge?: React.ReactNode;
  /** A line of details that slides up over the bottom of the artwork when the parent (class `group`) is hovered or focused. */
  details?: React.ReactNode;
  /**
   * Gives the cover a name so it can morph into the same cover on another page (the browser's view transitions).
   * The name must be unique on the page, so only use it where each game appears once.
   */
  transitionName?: string;
}

/** 3:4 cover with blur placeholder; falls back to a typographic plate when there is no artwork. */
export function GameCover({
  title,
  path,
  blur,
  className,
  sizes = "(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 45vw",
  priority,
  zoom = true,
  badge,
  details,
  transitionName,
}: GameCoverProps) {
  const src = mediaUrl(path);

  const cover = (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border bg-card",
        className,
      )}
    >
      {badge && <div className="absolute top-2 left-2 z-10">{badge}</div>}
      {details && (
        // Decorative and never in the way of clicks; only where there is a real hover (not on touch screens).
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-1 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pt-12 pb-3 text-xs leading-snug text-white/90 opacity-0 transition duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none"
        >
          {details}
        </div>
      )}
      {src ? (
        <Image
          src={src}
          alt={`${title} cover`}
          fill
          sizes={sizes}
          quality={75}
          priority={priority}
          placeholder={blur ? "blur" : "empty"}
          blurDataURL={blur ?? undefined}
          className={cn(
            "object-cover",
            zoom && "transition-transform duration-500 ease-out group-hover:scale-[1.03]",
          )}
        />
      ) : (
        <div
          role="img"
          aria-label={`${title} - no cover artwork`}
          className="flex h-full w-full flex-col items-start justify-end gap-2 bg-gradient-to-b from-card to-surface p-4"
        >
          <span className="text-4xl font-semibold tracking-tighter text-elevated">
            {title.trim().slice(0, 2)}
          </span>
          <span className="line-clamp-3 text-xs text-subtle">{title}</span>
        </div>
      )}
    </div>
  );

  return transitionName ? (
    <ViewTransition name={transitionName} share="morph" default="none">
      {cover}
    </ViewTransition>
  ) : (
    cover
  );
}
