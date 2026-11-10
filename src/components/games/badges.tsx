import { COMPLETION_LABEL, PLAY_STATUS_LABEL, type CompletionStatus, type PlayStatus } from "@/lib/types";
import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOT: Record<PlayStatus, string> = {
  backlog: "bg-subtle",
  playing: "bg-violet",
  completed: "bg-foreground",
  on_hold: "bg-muted-foreground",
  dropped: "bg-destructive/80",
};

export function StatusBadge({ status, className }: { status: PlayStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[status])} />
      {PLAY_STATUS_LABEL[status]}
    </span>
  );
}

export function CompletionBadge({ status }: { status: CompletionStatus }) {
  return <span className="text-xs text-muted-foreground">{COMPLETION_LABEL[status]}</span>;
}

export function Rating({
  value,
  size = "md",
  className,
}: {
  value: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-3xl",
    xl: "text-6xl",
  } as const;
  return (
    <span
      className={cn("inline-flex items-baseline gap-0.5 font-semibold tabular-nums tracking-tight", sizes[size], className)}
      aria-label={value === null ? "Not rated" : `Rated ${formatRating(value)} out of 10`}
    >
      <span className={value === null ? "text-subtle" : undefined}>{formatRating(value)}</span>
      {value !== null && size !== "sm" && (
        <span className="text-[0.5em] font-normal text-subtle">/10</span>
      )}
    </span>
  );
}
