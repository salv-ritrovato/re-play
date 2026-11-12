import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenreList } from "@/lib/data/public";
import { Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Genres",
  description: "Every genre in the archive, with the number of games in each.",
};

export default function GenresPage() {
  return (
    <Container className="space-y-10 pt-12 sm:pt-16">
      <PageHeader
        eyebrow="Genres"
        title="All the genres"
        description="Pick a genre to see every game of that kind, in the library."
      />
      <Suspense fallback={<GenresSkeleton />}>
        <GenresContent />
      </Suspense>
    </Container>
  );
}

async function GenresContent() {
  const genres = await getGenreList();
  if (genres.length === 0) {
    return <EmptyState icon={Layers} title="No genres yet" description="Genres show up here once games are tagged with them." />;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {genres.map((g) => (
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
  );
}

function GenresSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-busy="true" aria-label="Loading genres">
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
