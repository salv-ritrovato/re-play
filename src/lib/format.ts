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

export function yearOf(value: string | null | undefined): number | null {
  if (!value) return null;
  const y = new Date(value).getUTCFullYear();
  return Number.isNaN(y) ? null : y;
}

export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(1);
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
