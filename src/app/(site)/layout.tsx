import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="content" className="flex-1">
        {isSupabaseConfigured() ? children : <SetupRequired />}
      </main>
      <SiteFooter />
    </>
  );
}

function SetupRequired() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-24 sm:px-8">
      <p className="eyebrow">Setup required</p>
      <h1 className="text-4xl font-semibold tracking-tight">Connect Supabase to start</h1>
      <p className="text-muted-foreground">
        Copy <code className="rounded bg-elevated px-1.5 py-0.5 text-sm">.env.example</code> to{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 text-sm">.env.local</code>, fill in{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>,
        apply the SQL migration in <code className="rounded bg-elevated px-1.5 py-0.5 text-sm">supabase/migrations</code>,
        then restart the dev server.
      </p>
    </div>
  );
}
