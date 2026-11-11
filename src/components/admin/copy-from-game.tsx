"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { searchGameTemplates } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import type { GameTemplate } from "@/lib/types";

/**
 * "Start from an existing game": search the archive and copy the details a series or a studio
 * tends to share (developer, publisher, genres, platforms, launchers, online flag). Nothing personal
 * (title, rating, review, cover, dates) is ever copied.
 */
/** One line of what was copied, e.g. { label: "Developer", value: "Treyarch" }. */
export interface CopiedItem {
  label: string;
  value: string;
}

export function CopyFromGame({ onCopy }: { onCopy: (game: GameTemplate) => CopiedItem[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameTemplate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<{ from: string; items: CopiedItem[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  function search(q: string, delay: number) {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const request = ++latest.current;
      setLoading(true);
      try {
        const res = await searchGameTemplates(q);
        if (request !== latest.current) return; // a newer search is already running
        if (res.ok) setResults(res.games);
        else toast.error(res.error);
      } finally {
        if (request === latest.current) setLoading(false);
      }
    }, delay);
  }

  function pick(game: GameTemplate) {
    setCopied({ from: game.title, items: onCopy(game) });
    setQuery("");
    setResults(null);
    latest.current++; // drop any search still in flight
    setLoading(false);
  }

  return (
    <section aria-labelledby="copy-from-title" className="space-y-3 rounded-lg border border-dashed border-border p-5">
      <div className="space-y-1">
        <h2 id="copy-from-title" className="flex items-center gap-2 text-sm font-medium">
          <Copy className="size-4 text-muted-foreground" aria-hidden /> Start from an existing game
        </h2>
        <p className="text-xs text-subtle">
          Copies developer, publisher, genres, platforms, launchers and the online flag. Handy for series,
          sequels and games from the same studio. Title, rating, review and cover are never copied.
        </p>
      </div>

      <div className="relative">
        <Input
          id="template-search"
          type="search"
          role="searchbox"
          aria-label="Search a game to copy from"
          placeholder="Search by title or developer"
          autoComplete="off"
          value={query}
          onFocus={() => {
            if (results === null) search(query, 0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value, 250);
          }}
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
        )}
      </div>

      {results !== null &&
        (results.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border" aria-label="Matching games">
            {results.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => pick(game)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left outline-none hover:bg-elevated focus-visible:bg-elevated"
                >
                  <span className="text-sm font-medium">{game.title}</span>
                  <span className="text-xs text-subtle">
                    {[game.developer, game.release_year].filter(Boolean).join(" · ") || "No details yet"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-subtle">No game matches that search.</p>
        ))}

      {copied && (
        <div role="status" className="space-y-2 rounded-md border border-border bg-card/50 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <Check className="size-3.5 text-positive" aria-hidden /> Copied from {copied.from}
          </p>
          {copied.items.length > 0 ? (
            <dl className="space-y-1 text-muted-foreground">
              {copied.items.map((item) => (
                <div key={item.label} className="flex gap-2">
                  <dt className="w-20 shrink-0 text-subtle">{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">That game has no details to copy yet.</p>
          )}
          <p className="text-subtle">
            The fields below are filled in; adjust anything.{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() =>
                document.getElementById("developer")?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              Show me
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
