import { Suspense } from "react";
import { MainNav } from "./main-nav";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Wordmark />
          <span className="hidden text-xs text-subtle lg:inline">My journey through gaming</span>
        </div>
        {/* usePathname() is request data: keep it behind Suspense so pages can prerender. */}
        <Suspense fallback={<div className="h-9 w-72" aria-hidden />}>
          <MainNav />
        </Suspense>
      </div>
    </header>
  );
}
