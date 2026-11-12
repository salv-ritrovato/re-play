import Link from "next/link";
import { yearOf } from "@/lib/format";
import type { LibraryGame } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LauncherIcons, OnlineBadge, Rating, StatusBadge } from "./badges";
import { DeveloperLinks } from "./developer-links";
import { GameCover } from "./game-cover";

/**
 * The whole card opens the game: the title link is stretched over it (`after:absolute`), which leaves
 * room for the developer links on top (a link cannot live inside another link).
 */
export function GameCard({
  game,
  className,
  priority,
  showStatus = true,
}: {
  game: LibraryGame;
  className?: string;
  priority?: boolean;
  showStatus?: boolean;
}) {
  const year = yearOf(game.release_date);

  return (
    <div className={cn("group relative rounded-md", className)}>
      <GameCover
        title={game.title}
        path={game.cover_path}
        blur={game.cover_blur}
        priority={priority}
        badge={game.is_online ? <OnlineBadge /> : undefined}
        className="transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-muted-foreground/40 group-hover:shadow-xl group-hover:shadow-black/50 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
      />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">
            <Link
              href={`/games/${game.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
            >
              {game.title}
            </Link>
          </h3>
          <p className="relative z-10 mt-0.5 truncate text-xs text-subtle">
            {year}
            {year && game.developer ? " · " : null}
            <DeveloperLinks value={game.developer} />
            {!year && !game.developer ? "-" : null}
          </p>
        </div>
        <Rating value={game.rating} size="sm" />
      </div>
      {(showStatus || game.launchers.length > 0) && (
        <div className="relative z-10 mt-1.5 flex items-center justify-between gap-2">
          {showStatus ? <StatusBadge status={game.play_status} /> : <span />}
          <LauncherIcons launchers={game.launchers} />
        </div>
      )}
    </div>
  );
}
