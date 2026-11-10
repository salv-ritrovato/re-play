"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTaxonomy } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Taxonomy } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Multi-select of existing genres/platforms, with inline creation of new ones. */
export function TaxonomyPicker({
  kind,
  label,
  options,
  value,
  onChange,
  onCreated,
}: {
  kind: "genres" | "platforms";
  label: string;
  options: Taxonomy[];
  value: string[];
  onChange: (ids: string[]) => void;
  onCreated: (item: Taxonomy) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function add() {
    const name = draft.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createTaxonomy(kind, name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onCreated(res.item);
      onChange([...value, res.item.id]);
      setDraft("");
      toast.success(`Added “${res.item.name}”`);
    });
  }

  return (
    <fieldset className="space-y-3 sm:col-span-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                on
                  ? "border-foreground/70 bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
              )}
            >
              {on && <Check className="size-3" />}
              {o.name}
            </button>
          );
        })}
      </div>
      <div className="flex max-w-sm gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`New ${kind === "genres" ? "genre" : "platform"}`}
          aria-label={`New ${kind === "genres" ? "genre" : "platform"} name`}
          maxLength={60}
        />
        <Button type="button" variant="outline" onClick={add} disabled={pending || !draft.trim()} className="gap-1.5">
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </div>
    </fieldset>
  );
}
