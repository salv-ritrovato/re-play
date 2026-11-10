"use client";

import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect, type Option } from "@/components/ui/option-select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryParams } from "@/hooks/use-query-params";
import {
  COMPLETION_LABEL,
  COMPLETION_STATUSES,
  PLAY_STATUSES,
  PLAY_STATUS_LABEL,
  REVIEW_SORT_OPTIONS,
  SORT_OPTIONS,
  type Taxonomy,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  genres: Taxonomy[];
  platforms: Taxonomy[];
  years: { year: number; games: number }[];
  developers: { name: string; games: number }[];
  publishers: { name: string; games: number }[];
}

const FILTER_KEYS = [
  "genre", "platform", "year", "status", "completion", "min", "max", "developer", "publisher",
];

const ANY = "__any";
const ratingOptions: Option[] = [
  { value: ANY, label: "Any" },
  ...Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) })),
];

export function LibraryToolbar({
  options,
  mode,
  total,
}: {
  options: FilterOptions;
  mode: "library" | "reviews";
  total: number;
}) {
  const { searchParams, update, toggle, getList, clear, isPending } = useQueryParams();

  // Search: local state for instant typing, debounced into the URL.
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const debounced = useDebouncedValue(query, 300);
  const lastPushed = useRef(urlQuery);
  useEffect(() => {
    if (debounced !== lastPushed.current) {
      lastPushed.current = debounced;
      update({ q: debounced.trim() || null });
    }
  }, [debounced, update]);
  useEffect(() => {
    // Keep the input in sync when the URL changes externally (clear all, back button).
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  const sortOptions = (mode === "reviews" ? REVIEW_SORT_OPTIONS : SORT_OPTIONS) as readonly Option[];
  const defaultSort = mode === "reviews" ? "reviewed" : "added";
  const sort = searchParams.get("sort") ?? defaultSort;
  const view = searchParams.get("view") === "list" ? "list" : "grid";

  const activeCount = FILTER_KEYS.reduce((n, k) => {
    const v = searchParams.get(k);
    if (!v) return n;
    return n + (["genre", "platform", "year", "status", "completion"].includes(k) ? v.split(",").length : 1);
  }, 0);

  return (
    <div className="space-y-4" aria-busy={isPending}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "reviews" ? "Search reviews" : "Search title, developer or publisher"}
            id="library-search"
            aria-label="Search"
            className="h-10 pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <OptionSelect
            value={sort}
            onValueChange={(v) => update({ sort: v === defaultSort ? null : v })}
            options={sortOptions}
            aria-label="Sort by"
            className="h-10 w-48"
          />

          {mode === "reviews" && (
            <div role="group" aria-label="Review language" className="flex rounded-lg border border-border p-0.5">
              {(["en", "it"] as const).map((l) => (
                <Button
                  key={l}
                  variant="ghost"
                  aria-pressed={(searchParams.get("lang") === "it" ? "it" : "en") === l}
                  aria-label={l === "en" ? "Read reviews in English" : "Leggi le recensioni in italiano"}
                  onClick={() => update({ lang: l === "en" ? null : l }, { resetPage: false })}
                  className={cn(
                    "h-9 px-3 text-xs uppercase",
                    (searchParams.get("lang") === "it" ? "it" : "en") === l && "bg-elevated text-foreground",
                  )}
                >
                  {l}
                </Button>
              ))}
            </div>
          )}

          <FilterSheet
            options={options}
            activeCount={activeCount}
            total={total}
            getList={getList}
            toggle={toggle}
            update={update}
            clear={() => clear(FILTER_KEYS)}
            searchParams={searchParams}
          />

          {mode === "library" && (
            <div role="group" aria-label="Display mode" className="flex rounded-lg border border-border p-0.5">
              {(
                [
                  ["grid", LayoutGrid, "Grid view"],
                  ["list", List, "List view"],
                ] as const
              ).map(([key, Icon, label]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="icon"
                  aria-label={label}
                  aria-pressed={view === key}
                  onClick={() => update({ view: key === "grid" ? null : key }, { resetPage: false })}
                  className={cn("size-9", view === key && "bg-elevated text-foreground")}
                >
                  <Icon />
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ActiveFilters options={options} searchParams={searchParams} toggle={toggle} update={update} />
    </div>
  );
}

// ---------------------------------------------------------------------------
function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        pressed
          ? "border-foreground/70 bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="eyebrow">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function FilterSheet({
  options,
  activeCount,
  total,
  getList,
  toggle,
  update,
  clear,
  searchParams,
}: {
  options: FilterOptions;
  activeCount: number;
  total: number;
  getList: (key: string) => string[];
  toggle: (key: string, value: string) => void;
  update: ReturnType<typeof useQueryParams>["update"];
  clear: () => void;
  searchParams: URLSearchParams | ReadonlyURLSearchParams;
}) {
  const nameOptions = (items: { name: string }[]): Option[] => [
    { value: ANY, label: "Any" },
    ...items.map((i) => ({ value: i.name, label: i.name })),
  ];

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" className="h-10 gap-2" />}>
        <SlidersHorizontal />
        Filters
        {activeCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-foreground text-[0.6875rem] font-semibold text-background">
            {activeCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-surface sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Combine as many as you like. Within a group any match counts; across groups all must match.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 p-4">
          <FilterGroup label="Playing status">
            {PLAY_STATUSES.map((s) => (
              <Chip key={s} pressed={getList("status").includes(s)} onClick={() => toggle("status", s)}>
                {PLAY_STATUS_LABEL[s]}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="Completion">
            {COMPLETION_STATUSES.map((s) => (
              <Chip key={s} pressed={getList("completion").includes(s)} onClick={() => toggle("completion", s)}>
                {COMPLETION_LABEL[s]}
              </Chip>
            ))}
          </FilterGroup>

          {options.genres.length > 0 && (
            <FilterGroup label="Genre">
              {options.genres.map((g) => (
                <Chip key={g.id} pressed={getList("genre").includes(g.id)} onClick={() => toggle("genre", g.id)}>
                  {g.name}
                </Chip>
              ))}
            </FilterGroup>
          )}

          {options.platforms.length > 0 && (
            <FilterGroup label="Platform">
              {options.platforms.map((p) => (
                <Chip key={p.id} pressed={getList("platform").includes(p.id)} onClick={() => toggle("platform", p.id)}>
                  {p.name}
                </Chip>
              ))}
            </FilterGroup>
          )}

          {options.years.length > 0 && (
            <FilterGroup label="Release year">
              {options.years.map((y) => (
                <Chip
                  key={y.year}
                  pressed={getList("year").includes(String(y.year))}
                  onClick={() => toggle("year", String(y.year))}
                >
                  {y.year}
                </Chip>
              ))}
            </FilterGroup>
          )}

          <fieldset className="space-y-2.5">
            <legend className="eyebrow">Personal rating</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs text-muted-foreground">
                From
                <OptionSelect
                  value={searchParams.get("min") ?? ANY}
                  onValueChange={(v) => update({ min: v === ANY ? null : v })}
                  options={ratingOptions}
                  aria-label="Minimum rating"
                />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">
                To
                <OptionSelect
                  value={searchParams.get("max") ?? ANY}
                  onValueChange={(v) => update({ max: v === ANY ? null : v })}
                  options={ratingOptions}
                  aria-label="Maximum rating"
                />
              </label>
            </div>
          </fieldset>

          {options.developers.length > 0 && (
            <label className="block space-y-2.5">
              <span className="eyebrow">Developer</span>
              <OptionSelect
                value={searchParams.get("developer") ?? ANY}
                onValueChange={(v) => update({ developer: v === ANY ? null : v })}
                options={nameOptions(options.developers)}
                aria-label="Developer"
              />
            </label>
          )}

          {options.publishers.length > 0 && (
            <label className="block space-y-2.5">
              <span className="eyebrow">Publisher</span>
              <OptionSelect
                value={searchParams.get("publisher") ?? ANY}
                onValueChange={(v) => update({ publisher: v === ANY ? null : v })}
                options={nameOptions(options.publishers)}
                aria-label="Publisher"
              />
            </label>
          )}
        </div>

        <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={clear} disabled={activeCount === 0}>
            Clear all
          </Button>
          <SheetClose render={<Button />}>Show {total} {total === 1 ? "game" : "games"}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
type ReadonlyURLSearchParams = ReturnType<typeof useQueryParams>["searchParams"];

function ActiveFilters({
  options,
  searchParams,
  toggle,
  update,
}: {
  options: FilterOptions;
  searchParams: ReadonlyURLSearchParams;
  toggle: (key: string, value: string) => void;
  update: ReturnType<typeof useQueryParams>["update"];
}) {
  const list = (k: string) => (searchParams.get(k) ?? "").split(",").filter(Boolean);
  const chips: { key: string; label: string; remove: () => void }[] = [];

  for (const id of list("genre")) {
    const g = options.genres.find((x) => x.id === id);
    if (g) chips.push({ key: `genre-${id}`, label: g.name, remove: () => toggle("genre", id) });
  }
  for (const id of list("platform")) {
    const p = options.platforms.find((x) => x.id === id);
    if (p) chips.push({ key: `platform-${id}`, label: p.name, remove: () => toggle("platform", id) });
  }
  for (const y of list("year")) chips.push({ key: `year-${y}`, label: y, remove: () => toggle("year", y) });
  for (const s of list("status") as (keyof typeof PLAY_STATUS_LABEL)[]) {
    if (PLAY_STATUS_LABEL[s]) chips.push({ key: `status-${s}`, label: PLAY_STATUS_LABEL[s], remove: () => toggle("status", s) });
  }
  for (const c of list("completion") as (keyof typeof COMPLETION_LABEL)[]) {
    if (COMPLETION_LABEL[c]) chips.push({ key: `completion-${c}`, label: COMPLETION_LABEL[c], remove: () => toggle("completion", c) });
  }
  const min = searchParams.get("min");
  const max = searchParams.get("max");
  if (min) chips.push({ key: "min", label: `Rating ≥ ${min}`, remove: () => update({ min: null }) });
  if (max) chips.push({ key: "max", label: `Rating ≤ ${max}`, remove: () => update({ max: null }) });
  const dev = searchParams.get("developer");
  if (dev) chips.push({ key: "developer", label: dev, remove: () => update({ developer: null }) });
  const pub = searchParams.get("publisher");
  if (pub) chips.push({ key: "publisher", label: pub, remove: () => update({ publisher: null }) });

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.remove}
            aria-label={`Remove filter ${c.label}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground transition-colors hover:border-muted-foreground/50"
          >
            {c.label}
            <X className="size-3 text-subtle" />
          </button>
        </li>
      ))}
    </ul>
  );
}
