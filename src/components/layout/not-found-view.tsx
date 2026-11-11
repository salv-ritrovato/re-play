import { Compass } from "lucide-react";
import { Container } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { IconLabel } from "@/components/ui/icon-label";

/** Content of the public 404 page (without header/footer, which the surrounding layout provides). */
export function NotFoundView() {
  return (
    <Container className="grid min-h-[62vh] content-center gap-10 py-20">
      <p
        aria-hidden
        className="font-extralight leading-none tracking-[-0.06em] text-elevated select-none text-[clamp(7rem,24vw,17rem)]"
      >
        404
      </p>
      <div className="max-w-xl space-y-5">
        <p className="eyebrow">
          <IconLabel icon={Compass}>Page not found</IconLabel>
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          This page isn&apos;t in the archive
        </h1>
        <p className="text-base text-pretty text-muted-foreground">
          The game or page you&apos;re looking for doesn&apos;t exist, or it was removed from the
          collection. Check the address, or head back to something that does.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/library" size="lg">
            Browse the library
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg">
            Back to the overview
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
