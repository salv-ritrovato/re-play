import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const TAGLINE = "My journey through gaming";

/**
 * Brand mark. From the md breakpoint up it shows the Re:Play logo artwork
 * (public/brand/replay-logo.png, white on transparent); small screens show its contracted
 * version, "Re:" and the play triangle (public/brand/replay-logo-compact.png), so it still fits
 * next to the menu button.
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
  // Same letter size as the full logo, which is taller because of the descender of the "y".
  const compact = {
    md: "h-7",
    lg: "h-12",
    xl: "h-24",
  } as const;

  const logo = {
    md: "h-9",
    lg: "h-16",
    xl: "h-28 lg:h-32",
  } as const;

  const mark = (
    <span role="img" aria-label="Re:Play" className={cn("inline-flex items-center", className)}>
      {/* Contracted logo, small screens */}
      <Image
        src="/brand/replay-logo-compact.png"
        alt=""
        aria-hidden
        width={703}
        height={236}
        loading="eager"
        className={cn("w-auto select-none md:hidden", compact[size])}
      />
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
    <Link href="/" aria-label="Re:Play - home" className="rounded-sm outline-offset-4">
      {mark}
    </Link>
  );
}
