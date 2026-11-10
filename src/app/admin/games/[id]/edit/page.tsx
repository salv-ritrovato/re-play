import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameForm } from "@/components/admin/game-form";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getGameForEdit, getTaxonomies } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit game" };

export default function EditGamePage({ params }: PageProps<"/admin/games/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
      <EditGame params={params} />
    </Suspense>
  );
}

async function EditGame({ params }: { params: PageProps<"/admin/games/[id]/edit">["params"] }) {
  const { id } = await params;
  const [game, { genres, platforms, tags }] = await Promise.all([getGameForEdit(id), getTaxonomies()]);
  if (!game) notFound();

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title={game.title} description="Edit details, rating, review and artwork." />
      <GameForm
        key={game.updated_at}
        game={game}
        genres={genres}
        platforms={platforms}
        tagSuggestions={tags.map((t) => t.name)}
      />
    </div>
  );
}
