import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { IconLabel } from "@/components/ui/icon-label";

/** Shown inside the admin shell when a record (e.g. a game being edited) doesn't exist. */
export default function AdminNotFound() {
  return (
    <div className="max-w-xl space-y-5 py-10">
      <p className="eyebrow">
        <IconLabel icon={Compass}>Admin · 404</IconLabel>
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        This record doesn&apos;t exist
      </h1>
      <p className="text-base text-pretty text-muted-foreground">
        It may have been deleted, or the address is wrong. Nothing was changed.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <ButtonLink href="/admin/games">Back to games</ButtonLink>
        <ButtonLink href="/admin" variant="outline">
          Dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
