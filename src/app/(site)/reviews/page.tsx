import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryToolbar } from "@/components/games/library-toolbar";
import { ReviewCard } from "@/components/games/review-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/layout/pagination";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { REVIEWS_PAGE_SIZE, getFilterOptions, searchGames } from "@/lib/data/public";
import { parseLibraryParams } from "@/lib/library-params";
import type { Lang } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Personal reviews and scores for the games I've played.",
};

export default function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  return (
    <Container className="space-y-10 pt-12 sm:pt-16">
      <PageHeader
        eyebrow="Reviews"
        title="What I thought"
        description="Honest, personal write-ups of the games I've finished, dropped or can't stop thinking about."
      />
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function ReviewsContent({ searchParams }: { searchParams: PageProps<"/reviews">["searchParams"] }) {
  const raw = await searchParams;
  const filters = parseLibraryParams(raw, "reviews");
  const lang: Lang = (Array.isArray(raw.lang) ? raw.lang[0] : raw.lang) === "it" ? "it" : "en";
  const [options, { items, total }] = await Promise.all([
    getFilterOptions(),
    searchGames(filters, REVIEWS_PAGE_SIZE),
  ]);

  return (
    <>
      <LibraryToolbar options={options} mode="reviews" total={total} />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "review" : "reviews"}
      </p>

      {items.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description={
            filters.q
              ? "No review matches your search."
              : "Reviews appear here as soon as a game has a written review."
          }
          action={
            filters.q ? (
              <ButtonLink variant="outline" href="/reviews">
                Clear search
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="border-t border-border">
          {items.map((game) => (
            <ReviewCard key={game.id} game={game} lang={lang} />
          ))}
        </div>
      )}

      <Pagination
        basePath="/reviews"
        params={raw}
        page={filters.page}
        total={total}
        pageSize={REVIEWS_PAGE_SIZE}
      />
    </>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading reviews">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[9rem_1fr] gap-8 border-b border-border py-7">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
