import {
  Building2,
  Calendar,
  CalendarCheck,
  Clock,
  Flag,
  Layers,
  Monitor,
  Rocket,
  Star,
  Store,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompletionBadge, LauncherIcons, OnlineBadge, Rating, StatusBadge } from "@/components/games/badges";
import { DeveloperLinks } from "@/components/games/developer-links";
import { GameCard } from "@/components/games/game-card";
import { GameCover } from "@/components/games/game-cover";
import { ReviewTabs } from "@/components/games/review-tabs";
import { Container, Section } from "@/components/layout/page-header";
import { IconLabel } from "@/components/ui/icon-label";
import { LauncherIcon } from "@/components/ui/launcher-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { getGameBySlug, getRelatedGames } from "@/lib/data/public";
import { excerpt, formatDate, formatPlaytime, yearOf } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { LAUNCHER_NAME, type GameDetail } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  const description =
    excerpt(game.short_description ?? game.review_en ?? game.description, 160) || undefined;
  const cover = mediaUrl(game.cover_path);
  return {
    title: game.title,
    description,
    openGraph: { title: game.title, description, images: cover ? [cover] : undefined },
  };
}

export default function GamePage({ params }: PageProps<"/games/[slug]">) {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <GameContent params={params} />
    </Suspense>
  );
}

