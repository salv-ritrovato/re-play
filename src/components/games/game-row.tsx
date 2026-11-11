import Link from "next/link";
import { formatPlaytime, yearOf } from "@/lib/format";
import type { GameSummary } from "@/lib/types";
import { CompletionBadge, LauncherIcons, OnlineBadge, Rating, StatusBadge } from "./badges";
import { DeveloperLinks } from "./developer-links";
import { GameCover } from "./game-cover";

export function GameRow({ game }: { game: GameSummary }) {
  const year = yearOf(game.release_date);
  const playtime = formatPlaytime(game.playtime_hours);

  return (
    <li>
      {/* The title link is stretched over the whole row, which leaves room for the developer links. */}
      <div className="group relative grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-border py-3 transition-colors hover:bg-surface sm:grid-cols-[3.5rem_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_5rem] sm:px-2">
        <GameCover
          title={game.title}
          path={game.cover_path}
          blur={game.cover_blur}
          sizes="56px"
          zoom={false}
          className="rounded-sm"
        />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-medium">
              <Link
                href={`/games/${game.slug}`}
                className="outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
              >
                {game.title}
              </Link>
            </h3>
            {game.is_online && <OnlineBadge className="shrink-0" />}
            <LauncherIcons launchers={game.launchers} className="shrink-0" />
          </div>
          <p className="relative z-10 mt-0.5 truncate text-xs text-subtle">
            {year}
            {year && game.developer ? " · " : null}
            <DeveloperLinks value={game.developer} />
            {!year && !game.developer ? "-" : null}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground sm:hidden">
            {game.platforms.map((p) => p.name).join(", ")}
          </p>
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs text-muted-foreground">
            {game.genres.map((g) => g.name).join(", ") || "-"}
          </p>
          <p className="mt-1 truncate text-xs text-subtle">
            {game.platforms.map((p) => p.name).join(", ") || "-"}
          </p>
        </div>
        <div className="hidden flex-col gap-1 sm:flex">
          <StatusBadge status={game.play_status} />
          <div className="flex items-center gap-2">
            <CompletionBadge status={game.completion_status} />
            {playtime && <span className="text-xs text-subtle">{playtime}</span>}
          </div>
        </div>
        <div className="text-right">
          <Rating value={game.rating} />
        </div>
      </div>
    </li>
  );
}
