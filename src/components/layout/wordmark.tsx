import Link from "next/link";
import { cn } from "@/lib/utils";

export const TAGLINE = "My journey through gaming";

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
      className={cn("inline-flex items-baseline leading-none tracking-[-0.06em]", sizes[size], className)}
      aria-label="Re"
    >
      <span aria-hidden className="font-semibold text-foreground">R</span>
      <span aria-hidden className="font-extralight text-muted-foreground">e</span>
    </span>
  );

  if (!asLink) return mark;
  return (
    <Link href="/" aria-label="Re — home" className="rounded-sm outline-offset-4">
      {mark}
    </Link>
  );
}
