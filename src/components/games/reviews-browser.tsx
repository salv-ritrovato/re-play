"use client";

import { PenLine } from "lucide-react";
import { useMemo, useState } from "react";
import { LibraryToolbar, type FilterOptions } from "@/components/games/library-toolbar";
import { ReviewCard } from "@/components/games/review-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Pagination } from "@/components/layout/pagination";
import { ButtonLink } from "@/components/ui/button-link";
import { useQueryParams } from "@/hooks/use-query-params";
import { filterLibrary } from "@/lib/library-filter";
import { parseLibraryParams } from "@/lib/library-params";
import type { Lang, ReviewEntry } from "@/lib/types";

const REVIEWS_PAGE_SIZE = 12;

/**
 * Like the library, the reviews are filtered, sorted and paged in the browser: nothing is fetched while you
 * search, change the language or turn the page (the URL is updated in place, so links still work).
 */
export function ReviewsBrowser({ reviews, options }: { reviews: ReviewEntry[]; options: FilterOptions }) {
  const { searchParams, update } = useQueryParams({ shallow: true });

  const urlQuery = searchParams.get("q") ?? "";
  // (what was typed counts only while the URL still holds the value it was typed over)
  const [draft, setDraft] = useState<{ value: string; base: string } | null>(null);
  const typed = draft && draft.base === urlQuery ? draft.value : null;

  const filters = useMemo(() => {
    const parsed = parseLibraryParams(Object.fromEntries(searchParams.entries()), "reviews");
    return typed === null ? parsed : { ...parsed, q: typed.trim().slice(0, 100) || undefined };
  }, [searchParams, typed]);
  const lang: Lang = searchParams.get("lang") === "it" ? "it" : "en";

  const matching = useMemo(() => filterLibrary(reviews, filters), [reviews, filters]);
  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const items = matching.slice((page - 1) * REVIEWS_PAGE_SIZE, page * REVIEWS_PAGE_SIZE);

  return (
    <>
      <LibraryToolbar
        options={options}
        mode="reviews"
        total={total}
        onQueryChange={(value) => setDraft({ value, base: urlQuery })}
      />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "review" : "reviews"}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={PenLine}
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
        params={Object.fromEntries(searchParams.entries())}
        page={page}
        total={total}
        pageSize={REVIEWS_PAGE_SIZE}
        onPageChange={(p) => {
          update({ page: p > 1 ? String(p) : null }, { resetPage: false });
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}
