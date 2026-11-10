import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const TAGLINE = "My journey through gaming";

/**
 * Brand mark. From the md breakpoint up it shows the Re:Play logo artwork
 * (public/brand/replay-logo.png, white on transparent); small screens keep the compact
 * "Re" mark so it still fits next to the menu button.
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
  const compact = {
    md: "text-2xl",
    lg: "text-5xl",
    xl: "text-8xl sm:text-9xl",
  } as const;

  const logo = {
    md: "h-9",
    lg: "h-16",
    xl: "h-28 lg:h-32",
  } as const;

  const mark = (
    <span role="img" aria-label="Re:Play" className={cn("inline-flex items-center", className)}>
      {/* Compact mark, small screens */}
      <span
        aria-hidden
        className={cn("inline-flex items-baseline leading-none tracking-[-0.06em] md:hidden", compact[size])}
      >
        <span className="font-semibold text-foreground">R</span>
        <span className="font-extralight text-muted-foreground">e</span>
      </span>
      {/* Logo artwork, md and up */}
      <Image
        src="/brand/replay-logo.png"
        alt=""
        aria-hidden
        width={1185}
        height={294}
        loading="eager"
        className={cn("hidden w-auto select-none md:block", logo[size])}
      />
    </span>
  );

  if (!asLink) return mark;
  return (
    <Link href="/" aria-label="Re:Play — home" className="rounded-sm outline-offset-4">
      {mark}
    </Link>
  );
}