async function GameContent({ params }: { params: PageProps<"/games/[slug]">["params"] }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const year = yearOf(game.release_date);
  const hasPersonal =
    Boolean(game.review_en) || game.pros.length > 0 || game.cons.length > 0;

  return (
    <article>
      {/* Hero ------------------------------------------------------------ */}
      <div className="border-b border-border bg-surface">
        <Container className="grid gap-10 py-10 sm:py-16 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-14 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="mx-auto w-full max-w-[18rem] md:max-w-none">
            <GameCover
              title={game.title}
              path={game.cover_path}
              blur={game.cover_blur}
              priority
              zoom={false}
              sizes="(min-width: 1024px) 352px, (min-width: 768px) 288px, 288px"
              className="shadow-2xl shadow-black/60"
            />
          </div>

          <div className="flex flex-col justify-end">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-subtle">
              <Link href="/library" className="hover:text-foreground">Library</Link>
              <span aria-hidden className="mx-2">/</span>
              <span className="text-muted-foreground">{game.title}</span>
            </nav>

            {(game.is_online || game.genres.length > 0) && (
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {game.is_online && <OnlineBadge label="Online / competitive" />}
                {game.genres.length > 0 && (
                  <p className="eyebrow">{game.genres.map((g) => g.name).join(" · ")}</p>
                )}
              </div>
            )}
            <h1 className="text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {game.title}
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              {year}
              {year && game.developer ? " · " : null}
              <DeveloperLinks value={game.developer} />
              <LauncherIcons launchers={game.launchers} className="ml-3 align-middle" />
            </p>
            {game.short_description && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-foreground/80">
                {game.short_description}
              </p>
            )}

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-4">
              <Fact icon={Star} label="My rating">
                <Rating value={game.rating} size="lg" />
              </Fact>
              <Fact icon={Flag} label="Status">
                <StatusBadge status={game.play_status} className="text-sm text-foreground" />
              </Fact>
              <Fact icon={Trophy} label="Completion">
                <CompletionBadge status={game.completion_status} />
              </Fact>
              <Fact icon={Clock} label="Playtime">
                <span className="text-sm">{formatPlaytime(game.playtime_hours) ?? "-"}</span>
              </Fact>
            </dl>

            {game.tags.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Tags">
                {game.tags.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </div>

      <Container className="space-y-20 pt-16">
        {/* Personal commentary ------------------------------------------- */}
        {hasPersonal && <PersonalSection game={game} />}

        {/* Official information ------------------------------------------ */}
        <Section eyebrow="The game" title="About">
          <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
            <div className="prose-review max-w-2xl whitespace-pre-line text-muted-foreground">
              {game.description ?? "No description has been added for this game yet."}
            </div>
            <dl className="space-y-5 text-sm">
              <Detail icon={Calendar} label="Release date" value={formatDate(game.release_date)} />
              <Detail
                icon={Building2}
                label="Developer"
                value={game.developer ? <DeveloperLinks value={game.developer} /> : null}
              />
              <Detail icon={Store} label="Publisher" value={game.publisher} />
              <Detail icon={Layers} label="Genres" value={game.genres.map((g) => g.name).join(", ") || null} />
              <Detail icon={Monitor} label="Platforms" value={game.platforms.map((p) => p.name).join(", ") || null} />
              {game.launchers.length > 0 && (
                <Detail
                  icon={Rocket}
                  label="Played via"
                  value={
                    <ul className="space-y-1.5">
                      {game.launchers.map((id) => (
                        <li key={id} className="flex items-center gap-2">
                          <LauncherIcon id={id} className="size-4 text-muted-foreground" />
                          {LAUNCHER_NAME[id]}
                        </li>
                      ))}
                    </ul>
                  }
                />
              )}
            </dl>
          </div>
        </Section>

        <Suspense fallback={null}>
          <Related game={game} />
        </Suspense>
      </Container>
    </article>
  );
}

// ---------------------------------------------------------------------------
function PersonalSection({ game }: { game: GameDetail }) {
  const completed = formatDate(game.completed_on);

  return (
    <section aria-labelledby="my-take" className="rounded-md border border-border bg-card/50">
      <div className="grid gap-12 p-6 sm:p-10 lg:grid-cols-[1fr_17rem] lg:p-14">
        <div>
          <p className="eyebrow text-violet">My take</p>
          <h2 id="my-take" className="sr-only">Personal review of {game.title}</h2>

          {game.review_en && game.review_it ? (
            <div className="mt-6">
              <ReviewTabs en={game.review_en} it={game.review_it} title={game.title} />
            </div>
          ) : (
            <p className="mt-6 text-muted-foreground">No written review yet.</p>
          )}

          {(game.pros.length > 0 || game.cons.length > 0) && (
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              <ProsCons title="What worked" items={game.pros} tone="pro" />
              <ProsCons title="What didn't" items={game.cons} tone="con" />
            </div>
          )}
        </div>

        <aside aria-label="Play history" className="space-y-5 text-sm lg:border-l lg:border-border lg:pl-8">
          <Detail icon={CalendarCheck} label="Completed" value={completed} />
          <Detail icon={Clock} label="Playtime" value={formatPlaytime(game.playtime_hours)} />
        </aside>
      </div>
    </section>
  );
}

function ProsCons({ title, items, tone }: { title: string; items: string[]; tone: "pro" | "con" }) {
  if (items.length === 0) return <div />;
  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
            {/* "+" answers "-": the glyph carries the meaning visually, the heading does for screen readers */}
            <span
              aria-hidden
              className={`w-3 shrink-0 text-center font-semibold select-none ${tone === "pro" ? "text-positive" : "text-destructive"}`}
            >
              {tone === "pro" ? "+" : "-"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({ icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <dt className="eyebrow">
        <IconLabel icon={icon}>{label}</IconLabel>
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="eyebrow">
        <IconLabel icon={icon}>{label}</IconLabel>
      </dt>
      <dd className="text-foreground/90">{value ?? <span className="text-subtle">-</span>}</dd>
    </div>
  );
}

async function Related({ game }: { game: GameDetail }) {
  const related = await getRelatedGames(game);
  if (related.length === 0) return null;
  return (
    <Section eyebrow="Keep exploring" title="More in the same genres">
      <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
        {related.map((g) => (
          <li key={g.id}>
            <GameCard game={g} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function GameSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading game" className="border-b border-border bg-surface">
      <Container className="grid gap-10 py-16 md:grid-cols-[18rem_1fr]">
        <Skeleton className="mx-auto aspect-[3/4] w-full max-w-[18rem]" />
        <div className="space-y-4 self-end">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </Container>
    </div>
  );
}
