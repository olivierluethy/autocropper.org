import type { MetadataRoute } from "next";
import { listPosts, SITE_URL } from "@/lib/blog";

/**
 * Only `seoIndex: true` posts belong here — `listPosts()` already filters
 * them out. De-indexed posts stay crawlable (see `app/robots.ts`) but must
 * not be advertised in the sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
  for (const post of listPosts()) {
    routes.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  return routes;
}
