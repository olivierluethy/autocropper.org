"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires `blog_index_viewed` once when the listing mounts. */
export function BlogIndexAnalytics({ numPostsShown }: { numPostsShown: number }) {
  useEffect(() => {
    track("blog_index_viewed", { num_posts_shown: numPostsShown });
  }, [numPostsShown]);
  return null;
}

interface PostProps {
  slug: string;
  seoIndex: boolean;
  tags: string[];
}

/**
 * Fires `blog_post_viewed` on mount, and delegates clicks on links inside the
 * rendered markdown (which carry `data-post-link` from the renderer) to
 * `internal_link_clicked` / `outbound_link_clicked`.
 */
export function BlogPostAnalytics({ slug, seoIndex, tags }: PostProps) {
  useEffect(() => {
    track("blog_post_viewed", { slug, seo_index: seoIndex, tags });
  }, [slug, seoIndex, tags]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.("a[data-post-link]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (link.dataset.postLink === "external") {
        track("outbound_link_clicked", { href, slug });
      } else {
        track("internal_link_clicked", { slug, href });
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug]);

  return null;
}
