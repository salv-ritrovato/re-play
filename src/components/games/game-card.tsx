import Link from "next/link";
import { yearOf } from "@/lib/format";
import type { GameSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OnlineBadge, Rating, StatusBadge } from "./badges";
import { GameCover } from "./game-cover";

export function GameCard({
  game,
  className,
  priority,
  showStatus = true,
}: {
  game: GameSummary;
  className?: string;
  priority?: boolean;
  showStatus?: boolean;
}) {
  const year = yearOf(game.release_date);
  const platform = game.platforms[0]?.name;

  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn("group block rounded-md outline-offset-4", className)}
    >
      <GameCover
        title={game.title}
        path={game.cover_path}
        blur={game.cover_blur}
        priority={priority}
        badge={game.is_online ? <OnlineBadge /> : undefined}
        className="transition-colors group-hover:border-muted-foreground/40"
      />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">{game.title}</h3>
          <p className="mt-0.5 truncate text-xs text-subtle">
            {[year, platform].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <Rating value={game.rating} size="sm" />
      </div>
      {showStatus && <StatusBadge status={game.play_status} className="mt-1.5" />}
    </Link>
  );
}
