import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOwner } from "@/lib/auth";
import { logout } from "../login/actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Re:Play" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  // Everything under /admin is per-request (session-dependent): never prerender it.
  await connection();
  const owner = await requireOwner();

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <aside className="border-b border-border bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-full flex-col gap-6 p-4 md:p-5">
          <div className="flex items-center justify-between md:block md:space-y-1">
            <Wordmark />
            <p className="eyebrow hidden md:block">Admin</p>
          </div>

          <AdminNav
            items={[
              { href: "/admin", label: "Dashboard", icon: "dashboard" },
              { href: "/admin/games", label: "Games", icon: "library" },
              { href: "/admin/games/new", label: "Add game", icon: "plus" },
            ]}
          />

          <div className="mt-auto hidden space-y-3 md:block">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="size-4" /> View site
            </Link>
            <p className="truncate text-xs text-subtle" title={owner.email}>{owner.email}</p>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm" className="w-full justify-start gap-2">
                <LogOut /> Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">{children}</div>
        {/* Mobile sign-out */}
        <form action={logout} className="px-5 pb-10 md:hidden">
          <Button type="submit" variant="outline" size="sm" className="gap-2">
            <LogOut /> Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="flex flex-1" aria-busy="true" aria-label="Loading admin">
      <Skeleton className="hidden w-60 rounded-none md:block" />
      <div className="flex-1 space-y-6 p-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
