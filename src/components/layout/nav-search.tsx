"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatRating, ratingTier } from "@/lib/format";
import { RATING_TEXT } from "@/components/games/badges";
import { searchEntries, type SearchEntry } from "@/lib/search-index";
import { cn } from "@/lib/utils";

// The list of titles is fetched once, the first time the search is opened, and kept for the whole visit.
let loading: Promise<SearchEntry[]> | null = null;
function loadIndex(): Promise<SearchEntry[]> {
  loading ??= fetch("/search-index")
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json() as Promise<SearchEntry[]>;
    })
    .catch((error) => {
      loading = null; // try again next time
      throw error;
    });
  return loading;
}

const MAX_RESULTS = 6;

/** Search icon in the navbar: type a title (or a developer), pick a game. Opens with "/" or Ctrl/Cmd+K. */
export function NavSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // "/" or Ctrl/Cmd+K open it from anywhere (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || index) return;
    let cancelled = false;
    loadIndex().then(
      (entries) => {
        if (!cancelled) setIndex(entries);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, index]);

  const { items, total } = useMemo(() => searchEntries(index ?? [], query, MAX_RESULTS), [index, query]);
  const trimmed = query.trim();
  const libraryHref = trimmed ? `/library?q=${encodeURIComponent(trimmed)}` : "/library";

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (items.length === 0) return;
      e.preventDefault();
      const next = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      setActive(next);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && trimmed) {
      e.preventDefault();
      router.push(items[active] ? `/games/${items[active].slug}` : libraryHref);
      close();
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Search games" />}>
        <Search />
      </SheetTrigger>
      <SheetContent side="top" className="gap-0 bg-surface" showCloseButton={false}>
        <SheetTitle className="sr-only">Search games</SheetTitle>
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-5 sm:pt-6">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              role="combobox"
              aria-expanded={items.length > 0}
              aria-controls="nav-search-results"
              aria-activedescendant={items[active] ? `nav-search-${items[active].slug}` : undefined}
              aria-label="Search by title or developer"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search by title or developer"
              className="h-11 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-base outline-none placeholder:text-subtle focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="mt-3 text-sm" aria-live="polite">
            {failed ? (
              <p className="px-1 py-3 text-muted-foreground">Search is not available right now. Try the library.</p>
            ) : !trimmed ? (
              <p className="px-1 py-3 text-subtle">Type a title or a developer. Enter opens the best match.</p>
            ) : !index ? (
              <p className="px-1 py-3 text-subtle">Looking…</p>
            ) : items.length === 0 ? (
              <p className="px-1 py-3 text-muted-foreground">No game matches “{trimmed}”.</p>
            ) : (
              <>
                <ul id="nav-search-results" role="listbox" aria-label="Results" ref={listRef} className="space-y-1">
                  {items.map((game, i) => (
                    <li
                      key={game.slug}
                      id={`nav-search-${game.slug}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                    >
                      <Link
                        href={`/games/${game.slug}`}
                        onClick={close}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          i === active ? "bg-elevated" : "hover:bg-elevated",
                        )}
                      >
                        <GameCover
                          title={game.title}
                          path={game.cover_path}
                          blur={game.cover_blur}
                          sizes="40px"
                          zoom={false}
                          className="w-10 shrink-0 rounded-sm"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">{game.title}</span>
                          <span className="block truncate text-xs text-subtle">
                            {[game.year, game.developer].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        {game.rating !== null && (
                          <span className={cn("shrink-0 text-sm tabular-nums text-muted-foreground", RATING_TEXT[ratingTier(game.rating)])}>
                            {formatRating(game.rating)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={libraryHref}
                  onClick={close}
                  className="mt-2 block rounded-md px-2 py-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {total > items.length ? `Show all ${total} results in the library` : "Open these in the library"}
                </Link>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
