import Image from "next/image";
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
}: GameCoverProps) {
  const src = mediaUrl(path);

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border bg-card",
        className,
      )}
    >
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
          aria-label={`${title} — no cover artwork`}
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
}
