"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryParams } from "@/hooks/use-query-params";
import { PLAY_STATUSES, PLAY_STATUS_LABEL } from "@/lib/types";

const ANY = "__any";

export function AdminGamesFilters() {
  const { searchParams, update, isPending } = useQueryParams();
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row" aria-busy={isPending}>
      <div className="relative flex-1">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, developer or publisher"
          id="admin-search"
          aria-label="Search games"
          className="h-10 pl-9"
        />
      </div>
      <OptionSelect
        value={searchParams.get("status") ?? ANY}
        onValueChange={(v) => update({ status: v === ANY ? null : v })}
        aria-label="Filter by status"
        className="h-10 sm:w-44"
        options={[
          { value: ANY, label: "All statuses" },
          ...PLAY_STATUSES.map((s) => ({ value: s, label: PLAY_STATUS_LABEL[s] })),
        ]}
      />
      <OptionSelect
        value={searchParams.get("missing") ?? ANY}
        onValueChange={(v) => update({ missing: v === ANY ? null : v })}
        aria-label="Filter by missing content"
        className="h-10 sm:w-48"
        options={[
          { value: ANY, label: "Everything" },
          { value: "cover", label: "Missing cover" },
          { value: "review", label: "Without review" },
        ]}
      />
    </div>
  );
}
