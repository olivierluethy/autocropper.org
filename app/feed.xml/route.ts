import { listPosts, postUrl, SITE_URL } from "@/lib/blog";

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );

// Posts are read from disk at build time, so the feed is fully static.
export const dynamic = "force-static";

/**
 * RSS feed. Mirrors the sitemap rule: `seoIndex: true` posts only, newest
 * first — `listPosts()` handles both.
 */
export function GET() {
  const posts = listPosts();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${postUrl(p)}</link>
      <guid isPermaLink="true">${postUrl(p)}</guid>
      <description>${escapeXml(p.description)}</description>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
${p.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Autocropper Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Field notes on icons, image processing and the workflows that ship them.</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
