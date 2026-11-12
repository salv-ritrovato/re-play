"use client";

import { Library, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameRow } from "@/components/games/game-row";
import { LibraryToolbar, type FilterOptions } from "@/components/games/library-toolbar";
import { EmptyState } from "@/components/layout/empty-state";
import { Pagination } from "@/components/layout/pagination";
import { ButtonLink } from "@/components/ui/button-link";
import { useQueryParams } from "@/hooks/use-query-params";
import { REVEAL, revealDelay } from "@/lib/motion";
import { countActiveFilters, parseLibraryParams } from "@/lib/library-params";
import { filterLibrary } from "@/lib/library-filter";
import type { LibraryRecord } from "@/lib/types";

export const LIBRARY_PAGE_SIZE = 24;

/**
 * The whole library lives in the browser, so searching, filtering, sorting and paging happen instantly:
 * the URL is updated in place (`history.replaceState`) and nothing is fetched. A shared link still works,
 * because the first render reads the same URL.
 */
export function LibraryBrowser({ games, options }: { games: LibraryRecord[]; options: FilterOptions }) {
  const { searchParams, update } = useQueryParams({ shallow: true });

  // The search box reports every keystroke at once; the URL catches up a moment later.
  const urlQuery = searchParams.get("q") ?? "";
  // (what was typed counts only while the URL still holds the value it was typed over)
  const [draft, setDraft] = useState<{ value: string; base: string } | null>(null);
  const typed = draft && draft.base === urlQuery ? draft.value : null;

  const filters = useMemo(() => {
    const parsed = parseLibraryParams(Object.fromEntries(searchParams.entries()), "library");
    return typed === null ? parsed : { ...parsed, q: typed.trim().slice(0, 100) || undefined };
  }, [searchParams, typed]);

  const matching = useMemo(() => filterLibrary(games, filters), [games, filters]);
  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const items = matching.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE);
  const hasRefinement = Boolean(filters.q) || countActiveFilters(filters) > 0;

  return (
    <>
      <LibraryToolbar options={options} mode="library" total={total} onQueryChange={(value) => setDraft({ value, base: urlQuery })} />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "game" : "games"}
        {hasRefinement && (total === 1 ? " matches your search" : " match your search")}
      </p>

      {items.length === 0 ? (
        hasRefinement ? (
          <EmptyState
            icon={SearchX}
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
            icon={Library}
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
            <li key={game.id} className={REVEAL} style={revealDelay(i)}>
              <GameCard game={game} priority={i < 6} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath="/library"
        params={Object.fromEntries(searchParams.entries())}
        page={page}
        total={total}
        pageSize={LIBRARY_PAGE_SIZE}
        onPageChange={(p) => {
          update({ page: p > 1 ? String(p) : null }, { resetPage: false });
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}
