import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center gap-6 px-5 py-24 sm:px-8">
        <p className="eyebrow">404</p>
        <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
          This page isn&apos;t in the archive.
        </h1>
        <p className="max-w-md text-muted-foreground">
          The game or page you&apos;re looking for doesn&apos;t exist, or it was removed from the collection.
        </p>
        <ButtonLink href="/library">
          Back to the library
        </ButtonLink>
      </main>
    </>
  );
}
