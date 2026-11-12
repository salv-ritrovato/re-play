import { connection } from "next/server";
import { getReviewEntries } from "@/lib/data/public";
import { formatRating } from "@/lib/format";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ITEMS = 20;

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS feed with the latest reviews (English), newest first: the start of each text and a link to the full one. */
export async function GET() {
  await connection();
  const reviews = (await getReviewEntries()).slice(0, ITEMS);

  const items = reviews
    .map((r) => {
      const link = `${SITE_URL}/games/${r.slug}`;
      const rating = r.rating === null ? "" : ` - ${formatRating(r.rating)}/10`;
      return [
        "    <item>",
        `      <title>${escapeXml(r.title + rating)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${new Date(r.created_at).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(r.excerpt_en)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuild = reviews[0] ? new Date(reviews[0].created_at).toUTCString() : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Re:Play - Reviews</title>
    <link>${SITE_URL}/reviews</link>
    <atom:link href="${SITE_URL}/reviews/feed.xml" rel="self" type="application/rss+xml" />
    <description>Personal reviews and scores for the games I've played.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
