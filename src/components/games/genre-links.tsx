import Link from "next/link";
import { Fragment } from "react";
import type { Taxonomy } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Genre names as links to the library already filtered on that genre.
 * Inside a card or row, render this above the stretched title link (`relative z-10`).
 */
export function GenreLinks({
  genres,
  separator = ", ",
  className,
}: {
  genres: Taxonomy[];
  separator?: string;
  className?: string;
}) {
  return (
    <>
      {genres.map((g, i) => (
        <Fragment key={g.id}>
          {i > 0 && separator}
          <Link
            href={`/library?genre=${g.id}`}
            className={cn(
              "underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline",
              className,
            )}
          >
            {g.name}
          </Link>
        </Fragment>
      ))}
    </>
  );
}
