"use client";

import { useState } from "react";
import type { AboutContent } from "@/content/about";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

/** About page body with an English / Italian switch (both versions ship with the page). */
export function AboutView({ content }: { content: Record<Lang, AboutContent> }) {
  const [lang, setLang] = useState<Lang>("en");
  const c = content[lang];

  return (
    <div lang={lang}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{c.title}</h1>
        </div>

        <div
          role="tablist"
          aria-label="Language"
          className="inline-flex self-start rounded-lg border border-border p-0.5 text-sm sm:self-auto"
        >
          {LANGS.map((l) => (
            <button
              key={l}
              role="tab"
              type="button"
              id={`about-tab-${l}`}
              aria-selected={lang === l}
              aria-controls="about-panel"
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
      </div>

      <div
        id="about-panel"
        role="tabpanel"
        aria-labelledby={`about-tab-${lang}`}
        className="mt-14 grid gap-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20"
      >
        <article className="max-w-2xl">
          <p className="text-2xl leading-snug font-medium tracking-tight text-pretty text-foreground sm:text-3xl">
            {c.intro}
          </p>

          <div className="mt-14 space-y-12">
            {c.sections.map((section) => (
              <section key={section.heading} aria-labelledby={`about-${slug(section.heading)}`}>
                <h2 id={`about-${slug(section.heading)}`} className="eyebrow mb-4">
                  {section.heading}
                </h2>
                <div className="prose-review space-y-0 text-pretty">
                  {section.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <blockquote className="mt-16 border-l-2 border-violet/60 pl-6 sm:pl-8">
            <p className="text-xl leading-relaxed text-pretty text-foreground/90 sm:text-[1.375rem]">
              {c.closing}
            </p>
          </blockquote>
        </article>

        <aside aria-label={c.factsTitle} className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="eyebrow mb-5 border-b border-border pb-3">{c.factsTitle}</h2>
          <dl className="space-y-6">
            {c.facts.map((fact) => (
              <div key={fact.label} className="space-y-1">
                <dt className="eyebrow">{fact.label}</dt>
                <dd className="text-base text-foreground/90">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
