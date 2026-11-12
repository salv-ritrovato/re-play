import Link from "next/link";
import { Fragment } from "react";
import { developerHref, publisherHref, splitDevelopers } from "@/lib/developers";
import { cn } from "@/lib/utils";

/**
 * Developer (or, with `kind="publisher"`, publisher) names as links to their page. Several studios are listed separately, each with its own link.
 * Inside a game card, render this above the card's stretched link (`relative z-10`).
 */
export function DeveloperLinks({
  value,
  kind = "developer",
  className,
}: {
  value: string | null | undefined;
  kind?: "developer" | "publisher";
  className?: string;
}) {
  const names = splitDevelopers(value);
  return (
    <>
      {names.map((name, i) => {
        const href = kind === "publisher" ? publisherHref(name) : developerHref(name);
        return (
          <Fragment key={name}>
            {i > 0 && ", "}
            {href ? (
              <Link
                href={href}
                className={cn("underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline", className)}
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </Fragment>
        );
      })}
    </>
  );
}
