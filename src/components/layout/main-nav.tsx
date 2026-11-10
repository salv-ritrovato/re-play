"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Wordmark, TAGLINE } from "./wordmark";

export const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/library", label: "Library" },
  { href: "/reviews", label: "Reviews" },
  { href: "/statistics", label: "Statistics" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/library" && pathname.startsWith("/games"));
}

export function MainNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              isActive(pathname, item.href) && "text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-surface">
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Wordmark size="lg" asLink={false} />
              <p className="text-sm text-muted-foreground">{TAGLINE}</p>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col px-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={cn(
                    "border-b border-border py-3 text-lg text-muted-foreground transition-colors hover:text-foreground",
                    isActive(pathname, item.href) && "text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
