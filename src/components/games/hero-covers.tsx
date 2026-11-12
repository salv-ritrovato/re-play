import Image from "next/image";
import { mediaUrl } from "@/lib/media";

/**
 * A tilted wall of covers behind the home hero, faded into the background on the left and at the edges.
 * Purely decoration (hidden from screen readers and from small screens, where the hero needs the room).
 */
export function HeroCovers({ covers }: { covers: string[] }) {
  const urls = covers.map((path) => mediaUrl(path)).filter((url): url is string => Boolean(url));
  if (urls.length < 6) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[64%] overflow-hidden lg:block"
      style={{ maskImage: "linear-gradient(to left, black 20%, transparent 92%)" }}
    >
      <div className="absolute top-1/2 left-1/2 grid w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-6 grid-cols-6 gap-3 opacity-[0.28]">
        {urls.map((url, i) => (
          <div
            key={url}
            // Every other column sits lower, so the wall does not look like a spreadsheet.
            className={`relative aspect-[3/4] overflow-hidden rounded-md ${i % 2 === 1 ? "translate-y-8" : ""}`}
          >
            <Image src={url} alt="" fill sizes="160px" quality={55} className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}
