import Link from "next/link";
import { ArrowRight, Clock, Gamepad2, Layers, Shuffle, Star, type LucideIcon } from "lucide-react";
import { Rating } from "@/components/games/badges";
import { DeveloperLinks } from "@/components/games/developer-links";
import { GameCard } from "@/components/games/game-card";
import { StandoutCarousel, type StandoutSlide } from "@/components/games/standout-carousel";
import { GameCover } from "@/components/games/game-cover";
import { EmptyState } from "@/components/layout/empty-state";
import { Container, Section } from "@/components/layout/page-header";
import { TAGLINE, Wordmark } from "@/components/layout/wordmark";
import { ButtonLink } from "@/components/ui/button-link";
import { IconLabel } from "@/components/ui/icon-label";
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
  const { totals, recentlyAdded, topRated, lowestRated, genreTiles, featured, standout } = await getHomeData();
  const slides: StandoutSlide[] = standout.map((g) => ({
    slug: g.slug,
    title: g.title,
    year: yearOf(g.release_date),
    developer: g.developer,
    rating: Number(g.rating),
    cover_path: g.cover_path,
    cover_blur: g.cover_blur,
    excerpt: { en: excerpt(g.review_en, 300), it: g.review_it ? excerpt(g.review_it, 300) : null },
  }));
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
              with me, and what I thought of it
            </h1>
            <div className="flex flex-wrap gap-3">
              <ButtonLink size="lg" href="/library">
                Browse the library
              </ButtonLink>
              <ButtonLink size="lg" variant="outline" href="/reviews">
                Read the reviews
              </ButtonLink>
              {/* Not prefetched: opening it picks a random game. */}
              <ButtonLink size="lg" variant="ghost" href="/random" prefetch={false} className="gap-2">
                <Shuffle aria-hidden /> Surprise me
              </ButtonLink>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-12 gap-y-8 border-t border-border pt-8 lg:min-w-96 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
            <Stat icon={Gamepad2} label="Games" value={totals?.total_games ?? 0} />
            <Stat icon={Clock} label="Hours played" value={Number((totals?.total_playtime_hours ?? 0).toFixed(1))} />
            <Stat icon={Star} label="Average rating" value={formatRating(totals?.average_rating ?? null)} />
            <Stat icon={Layers} label="Favourite genre" value={genreTiles[0]?.name ?? "-"} />
          </dl>
        </Container>
      </section>

      <Container className="space-y-24 pt-16">
        {isEmpty ? (
          <EmptyState
            icon={Gamepad2}
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
            {slides.length > 0 && <StandoutCarousel slides={slides} label="Standout reviews" />}
            {featured && <Featured game={featured} />}

            {recentlyAdded.length > 0 && (
              <Shelf
                title="Recently added"
                eyebrow="Latest"
                games={recentlyAdded.slice(0, 6)}
                href="/library"
                hrefLabel="Open library"
              />
            )}
            {genreTiles.length > 0 && (
              <Section
                eyebrow="Explore"
                title="Browse by genre"
                action={
                  <Link
                    href="/library"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    All games <ArrowRight className="size-3.5" />
                  </Link>
                }
              >
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {genreTiles.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={`/library?genre=${g.id}`}
                        className="flex items-baseline justify-between gap-3 rounded-md border border-border px-4 py-3 transition-colors outline-none hover:border-muted-foreground/50 hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span className="truncate text-sm font-medium">{g.name}</span>
                        <span className="text-xs tabular-nums text-subtle">
                          {g.games}
                          <span className="sr-only"> {g.games === 1 ? "game" : "games"}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
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
            {lowestRated.length >= 3 && (
              <Shelf
                title="Lowest rated"
                eyebrow="The blunt truth"
                games={lowestRated}
                href="/library?sort=rating_asc"
                hrefLabel="Ranking"
              />
            )}
          </>
        )}

        {/* Who is behind the reviews --------------------------------------- */}
        <section
          aria-labelledby="home-about"
          className="grid gap-6 rounded-md border border-border bg-surface p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div className="max-w-2xl space-y-3">
            <p className="eyebrow">About me</p>
            <h2 id="home-about" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
              Who&apos;s behind the reviews
            </h2>
            <p className="text-base leading-relaxed text-pretty text-muted-foreground">
              I&apos;m Salvatore, a die-hard gamer. As a kid I dreamed of becoming a game reviewer, and this is my
              take on the games I play: honest, personal and free of any influence.
            </p>
          </div>
          <ButtonLink href="/about" variant="outline" size="lg" className="gap-2">
            More about me <ArrowRight aria-hidden />
          </ButtonLink>
        </section>
      </Container>
    </>
  );
}

function Stat({ icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="space-y-1.5">
      <dt className="eyebrow">
        <IconLabel icon={icon}>{label}</IconLabel>
      </dt>
      <dd className="text-4xl font-semibold tracking-tight break-words tabular-nums">{value}</dd>
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

/** The game the owner picked with "Feature on the home page" (no automatic fallback: the carousel covers the best ones). */
function Featured({ game }: { game: NonNullable<Awaited<ReturnType<typeof getHomeData>>["featured"]> }) {
  const g = game;
  const year = yearOf(g.release_date);
  const text =
    g.short_description || g.review_en || ("description" in g ? g.description : null) || "";

  return (
    <section aria-labelledby="featured" className="space-y-6">
      <p className="eyebrow">Featured</p>
      {/* The title link is stretched over the whole card, which leaves room for the developer links. */}
      <div className="group relative grid gap-8 rounded-md border border-border bg-surface p-5 transition-colors hover:border-muted-foreground/40 sm:grid-cols-[14rem_1fr] sm:gap-12 sm:p-8 lg:grid-cols-[18rem_1fr] lg:p-10">
        <GameCover
          title={g.title}
          path={g.cover_path}
          blur={g.cover_blur}
          sizes="(min-width: 1024px) 288px, (min-width: 640px) 224px, 90vw"
          className="mx-auto max-w-72 shadow-xl shadow-black/50 sm:max-w-none"
        />
        <div className="flex flex-col justify-center">
          <h2 id="featured" className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            <Link
              href={`/games/${g.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
            >
              {g.title}
            </Link>
          </h2>
          <p className="relative z-10 mt-3 text-sm text-subtle">
            {year}
            {year && g.developer ? " · " : null}
            <DeveloperLinks value={g.developer} />
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
      </div>
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
