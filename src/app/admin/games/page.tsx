import type { Metadata } from "next";
import Link from "next/link";
import { Download, Gamepad2, Pencil, Plus } from "lucide-react";
import { Suspense } from "react";
import { AdminGamesFilters } from "@/components/admin/admin-games-filters";
import { DeleteGameButton } from "@/components/admin/delete-game-button";
import { Rating, StatusBadge } from "@/components/games/badges";
import { GameCover } from "@/components/games/game-cover";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/layout/pagination";
import { buttonVariants } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_PAGE_SIZE, listAdminGames } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { PLAY_STATUSES, type PlayStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Games" };

export default function AdminGamesPage({ searchParams }: PageProps<"/admin/games">) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Games"
        actions={
          <>
            {/* A plain link: the answer is a file to save, not a page. */}
            <a
              href="/admin/export"
              download
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
              title="Download every game as one JSON file"
            >
              <Download /> Backup
            </a>
            <ButtonLink href="/admin/games/new" className="gap-2">
              <Plus /> Add game
            </ButtonLink>
          </>
        }
      />
      <AdminGamesFilters />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <GamesTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GamesTable({ searchParams }: { searchParams: PageProps<"/admin/games">["searchParams"] }) {
  const raw = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = one(raw.status);
  const missing = one(raw.missing);
  const page = Math.max(1, Number(one(raw.page)) || 1);

  const { rows, total } = await listAdminGames({
    q: one(raw.q)?.slice(0, 100),
    status: PLAY_STATUSES.includes(status as PlayStatus) ? (status as PlayStatus) : undefined,
    missing: missing === "cover" || missing === "review" ? missing : undefined,
    page,
  });

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Gamepad2}
        title={total === 0 && !raw.q && !raw.status && !raw.missing ? "No games yet" : "No games match"}
        description="Add a game or adjust your search and filters."
        action={
          <ButtonLink href="/admin/games/new">
            Add game
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "game" : "games"}
      </p>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16"><span className="sr-only">Cover</span></TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Rating</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <GameCover title={g.title} path={g.cover_path} blur={g.cover_blur} sizes="48px" zoom={false} className="w-10 rounded-sm" />
                </TableCell>
                <TableCell className="max-w-0 min-w-40 whitespace-normal [overflow-wrap:anywhere]">
                  <Link href={`/admin/games/${g.id}/edit`} className="font-medium hover:underline">
                    {g.title}
                  </Link>
                  <div className="mt-1 flex gap-3 text-xs text-subtle">
                    {!g.cover_path && <span>No cover</span>}
                    {!g.review_en && <span>No review</span>}
                    {g.is_online && <span className="text-violet">Online</span>}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell"><StatusBadge status={g.play_status} /></TableCell>
                <TableCell className="hidden md:table-cell"><Rating value={g.rating} size="sm" /></TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(g.updated_at, true)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <ButtonLink
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${g.title}`}
                      href={`/admin/games/${g.id}/edit`}
                    >
                      <Pencil />
                    </ButtonLink>
                    <DeleteGameButton id={g.id} title={g.title} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination basePath="/admin/games" params={raw} page={page} total={total} pageSize={ADMIN_PAGE_SIZE} />
    </>
  );
}
