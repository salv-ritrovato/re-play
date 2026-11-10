"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";

type Updates = Record<string, string | string[] | null | undefined>;

/**
 * URL-driven state for filters/sort/pagination. The URL is the single source of truth,
 * so every filtered view is shareable, bookmarkable and server-rendered.
 *
 * Navigation is async: if the user clicks two filters before the first navigation has
 * landed, the second update must build on the first instead of on the stale URL. We keep
 * the most recent query string in a ref for that.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.toString();
  const latest = useRef(current);
  useEffect(() => {
    latest.current = current;
  }, [current]);

  const update = useCallback(
    (updates: Updates, { resetPage = true }: { resetPage?: boolean } = {}) => {
      const next = new URLSearchParams(latest.current);
      for (const [key, value] of Object.entries(updates)) {
        next.delete(key);
        if (Array.isArray(value)) {
          if (value.length > 0) next.set(key, value.join(","));
        } else if (value !== null && value !== undefined && value !== "") {
          next.set(key, value);
        }
      }
      if (resetPage && !("page" in updates)) next.delete("page");
      const qs = next.toString();
      latest.current = qs;
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  /** Values of a comma-separated param, for rendering. */
  const getList = useCallback(
    (key: string) => (searchParams.get(key) ?? "").split(",").filter(Boolean),
    [searchParams],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const list = (new URLSearchParams(latest.current).get(key) ?? "").split(",").filter(Boolean);
      update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
    },
    [update],
  );

  const clear = useCallback(
    (keys: string[]) => update(Object.fromEntries(keys.map((k) => [k, null]))),
    [update],
  );

  return { searchParams, update, toggle, getList, clear, isPending };
}
