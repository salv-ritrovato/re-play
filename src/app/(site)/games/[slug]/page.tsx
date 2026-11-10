import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompletionBadge, Rating, StatusBadge } from "@/components/games/badges";
import { GameCard } from "@/components/games/game-card";
import { GameCover } from "@/components/games/game-cover";
import { ReviewTabs } from "@/components/games/review-tabs";
import { ScreenshotGallery } from "@/components/games/screenshot-gallery";
import { Container, Section } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getGameBySlug, getRelatedGames } from "@/lib/data/public";
import { excerpt, formatDate, formatPlaytime, yearOf } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { GameDetail } from "@/lib/types";

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
    Boolean(game.review_en) || game.pros.length > 0 || game.cons.length > 0 || Boolean(game.notes);

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

            {game.genres.length > 0 && (
              <p className="eyebrow mb-3">{game.genres.map((g) => g.name).join(" · ")}</p>
            )}
            <h1 className="text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {game.title}
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              {[year, game.developer].filter(Boolean).join(" · ")}
            </p>
            {game.short_description && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-foreground/80">
                {game.short_description}
              </p>
            )}

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-4">
              <Fact label="My rating">
                <Rating value={game.rating} size="lg" />
              </Fact>
              <Fact label="Status">
                <StatusBadge status={game.play_status} className="text-sm text-foreground" />
              </Fact>
              <Fact label="Completion">
                <CompletionBadge status={game.completion_status} />
              </Fact>
              <Fact label="Playtime">
                <span className="text-sm">{formatPlaytime(game.playtime_hours) ?? "—"}</span>
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
              <Detail label="Release date" value={formatDate(game.release_date)} />
              <Detail label="Developer" value={game.developer} />
              <Detail label="Publisher" value={game.publisher} />
              <Detail label="Genres" value={game.genres.map((g) => g.name).join(", ") || null} />
              <Detail label="Platforms" value={game.platforms.map((p) => p.name).join(", ") || null} />
            </dl>
          </div>
        </Section>

        {/* Media ---------------------------------------------------------- */}
        {game.images.length > 0 && (
          <Section eyebrow="Media" title="Screenshots & artwork">
            <ScreenshotGallery images={game.images} title={game.title} />
          </Section>
        )}

        <Suspense fallback={null}>
          <Related game={game} />
        </Suspense>
      </Container>
    </article>
  );
}

// ---------------------------------------------------------------------------
function PersonalSection({ game }: { game: GameDetail }) {
  const started = formatDate(game.started_on);
  const completed = formatDate(game.completed_on);
  const reviewed = formatDate(game.reviewed_on);

  return (
    <section aria-labelledby="my-take" className="rounded-md border border-border bg-card/50">
      <div className="grid gap-12 p-6 sm:p-10 lg:grid-cols-[1fr_17rem] lg:p-14">
        <div>
          <p className="eyebrow text-violet">My take</p>
          <h2 id="my-take" className="sr-only">Personal review of {game.title}</h2>

          {game.review_en && game.review_it ? (
            <div className="mt-6">
              <ReviewTabs en={game.review_en} it={game.review_it} title={game.title} />
              {reviewed && <p className="mt-8 text-sm text-subtle">Reviewed on {reviewed}</p>}
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

          {game.notes && (
            <div className="mt-12 border-t border-border pt-8">
              <h3 className="eyebrow mb-3">Notes</h3>
              <p className="max-w-2xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {game.notes}
              </p>
            </div>
          )}
        </div>

        <aside aria-label="Play history" className="space-y-5 text-sm lg:border-l lg:border-border lg:pl-8">
          <Detail label="Started" value={started} />
          <Detail label="Completed" value={completed} />
          <Detail label="Playtime" value={formatPlaytime(game.playtime_hours)} />
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
            <span
              aria-hidden
              className={`mt-2 h-px w-3 shrink-0 ${tone === "pro" ? "bg-foreground" : "bg-destructive"}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <dt className="eyebrow">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-foreground/90">{value ?? <span className="text-subtle">—</span>}</dd>
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
