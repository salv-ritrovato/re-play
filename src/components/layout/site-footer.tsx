import Link from "next/link";
import { STEAM_URL } from "@/content/about";
import { Wordmark, TAGLINE } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="space-y-2">
          <Wordmark />
          <p className="text-sm text-muted-foreground">{TAGLINE}</p>
        </div>
        <div className="flex items-center gap-5 text-sm text-subtle">
          <Link href="/library" className="hover:text-foreground">Library</Link>
          <Link href="/reviews" className="hover:text-foreground">Reviews</Link>
          <Link href="/statistics" className="hover:text-foreground">Statistics</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <a href={STEAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Steam
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link href="/admin" className="hover:text-foreground">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
