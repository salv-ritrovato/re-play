import { slugify } from "@/lib/format";

/** "Inc.", "Ltd" and friends belong to the name before the comma, they are not a studio of their own. */
const COMPANY_SUFFIX = /^(inc|llc|ltd|co|corp|gmbh|ab|oy|sa|s\.a|srl)\.?$/i;

/**
 * The developer field is free text and often lists several studios ("2K Australia, Gearbox Software").
 * Splits it into the individual names, in order, without duplicates.
 */
export function splitDevelopers(value: string | null | undefined): string[] {
  if (!value) return [];
  const names: string[] = [];
  for (const part of value.split(/[,;]/)) {
    const token = part.trim();
    if (!token) continue;
    if (COMPANY_SUFFIX.test(token) && names.length > 0) {
      names[names.length - 1] += `, ${token}`;
    } else {
      names.push(token);
    }
  }
  const seen = new Set<string>();
  return names.filter((n) => {
    const key = slugify(n);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Address of the page that lists everything made by this developer (null when the name has no letters). */
export function developerHref(name: string): string | null {
  const slug = slugify(name);
  return slug ? `/developers/${slug}` : null;
}
