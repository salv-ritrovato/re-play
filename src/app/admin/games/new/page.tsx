import type { Metadata } from "next";
import { Suspense } from "react";
import { GameForm } from "@/components/admin/game-form";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getTaxonomies } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Add game" };

export default function NewGamePage() {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title="Add a game" description="Catalogue a new title: details, your rating and review, and artwork." />
      <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
        <NewGameForm />
      </Suspense>
    </div>
  );
}

async function NewGameForm() {
  const { genres, platforms } = await getTaxonomies();
  return <GameForm genres={genres} platforms={platforms} />;
}
