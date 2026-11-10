import Link from "next/link";
import { excerpt, formatDate, yearOf } from "@/lib/format";
import { reviewFor, type GameSummary, type Lang } from "@/lib/types";
import { Rating } from "./badges";
import { GameCover } from "./game-cover";

export function ReviewCard({ game, lang }: { game: GameSummary; lang: Lang }) {
  const reviewed = formatDate(game.reviewed_on, true);
  const year = yearOf(game.release_date);

  return (
    <article className="group relative grid grid-cols-[6.5rem_1fr] gap-5 border-b border-border py-7 sm:grid-cols-[9rem_1fr] sm:gap-8">
      <GameCover
        title={game.title}
        path={game.cover_path}
        blur={game.cover_blur}
        sizes="(min-width: 640px) 144px, 104px"
      />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              <Link
                href={`/games/${game.slug}`}
                className="after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4"
              >
                {game.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-subtle">
              {[year, game.genres.map((g) => g.name).join(", ")].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Rating value={game.rating} size="lg" className="shrink-0" />
        </div>

        <p
          lang={lang}
          className="mt-4 line-clamp-4 text-[0.9375rem] leading-relaxed text-muted-foreground sm:line-clamp-5"
        >
          {excerpt(reviewFor(game, lang), 360)}
        </p>

        <p className="mt-auto pt-4 text-xs text-subtle">
          {reviewed ? `${lang === "it" ? "Recensito il" : "Reviewed"} ${reviewed}` : "Review"}
        </p>
      </div>
    </article>
  );
}
