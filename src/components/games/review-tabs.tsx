"use client";

import { useState } from "react";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Switches between the English and Italian versions of a review (both are always present). */
export function ReviewTabs({ en, it, title }: { en: string; it: string; title: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const text = lang === "it" ? it : en;

  return (
    <div>
      <div role="tablist" aria-label={`Review language for ${title}`} className="inline-flex rounded-lg border border-border p-0.5 text-sm">
        {LANGS.map((l) => (
          <button
            key={l}
            role="tab"
            type="button"
            id={`review-tab-${l}`}
            aria-selected={lang === l}
            aria-controls="review-panel"
            onClick={() => setLang(l)}
            className={cn(
              "rounded-md px-3 py-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              lang === l ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      <div
        id="review-panel"
        role="tabpanel"
        aria-labelledby={`review-tab-${lang}`}
        lang={lang}
        className="prose-review mt-6 max-w-2xl text-pretty whitespace-pre-line"
      >
        {text}
      </div>
    </div>
  );
}
