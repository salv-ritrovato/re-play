import { cn } from "@/lib/utils";

/** Horizontal bars, pure CSS: no client JS, great for genres and platforms. */
export function BarList({
  items,
  max = 12,
  emptyLabel = "No data yet",
}: {
  items: { label: string; value: number }[];
  max?: number;
  emptyLabel?: string;
}) {
  const shown = items.slice(0, max);
  const top = Math.max(1, ...shown.map((i) => i.value));
  if (shown.length === 0) return <p className="text-sm text-subtle">{emptyLabel}</p>;

  return (
    <ul className="space-y-3">
      {shown.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,8rem)_1fr_2rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,10rem)_1fr_2.5rem]">
          <span className="truncate text-muted-foreground">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-elevated" aria-hidden>
            <span
              className="block h-full rounded-full bg-foreground/85"
              style={{ width: `${(item.value / top) * 100}%` }}
            />
          </span>
          <span className="text-right tabular-nums">{item.value}</span>
        </li>
      ))}
      {items.length > max && (
        <li className="pt-1 text-xs text-subtle">+ {items.length - max} more</li>
      )}
    </ul>
  );
}

/** Vertical columns, pure CSS: rating distribution and games per year. */
export function Columns({
  items,
  highlight,
  emptyLabel = "No data yet",
  className,
}: {
  items: { label: string; value: number }[];
  highlight?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const top = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-sm text-subtle">{emptyLabel}</p>;

  return (
    <div className={cn("relative overflow-x-auto", className)}>
      <ul
        className="flex h-52 min-w-full items-end gap-2"
        style={{ minWidth: `${items.length * 2.25}rem` }}
      >
        {items.map((item) => (
          <li key={item.label} className="flex h-full max-w-20 min-w-8 flex-1 flex-col justify-end gap-2 text-center">
            <span className="text-xs tabular-nums text-muted-foreground">{item.value || ""}</span>
            <span
              aria-hidden
              className={cn(
                "w-full rounded-t-sm bg-foreground/80 transition-colors",
                item.label === highlight && "bg-violet",
                item.value === 0 && "bg-elevated",
              )}
              style={{ height: `${Math.max((item.value / top) * 100, item.value === 0 ? 2 : 4)}%` }}
            />
            <span className="text-xs text-subtle">{item.label}</span>
            <span className="sr-only">{item.value} games</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
