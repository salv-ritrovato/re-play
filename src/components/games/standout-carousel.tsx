"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { LANG_LABEL, LANGS, type Lang } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Rating } from "./badges";
import { DeveloperLinks } from "./developer-links";
import { GameCover } from "./game-cover";

export interface StandoutSlide {
  slug: string;
  title: string;
  year: number | null;
  developer: string | null;
  rating: number;
  cover_path: string | null;
  cover_blur: string | null;
  /** Start of the review in each language (Italian is null when the game has no review in it). */
  excerpt: { en: string; it: string | null };
}

/**
 * The reviews of the games that stood out, one at a time. It scrolls sideways (swipe, arrows, dots or the
 * keyboard), never moves on its own, and the review can be read in English or Italian.
 */
export function StandoutCarousel({ slides, label }: { slides: StandoutSlide[]; label: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState<Lang>("en");
  const many = slides.length > 1;
  const hasItalian = slides.some((s) => s.excerpt.it);

  function go(to: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(slides.length - 1, to));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  function onScroll() {
    const el = track.current;
    if (el && el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <section role="region" aria-roledescription="carousel" aria-label={label} className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow">Standout</p>
          <h2 className="text-xl font-medium tracking-tight">{label}</h2>
        </div>

        <div className="flex items-center gap-3">
          {hasItalian && (
            <div role="group" aria-label="Review language" className="flex rounded-lg border border-border p-0.5 text-xs">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    lang === l ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          )}
          {many && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <ArrowButton direction="previous" disabled={index === 0} onClick={() => go(index - 1)} />
              <ArrowButton direction="next" disabled={index === slides.length - 1} onClick={() => go(index + 1)} />
            </div>
          )}
        </div>
      </div>

      <ul
        ref={track}
        onScroll={onScroll}
        tabIndex={0}
        aria-label={`${label}, scroll sideways`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
          }
        }}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-md border border-border bg-surface [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => {
          const text = (lang === "it" && slide.excerpt.it) || slide.excerpt.en;
          const textLang: Lang = lang === "it" && slide.excerpt.it ? "it" : "en";
          return (
            <li
              key={slide.slug}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              className="w-full shrink-0 snap-center"
            >
              <div className="grid gap-8 p-5 sm:grid-cols-[12rem_1fr] sm:gap-12 sm:p-8 lg:grid-cols-[15rem_1fr] lg:p-10">
                <GameCover
                  title={slide.title}
                  path={slide.cover_path}
                  blur={slide.cover_blur}
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 192px, 70vw"
                  zoom={false}
                  className="mx-auto max-w-56 shadow-xl shadow-black/50 sm:max-w-none"
                />
                <div className="flex min-w-0 flex-col justify-center">
                  <h3 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{slide.title}</h3>
                  <p className="mt-2 text-sm text-subtle">
                    {slide.year}
                    {slide.year && slide.developer ? " · " : null}
                    <DeveloperLinks value={slide.developer} />
                  </p>
                  <div className="mt-5">
                    <Rating value={slide.rating} size="lg" />
                  </div>
                  <blockquote
                    lang={textLang}
                    className="mt-5 max-w-2xl border-l-2 border-violet/60 pl-5 text-base leading-relaxed text-pretty text-foreground/85"
                  >
                    {text}
                  </blockquote>
                  <div className="mt-6">
                    <Link
                      href={`/games/${slide.slug}`}
                      className="group inline-flex items-center gap-1.5 text-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:underline"
                    >
                      {textLang === "it" ? "Leggi la recensione completa" : "Read the full review"}
                      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                      <span className="sr-only"> of {slide.title}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {many && (
        <div className="flex items-center justify-center gap-2" role="group" aria-label="Choose a review">
          {slides.map((slide, i) => (
            <button
              key={slide.slug}
              type="button"
              aria-label={`Show ${slide.title} (${i + 1} of ${slides.length})`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className={cn(
                "h-2 rounded-full transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                i === index ? "w-6 bg-foreground" : "w-2 bg-border hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "previous" ? "Previous review" : "Next review"}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors outline-none hover:border-muted-foreground/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}
