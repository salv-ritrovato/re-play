import type { Metadata } from "next";
import Link from "next/link";
import { ImageOff, MessageSquareText, Plus } from "lucide-react";
import { Suspense } from "react";
import { GameCover } from "@/components/games/game-cover";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDashboard } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        actions={
          <ButtonLink href="/admin/games/new" className="gap-2">
            <Plus /> Add game
          </ButtonLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const data = await getAdminDashboard();

  return (
    <div className="space-y-12">
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
        <Metric label="Registered games" value={data.total} href="/admin/games" />
        <Metric label="Missing cover" value={data.missingCover.count} href="/admin/games?missing=cover" />
        <Metric label="Without review" value={data.missingReview.count} href="/admin/games?missing=review" />
      </dl>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Recently added</h2>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games yet. Add your first one to get started.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {data.recent.map((g) => (
              <li key={g.id}>
                <Link href={`/admin/games/${g.id}/edit`} className="group block">
                  <GameCover title={g.title} path={g.cover_path} blur={g.cover_blur} />
                  <p className="mt-2 truncate text-sm">{g.title}</p>
                  <p className="text-xs text-subtle">{formatDate(g.created_at, true)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Todo
          icon={<ImageOff className="size-4" />}
          title="Games missing cover artwork"
          items={data.missingCover.items}
          total={data.missingCover.count}
          doneLabel="Every game has a cover."
        />
        <Todo
          icon={<MessageSquareText className="size-4" />}
          title="Games without a review"
          items={data.missingReview.items}
          total={data.missingReview.count}
          doneLabel="Every game has a review."
        />
      </div>
    </div>
  );
}

function Metric({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="group block bg-card p-6 transition-colors hover:bg-elevated">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-3 text-5xl font-semibold tracking-tight tabular-nums">{value}</dd>
    </Link>
  );
}

function Todo({
  icon,
  title,
  items,
  total,
  doneLabel,
}: {
  icon: React.ReactNode;
  title: string;
  items: { id: string; title: string }[];
  total: number;
  doneLabel: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <span className="text-subtle">{icon}</span> {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{doneLabel}</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {items.map((g) => (
            <li key={g.id}>
              <Link
                href={`/admin/games/${g.id}/edit`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-surface"
              >
                <span className="truncate">{g.title}</span>
                <span className="shrink-0 text-xs text-subtle">Edit</span>
              </Link>
            </li>
          ))}
          {total > items.length && (
            <li className="px-4 py-3 text-xs text-subtle">+ {total - items.length} more</li>
          )}
        </ul>
      )}
    </section>
  );
}
