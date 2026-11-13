const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(value: string | null | undefined, short = false): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return (short ? shortDateFmt : dateFmt).format(d);
}

/**
 * The release date as people read it. A game known only by its year ("year only") is stored as the 1st of
 * January of that year, and shows just the year.
 */
export function formatRelease(value: string | null | undefined, yearOnly = false): string | null {
  if (!value) return null;
  return yearOnly ? String(yearOf(value)) : formatDate(value);
}

export function yearOf(value: string | null | undefined): number | null {
  if (!value) return null;
  const y = new Date(value).getUTCFullYear();
  return Number.isNaN(y) ? null : y;
}

/**
 * Whole percentages that always add up to 100 (rounding each one on its own can give 101): every share is rounded
 * down and the missing points go to the shares with the largest remainders.
 */
export function wholePercentages(values: number[]): number[] {
  const total = values.reduce((sum, n) => sum + n, 0);
  if (total === 0) return values.map(() => 0);
  const exact = values.map((n) => (n / total) * 100);
  const result = exact.map(Math.floor);
  let missing = 100 - result.reduce((sum, n) => sum + n, 0);
  const byRemainder = exact.map((x, i) => ({ i, rest: x - Math.floor(x) })).sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of byRemainder) {
    if (missing <= 0) break;
    result[i] += 1;
    missing -= 1;
  }
  return result;
}

export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const text = Number(value).toFixed(1);
  // 10 is the top of the scale: "10", not "10.0".
  return text === "10.0" ? "10" : text;
}

/** How a rating reads at a glance: 9 and above stands out, below 5 is a warning, the rest is neutral. */
export function ratingTier(value: number | null | undefined): "high" | "low" | "mid" {
  if (value === null || value === undefined) return "mid";
  const n = Number(value);
  return n >= 9 ? "high" : n < 5 ? "low" : "mid";
}

export function formatPlaytime(hours: number | null | undefined): string | null {
  if (hours === null || hours === undefined) return null;
  const h = Number(hours);
  return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1)} h`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function excerpt(text: string | null | undefined, max = 220): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
