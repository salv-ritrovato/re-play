"use client";

import { ArrowUpRight, Gamepad2, Heart, Joystick, Layers, Library, Monitor, Trophy, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { IconLabel } from "@/components/ui/icon-label";
import { LauncherIcon, SteamIcon } from "@/components/ui/launcher-icon";
import { STEAM_URL, type AboutContent, type FactIcon } from "@/content/about";
import { REVEAL, revealDelay } from "@/lib/motion";
import { LANGS, LANG_LABEL, LAUNCHER_NAME, type Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

const FACT_ICONS: Record<FactIcon, LucideIcon> = {
  games: Gamepad2,
  heart: Heart,
  console: Joystick,
  pc: Monitor,
  story: Trophy,
  complete: Layers,
  launchers: Library,
};

/** About page body with an English / Italian switch (both versions ship with the page). */
export function AboutView({ content }: { content: Record<Lang, AboutContent> }) {
  const [lang, setLang] = useState<Lang>("en");
  const c = content[lang];
  // The first fact (the number of games played) is shown big, like a number on a scoreboard.
  const [headline, ...facts] = c.facts;

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

          {/* The story as chapters along a line: a number, a heading and a few paragraphs each. */}
          <ol className="mt-14">
            {c.sections.map((section, i) => {
              const last = i === c.sections.length - 1;
              return (
                <li
                  key={section.heading}
                  className={cn("relative pl-12 sm:pl-16", REVEAL, !last && "pb-12")}
                  style={revealDelay(i)}
                >
                  {/* The line joining the chapters, and the numbered dot of this one. */}
                  {!last && (
                    <span aria-hidden className="absolute top-10 bottom-0 left-[1.0625rem] w-px bg-border sm:left-[1.1875rem]" />
                  )}
                  <span
                    aria-hidden
                    className="absolute top-0 left-0 grid size-9 place-items-center rounded-full border border-border bg-surface text-xs font-medium text-violet tabular-nums sm:size-10 sm:text-sm"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <section aria-labelledby={`about-${slug(section.heading)}`}>
                    <h2
                      id={`about-${slug(section.heading)}`}
                      className="text-xl leading-9 font-medium tracking-tight text-foreground sm:text-2xl sm:leading-10"
                    >
                      {section.heading}
                    </h2>
                    {/* Same size for every paragraph: the lead-in look of reviews would make each chapter start loud. */}
                    <div className="mt-4 text-[1.0625rem] leading-[1.8] text-pretty text-foreground/90 [&>p+p]:mt-6">
                      {section.paragraphs.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>

                    {section.launchers && (
                      <ul aria-hidden className="mt-6 flex flex-wrap gap-2.5">
                        {section.launchers.map((id) => (
                          <li
                            key={id}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-foreground/90"
                          >
                            <LauncherIcon id={id} className="size-4 text-muted-foreground" />
                            {LAUNCHER_NAME[id]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </li>
              );
            })}
          </ol>

          <blockquote className="relative mt-16 overflow-hidden rounded-md border border-border bg-surface px-6 py-8 sm:px-10 sm:py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--accent-violet)_16%,transparent),transparent_65%)]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-3 left-4 font-serif text-[7rem] leading-none text-violet/25 select-none sm:left-8"
            >
              “
            </span>
            <p className="relative text-xl leading-relaxed text-pretty text-foreground/90 sm:text-[1.375rem]">{c.closing}</p>
          </blockquote>
        </article>

        <aside aria-label={c.factsTitle} className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="eyebrow mb-5 border-b border-border pb-3">{c.factsTitle}</h2>

          {headline && (
            <div className="mb-8 rounded-md border border-border bg-surface p-5">
              <p className="eyebrow">
                <IconLabel icon={FACT_ICONS[headline.icon]}>{headline.label}</IconLabel>
              </p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-foreground tabular-nums">{headline.value}</p>
            </div>
          )}

          <dl className="space-y-6">
            {facts.map((fact) => (
              <div key={fact.label} className="space-y-1">
                <dt className="eyebrow">
                  <IconLabel icon={FACT_ICONS[fact.icon]}>{fact.label}</IconLabel>
                </dt>
                <dd className="text-base text-foreground/90">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 space-y-1 border-t border-border pt-6">
            <p className="eyebrow">{c.steam.label}</p>
            <a
              href={STEAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-base text-foreground/90 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <SteamIcon className="text-muted-foreground transition-colors group-hover:text-foreground" />
              {c.steam.cta}
              <ArrowUpRight
                aria-hidden
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
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
