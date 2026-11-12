import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/data/public";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Every public page, so search engines can find the whole archive: sections, games, developers, publishers. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { games, developers, publishers } = await getSitemapData();
  const url = (path: string) => `${SITE_URL}${path}`;

  return [
    ...["/", "/library", "/reviews", "/genres", "/statistics", "/about"].map((path) => ({
      url: url(path),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
    })),
    ...games.map((g) => ({
      url: url(`/games/${g.slug}`),
      lastModified: g.updated_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...developers.map((slug) => ({ url: url(`/developers/${slug}`), changeFrequency: "monthly" as const, priority: 0.4 })),
    ...publishers.map((slug) => ({ url: url(`/publishers/${slug}`), changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
