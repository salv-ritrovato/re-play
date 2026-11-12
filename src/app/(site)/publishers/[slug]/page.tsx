import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameCard } from "@/components/games/game-card";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublisherGames } from "@/lib/data/public";
import { formatRating } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/publishers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const publisher = await getPublisherGames(slug);
  if (!publisher) return { title: "Publisher not found" };
  return {
    title: publisher.name,
    description: `Every game published by ${publisher.name} in the archive, with my ratings.`,
  };
}

export default function PublisherPage({ params }: PageProps<"/publishers/[slug]">) {
  return (
    <Container className="space-y-10 pt-12 sm:pt-16">
      <Suspense fallback={<PublisherSkeleton />}>
        <PublisherContent params={params} />
      </Suspense>
    </Container>
  );
}

async function PublisherContent({ params }: { params: PageProps<"/publishers/[slug]">["params"] }) {
  const { slug } = await params;
  const publisher = await getPublisherGames(slug);
  if (!publisher) notFound();

  const { name, games } = publisher;
  const rated = games.filter((g) => g.rating !== null);
  const average = rated.length > 0 ? rated.reduce((sum, g) => sum + Number(g.rating), 0) / rated.length : null;
  const summary = [
    `${games.length} ${games.length === 1 ? "game" : "games"} in the archive`,
    average !== null ? `average rating ${formatRating(average)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader eyebrow="Publisher" title={name} description={summary} />
      <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {games.map((game, i) => (
          <li key={game.id}>
            <GameCard game={game} priority={i < 6} />
          </li>
        ))}
      </ul>
    </>
  );
}

function PublisherSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading publisher">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
