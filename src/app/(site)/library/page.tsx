import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/games/library-browser";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getFilterOptions, getLibraryGames } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Library",
  description: "Every game I've played, with filters, search and personal ratings.",
};

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <Container className="space-y-10 pt-12 sm:pt-16">
      <PageHeader
        eyebrow="Library"
        title="My collection of games"
        description="Browse the full collection by genre, platform, year, rating or status."
      />
      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function LibraryContent({ searchParams }: { searchParams: PageProps<"/library">["searchParams"] }) {
  // The data does not depend on the URL (the browser filters it), but reading it keeps the page dynamic, so a
  // shared link arrives already filtered.
  await searchParams;
  const [options, games] = await Promise.all([getFilterOptions(), getLibraryGames()]);
  return <LibraryBrowser games={games} options={options} />;
}

function LibrarySkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading library">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
