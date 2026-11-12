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
  items: { label: string; value: number; /** Colours the bar: the best ratings in gold, the weakest in red. */ tone?: "high" | "low" | "mid" }[];
  highlight?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const top = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-sm text-subtle">{emptyLabel}</p>;

  return (
    // Scrolls sideways only when there are too many columns for a narrow screen;
    // never vertically (overflow-y hidden), and the scrollbar itself stays out of sight.
    <div className={cn("relative overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <ul
        className="flex h-52 min-w-full items-stretch gap-2"
        style={{ minWidth: `${items.length * 2.25}rem` }}
      >
        {items.map((item) => (
          <li key={item.label} className="flex h-full max-w-20 min-w-8 flex-1 flex-col gap-2 text-center">
            {/* The track takes whatever height the label row leaves; its top padding is the headroom for the value above the tallest bar, so nothing can overflow. */}
            <div className="flex min-h-0 flex-1 items-end pt-6">
              <span
                aria-hidden
                className={cn(
                  "relative w-full rounded-t-sm bg-foreground/80 transition-colors",
                  item.tone === "high" && "bg-rating-high/90",
                  item.tone === "low" && "bg-rating-low/80",
                  item.label === highlight && "bg-violet",
                  item.value === 0 && "bg-elevated",
                )}
                style={{ height: `${Math.max((item.value / top) * 100, item.value === 0 ? 2 : 4)}%` }}
              >
                <span className="absolute bottom-full left-0 mb-1.5 w-full text-xs tabular-nums text-muted-foreground">
                  {item.value || ""}
                </span>
              </span>
            </div>
            <span className="text-xs text-subtle">{item.label}</span>
            <span className="sr-only">{item.value} games</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)"];

/**
 * A ring split in proportion to each value, with the legend beside it (label, share, count). Pure SVG, no
 * client code. The centre shows the total unless `centre` says otherwise.
 */
export function Donut({
  items,
  centre,
  unit = "games",
  emptyLabel = "No data yet",
}: {
  items: { label: string; value: number }[];
  centre?: number;
  unit?: string;
  emptyLabel?: string;
}) {
  const shown = items.filter((i) => i.value > 0);
  const total = shown.reduce((sum, i) => sum + i.value, 0);
  if (total === 0) return <p className="text-sm text-subtle">{emptyLabel}</p>;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const gap = shown.length > 1 ? 1.5 : 0;
  const lengths = shown.map((item) => (item.value / total) * circumference);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, n) => sum + n, 0));

  return (
    <div className="flex items-center gap-6">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={shown.map((i) => `${i.label}: ${i.value}`).join(", ")}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--elevated)" strokeWidth="14" />
          {shown.map((item, i) => {
            const dash = Math.max(lengths[i] - gap, 0.5);
            return (
              <circle
                key={item.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="14"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-starts[i]}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{centre ?? total}</span>
          <span className="text-[0.6875rem] tracking-wide text-subtle uppercase">{unit}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
        {shown.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
            <span className="text-xs tabular-nums text-subtle">{Math.round((item.value / total) * 100)}%</span>
            <span className="w-7 text-right tabular-nums">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** Opacity steps of the accent colour, from one game to four or more in a month. */
const MONTH_STEPS = ["bg-violet/25", "bg-violet/50", "bg-violet/75", "bg-violet"];

/**
 * One row per year, one square per month: the darker the square, the more games were finished that month.
 * A real table (a screen reader reads the counts), pure CSS, and it fits a phone: the squares shrink with the width.
 */
export function MonthGrid({ cells }: { cells: { year: number; month: number; games: number }[] }) {
  if (cells.length === 0) return null;
  const counts = new Map(cells.map((c) => [`${c.year}-${c.month}`, c.games]));
  const first = cells[0].year;
  const last = cells[cells.length - 1].year;
  const years = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  return (
    <div className="max-w-2xl">
      <table className="w-full table-fixed border-separate border-spacing-[3px] sm:border-spacing-1">
        <caption className="sr-only">Games finished per month</caption>
        <thead>
          <tr>
            <td className="w-10 sm:w-14" />
            {MONTHS.map((m) => (
              <th key={m} scope="col" className="pb-1 text-center text-[0.625rem] font-normal text-subtle sm:text-xs">
                <abbr title={m} className="no-underline">
                  <span className="sm:hidden" aria-hidden>{m[0]}</span>
                  <span className="hidden sm:inline" aria-hidden>{m.slice(0, 3)}</span>
                  <span className="sr-only">{m}</span>
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <th scope="row" className="pr-1 text-right text-xs font-normal tabular-nums text-subtle sm:text-sm">{year}</th>
              {MONTHS.map((m, i) => {
                const games = counts.get(`${year}-${i + 1}`) ?? 0;
                return (
                  <td key={m} className="p-0">
                    <div
                      title={`${m} ${year}: ${games} ${games === 1 ? "game" : "games"}`}
                      className={cn("aspect-square w-full rounded-[3px]", games === 0 ? "bg-elevated/70" : MONTH_STEPS[Math.min(games, 4) - 1])}
                    >
                      <span className="sr-only">{games}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-subtle" aria-hidden>
        Fewer
        <span className="size-3 rounded-[3px] bg-elevated/70" />
        {MONTH_STEPS.map((step) => (
          <span key={step} className={cn("size-3 rounded-[3px]", step)} />
        ))}
        More
      </div>
    </div>
  );
}
