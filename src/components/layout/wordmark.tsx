import Link from "next/link";
import { cn } from "@/lib/utils";

export const TAGLINE = "My journey through gaming";

/**
 * Typographic wordmark. Desktop (md and up) shows the full "re:play" lockup;
 * small screens keep the compact "Re" mark so it still fits next to the menu button.
 */
export function Wordmark({
  className,
  size = "md",
  asLink = true,
}: {
  className?: string;
  size?: "md" | "lg" | "xl";
  asLink?: boolean;
}) {
  const sizes = {
    md: "text-2xl",
    lg: "text-5xl",
    xl: "text-8xl sm:text-9xl",
  } as const;

  const mark = (
    <span
      role="img"
      aria-label="re:play"
      className={cn("inline-flex items-baseline leading-none tracking-[-0.06em]", sizes[size], className)}
    >
      {/* Compact mark */}
      <span aria-hidden className="md:hidden">
        <span className="font-semibold text-foreground">R</span>
        <span className="font-extralight text-muted-foreground">e</span>
      </span>
      {/* Full lockup */}
      <span aria-hidden className="hidden items-baseline md:inline-flex">
        <span className="font-semibold text-foreground">re</span>
        <span className="mx-[0.03em] font-light text-violet">:</span>
        <span className="font-extralight text-muted-foreground">play</span>
      </span>
    </span>
  );

  if (!asLink) return mark;
  return (
    <Link href="/" aria-label="re:play — home" className="rounded-sm outline-offset-4">
      {mark}
    </Link>
  );
}
