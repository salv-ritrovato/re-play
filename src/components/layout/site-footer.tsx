import Link from "next/link";
import { SocialIcon } from "@/components/ui/social-icon";
import { SOCIAL_LINKS } from "@/content/links";
import { Wordmark, TAGLINE } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="space-y-2">
          <Wordmark />
          <p className="text-sm text-muted-foreground">{TAGLINE}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-subtle">
          <Link href="/library" className="hover:text-foreground">Library</Link>
          <Link href="/reviews" className="hover:text-foreground">Reviews</Link>
          <Link href="/statistics" className="hover:text-foreground">Statistics</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/admin" className="hover:text-foreground">Admin</Link>
        </nav>
      </div>

      {/* Elsewhere: kept apart from the site links. */}
      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="eyebrow">Find me elsewhere</p>
          <ul className="flex items-center gap-2" aria-label="Social links">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.description}
                  className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors outline-none hover:border-muted-foreground/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <SocialIcon id={link.id} className="size-4" />
                  <span className="sr-only">
                    {link.label} ({link.description}, opens in a new tab)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
