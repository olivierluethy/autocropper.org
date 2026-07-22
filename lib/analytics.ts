/**
 * Autocropper analytics layer.
 *
 * `track()` fans one call out to every configured destination:
 *   - GA4, via the `gtag` global injected by `<GoogleAnalytics />`.
 *   - PostHog, via a sink registered by `<PostHogProvider />` (see
 *     `components/posthog-provider.tsx`). The sink indirection keeps
 *     `posthog-js` out of this module so it stays importable from anywhere.
 *
 * Designed as a typed event taxonomy so dashboards stay tidy:
 *   - All event names are snake_case GA4 conventions.
 *   - Params use stable keys (`location`, `label`, `section`, `tier`, …) so
 *     "tab the events to see what users hit" works in the GA explorer.
 *   - Section visibility is funneled through one `section_view` event with a
 *     `section` param. This is what answers "which features do users see /
 *     not see?" without spamming a different event per section.
 *   - Tool funnel events follow the order: `upload_attempt → upload_success`
 *     (or `upload_error`) → `download_click` / `zip_download_click` →
 *     `zip_download_complete` → `tool_reset`.
 *
 * Safe to call when neither destination is configured (no `NEXT_PUBLIC_GA_ID`,
 * no `NEXT_PUBLIC_POSTHOG_KEY`); `track()` then simply no-ops.
 */

type Gtag = (
  command: "event" | "config" | "set",
  ...args: unknown[]
) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

/* ------------------------------------------------------------------ */
/* Event taxonomy                                                      */
/* ------------------------------------------------------------------ */

export type TrackEvent =
  // Site engagement
  | "section_view"
  | "nav_click"
  | "logo_click"
  | "footer_link_click"
  | "external_link_click"
  | "cta_click"
  | "theme_toggle"
  | "scroll_depth"
  | "time_milestone"

  // Crop funnel (canonical names — mapped onto the real pipeline handlers)
  | "image_uploaded"
  | "crop_started"
  | "crop_completed"
  | "crop_failed"
  | "download_clicked"

  // Tool funnel
  | "upload_attempt"
  | "upload_click" // file picker opened
  | "upload_drop" // dropped onto zone
  | "upload_paste" // pasted from clipboard
  | "upload_success"
  | "upload_error"
  | "tool_reset"
  | "before_after_interact"
  | "preview_zoom_view"
  | "download_click"
  | "zip_download_click"
  | "zip_download_complete"
  | "free_limit_hit"

  // Pricing
  | "pricing_cta_click"
  | "subscribe_click"

  // FAQ
  | "faq_open"

  // Calculator
  | "calculator_change"

  // Blog
  | "blog_post_click"
  | "blog_back_click"
  | "blog_cta_click"
  | "blog_share_click"
  | "blog_index_viewed"
  | "blog_post_viewed"
  | "blog_cta_clicked"
  | "internal_link_clicked"
  | "outbound_link_clicked";

export type TrackParams = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

type Sink = (event: TrackEvent, params: Record<string, unknown>) => void;

let sink: Sink | null = null;

/**
 * Registered once by `<PostHogProvider />` after `posthog.init()`. Kept as a
 * callback so this module never imports `posthog-js` directly.
 */
export function registerSink(fn: Sink) {
  sink = fn;
}

/** Send an event to every configured destination. No-op if none are present. */
export function track(event: TrackEvent, params?: TrackParams) {
  if (typeof window === "undefined") return;
  // Strip undefined / null so the GA debugger view is clean.
  const clean: Record<string, string | number | boolean | string[]> = {};
  if (params) {
    for (const k in params) {
      const v = params[k];
      if (v === undefined || v === null) continue;
      clean[k] = v;
    }
  }
  const gtag = window.gtag;
  if (typeof gtag === "function") {
    // GA4 can't store arrays; join them so the param still reports.
    const ga: Record<string, string | number | boolean> = {};
    for (const k in clean) {
      const v = clean[k];
      ga[k] = Array.isArray(v) ? v.join(",") : v;
    }
    gtag("event", event, ga);
  }
  sink?.(event, clean);
}

/* ------------------------------------------------------------------ */
/* React helpers                                                       */
/* ------------------------------------------------------------------ */

import { useEffect } from "react";

/**
 * Fires `section_view` exactly once per mount when the element scrolls into
 * view. Use on every marketing section to measure feature visibility breadth.
 */
export function useSectionView(
  ref: React.RefObject<HTMLElement | null>,
  section: string,
) {
  useEffect(() => {
    let fired = false;
    const el = ref.current;
    if (!el) return;
    const fire = () => {
      if (fired) return;
      fired = true;
      track("section_view", { section });
    };
    if (typeof IntersectionObserver === "undefined") {
      fire();
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            fire();
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, section]);
}

/**
 * Fires `time_milestone` at 10s / 30s / 60s / 120s / 300s of a single
 * page session. Independent of scroll depth.
 */
const TIME_MILESTONES = [10, 30, 60, 120, 300] as const;

export function useTimeMilestones() {
  useEffect(() => {
    const fired = new Set<number>();
    const timers = TIME_MILESTONES.map((s) =>
      setTimeout(() => {
        if (fired.has(s)) return;
        fired.add(s);
        track("time_milestone", { seconds: s });
      }, s * 1000),
    );
    return () => timers.forEach(clearTimeout);
  }, []);
}
