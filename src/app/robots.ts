import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${SITE_URL}/sitemap.xml`,
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/random", "/search-index"] },
  };
}
