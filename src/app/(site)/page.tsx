import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Rating } from "@/components/games/badges";
import { GameCard } from "@/components/games/game-card";
import { GameCover } from "@/components/games/game-cover";
import { EmptyState } from "@/components/layout/empty-state";
import { Container, Section } from "@/components/layout/page-header";
import { TAGLINE, Wordmark } from "@/components/layout/wordmark";
import { ButtonLink } from "@/components/ui/button-link";
import { getHomeData } from "@/lib/data/public";
import { excerpt, formatRating, yearOf } from "@/lib/format";
import type { GameSummary } from "@/lib/types";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const { totals, recentlyAdded, recentlyReviewed, topRated, currentlyPlaying, featured } =
    await getHomeData();
  const isEmpty = !totals || totals.total_games === 0;

  return (
    <>
      {/* Hero -------------------------------------------------------------- */}
      <section className="border-b border-border">
        <Container className="grid gap-12 pt-16 pb-14 sm:pt-24 sm:pb-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-8">
            <div className="space-y-3">
              <Wordmark size="xl" asLink={false} />
              <p className="eyebrow">{TAGLINE}</p>
            </div>
            <h1 className="max-w-2xl text-3xl leading-tight font-medium tracking-tight text-balance text-foreground/90 sm:text-4xl">
              A quiet record of every world I&apos;ve wandered through - what I played, what stayed
              with me, and what I thought of it.
            </h1>
            <div className="flex flex-wrap gap-3">
              <ButtonLink size="lg" href="/library">
                Browse the library
              </ButtonLink>
              <ButtonLink size="lg" variant="outline" href="/reviews">
                Read the reviews
              </ButtonLink>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-12 gap-y-8 border-t border-border pt-8 lg:min-w-96 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
            <Stat label="Games" value={totals?.total_games ?? 0} />
            <Stat label="Completed" value={totals?.completed ?? 0} />
            <Stat label="Playing now" value={totals?.playing ?? 0} />
            <Stat label="Average rating" value={formatRating(totals?.average_rating ?? null)} />
          </dl>
        </Container>
      </section>

      <Container className="space-y-24 pt-16">
        {isEmpty ? (
          <EmptyState
            title="Nothing here yet"
            description="Your archive is empty. Add your first game from the admin area and it will appear here."
            action={
              <ButtonLink href="/admin/games/new">
                Add a game
              </ButtonLink>
            }
          />
        ) : (
          <>
            <Featured game={featured} fallback={topRated[0]} />

            {currentlyPlaying.length > 0 && (
              <Shelf title="Currently playing" eyebrow="Now" games={currentlyPlaying.slice(0, 6)} />
            )}
            <Shelf
              title="Recently added"
              eyebrow="Latest"
              games={recentlyAdded.slice(0, 6)}
              href="/library"
              hrefLabel="Open library"
            />
            {recentlyReviewed.length > 0 && (
              <Shelf
                title="Latest reviews"
                eyebrow="Reviews"
                games={recentlyReviewed.slice(0, 6)}
                href="/reviews"
                hrefLabel="All reviews"
              />
            )}
            {topRated.length > 0 && (
              <Shelf
                title="Highest rated"
                eyebrow="Best of"
                games={topRated}
                href="/library?sort=rating_desc"
                hrefLabel="Ranking"
              />
            )}
          </>
        )}
      </Container>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-1.5">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-4xl font-semibold tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}

function Shelf({
  title,
  eyebrow,
  games,
  href,
  hrefLabel,
}: {
  title: string;
  eyebrow: string;
  games: GameSummary[];
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <Section
      title={title}
      eyebrow={eyebrow}
      action={
        href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {hrefLabel} <ArrowRight className="size-3.5" />
          </Link>
        )
      }
    >
      <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
        {games.map((g) => (
          <li key={g.id}>
            <GameCard game={g} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Featured({
  game,
  fallback,
}: {
  game: Awaited<ReturnType<typeof getHomeData>>["featured"];
  fallback?: GameSummary;
}) {
  const g = game ?? fallback;
  if (!g) return null;
  const year = yearOf(g.release_date);
  const text =
    g.short_description || g.review_en || ("description" in g ? g.description : null) || "";

  return (
    <section aria-labelledby="featured" className="space-y-6">
      <p className="eyebrow">{game ? "Featured" : "Standout"}</p>
      <Link
        href={`/games/${g.slug}`}
        className="group grid gap-8 rounded-md border border-border bg-surface p-5 transition-colors hover:border-muted-foreground/40 sm:grid-cols-[14rem_1fr] sm:gap-12 sm:p-8 lg:grid-cols-[18rem_1fr] lg:p-10"
      >
        <GameCover
          title={g.title}
          path={g.cover_path}
          blur={g.cover_blur}
          sizes="(min-width: 1024px) 288px, (min-width: 640px) 224px, 90vw"
          className="mx-auto max-w-72 shadow-xl shadow-black/50 sm:max-w-none"
        />
        <div className="flex flex-col justify-center">
          <h2 id="featured" className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {g.title}
          </h2>
          <p className="mt-3 text-sm text-subtle">
            {[year, g.developer].filter(Boolean).join(" · ")}
          </p>
          {text && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
              {excerpt(text, 320)}
            </p>
          )}
          <div className="mt-8 flex items-center gap-6">
            <Rating value={g.rating} size="lg" />
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              Read more
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

function HomeSkeleton() {
  return (
    <Container className="space-y-12 pt-24" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-32 w-48" />
      <Skeleton className="h-24 w-2/3" />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    </Container>
  );
}
