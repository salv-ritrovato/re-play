import type { Metadata } from "next";
import { Suspense } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameRow } from "@/components/games/game-row";
import { LibraryToolbar } from "@/components/games/library-toolbar";
import { EmptyState } from "@/components/layout/empty-state";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/layout/pagination";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE, getFilterOptions, searchGames } from "@/lib/data/public";
import { countActiveFilters, parseLibraryParams } from "@/lib/library-params";

export const metadata: Metadata = {
  title: "Library",
  description: "Every game I've played, with filters, search and personal ratings.",
};

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <Container className="space-y-10 pt-12 sm:pt-16">
      <PageHeader
        eyebrow="Library"
        title="Every game, in one place."
        description="Browse the full collection by genre, platform, year, rating or status."
      />
      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function LibraryContent({ searchParams }: { searchParams: PageProps<"/library">["searchParams"] }) {
  const raw = await searchParams;
  const filters = parseLibraryParams(raw, "library");
  const [options, { items, total }] = await Promise.all([
    getFilterOptions(),
    searchGames(filters),
  ]);
  const hasRefinement = Boolean(filters.q) || countActiveFilters(filters) > 0;

  return (
    <>
      <LibraryToolbar options={options} mode="library" total={total} />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "game" : "games"}
        {hasRefinement && (total === 1 ? " matches your search" : " match your search")}
      </p>

      {items.length === 0 ? (
        hasRefinement ? (
          <EmptyState
            title="No games match these filters"
            description="Try removing a filter or searching for something else."
            action={
              <ButtonLink variant="outline" href="/library">
                Reset everything
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            title="The library is empty"
            description="Games added from the admin area will show up here."
            action={
              <ButtonLink variant="outline" href="/admin/games/new">
                Add the first game
              </ButtonLink>
            }
          />
        )
      ) : filters.view === "list" ? (
        <ul className="border-t border-border">
          {items.map((game) => (
            <GameRow key={game.id} game={game} />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {items.map((game, i) => (
            <li key={game.id}>
              <GameCard game={game} priority={i < 6} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath="/library"
        params={raw}
        page={filters.page}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </>
  );
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
