"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconLabel } from "@/components/ui/icon-label";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center gap-6 px-5 py-24 sm:px-8">
      <p className="eyebrow">
        <IconLabel icon={TriangleAlert}>Something went wrong</IconLabel>
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
        The archive hit an unexpected error
      </h1>
      <p className="max-w-md text-muted-foreground">
        Nothing was lost. Try again, and if it keeps happening check that the Supabase environment
        variables are configured.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
