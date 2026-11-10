import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type RawParams = Record<string, string | string[] | undefined>;

function href(basePath: string, params: RawParams, page: number) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "page" || v === undefined) continue;
    qs.set(k, Array.isArray(v) ? v.join(",") : v);
  }
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({
  basePath,
  params,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  params: RawParams;
  page: number;
  total: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 pt-10">
      {page > 1 ? (
        <Link href={href(basePath, params, page - 1)} className={linkClass} aria-label="Previous page" rel="prev">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-40")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-subtle" aria-hidden>…</span>
        ) : (
          <Link
            key={p}
            href={href(basePath, params, p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(linkClass, p === page && "border-foreground bg-foreground text-background hover:text-background")}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={href(basePath, params, page + 1)} className={linkClass} aria-label="Next page" rel="next">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-40")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
