import { NotFoundView } from "@/components/layout/not-found-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Global 404 for URLs that match no route at all. These render outside the (site) layout,
 * so the site chrome is added here. See (site)/not-found.tsx for 404s raised inside the site.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="content" className="flex-1">
        <NotFoundView />
      </main>
      <SiteFooter />
    </>
  );
}
