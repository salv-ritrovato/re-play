"use client";

import { LayoutDashboard, Library, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ICONS = { dashboard: LayoutDashboard, library: Library, plus: Plus } as const;

export function AdminNav({
  items,
}: {
  items: { href: string; label: string; icon: keyof typeof ICONS }[];
}) {
  const pathname = usePathname();
  // The most specific matching item wins ("/admin/games/new" must not also light up "/admin/games").
  const active =
    [...items]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => pathname === i.href || (i.href !== "/admin" && pathname.startsWith(`${i.href}/`)))
      ?.href ?? "";

  return (
    <nav aria-label="Admin" className="flex gap-1 md:flex-col">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground",
              isActive && "bg-elevated text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
