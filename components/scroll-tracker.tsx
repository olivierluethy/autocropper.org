"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

const THRESHOLDS = [25, 50, 75, 100];

export type PageType = "tool" | "blog_index" | "blog_post";

/**
 * Fires `scroll_depth` once per threshold per page. `page_type` lets the
 * funnel separate reading behaviour on posts from tool-page engagement.
 */
export function ScrollTracker({ pageType = "tool" }: { pageType?: PageType }) {
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max <= 0) return;
      const pct = Math.round((window.scrollY / max) * 100);
      for (const t of THRESHOLDS) {
        if (pct >= t && !fired.current.has(t)) {
          fired.current.add(t);
          // `percent` is kept for continuity with the existing GA reports.
          track("scroll_depth", { depth: t, percent: t, page_type: pageType });
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pageType]);

  return null;
}
