"use client";

import { LauncherIcon } from "@/components/ui/launcher-icon";
import { LAUNCHERS, type LauncherId } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Pick the launchers a game is owned on (none for console games, which are covered by platforms). */
export function LauncherPicker({
  value,
  onChange,
}: {
  value: LauncherId[];
  onChange: (ids: LauncherId[]) => void;
}) {
  function toggle(id: LauncherId) {
    // Keep the order of the list, whatever order they were clicked in.
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(LAUNCHERS.map((l) => l.id).filter((l) => next.includes(l)));
  }

  return (
    <fieldset className="space-y-2.5 sm:col-span-2">
      <legend className="text-sm font-medium">Launchers</legend>
      <p className="text-xs text-subtle">
        Where you own the game. Leave empty for console games: their platform is enough.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {LAUNCHERS.map((l) => {
          const on = value.includes(l.id);
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(l.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                on
                  ? "border-foreground/70 bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
              )}
            >
              <LauncherIcon id={l.id} className="size-3.5" />
              {l.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
