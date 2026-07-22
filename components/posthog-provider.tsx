"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { registerSink } from "@/lib/analytics";

/**
 * Initialises PostHog once for the whole app and wires it up as a `track()`
 * sink, so every existing `track(...)` call site reports to PostHog without
 * being touched.
 *
 * Keys come from the environment — never hardcode them:
 *   NEXT_PUBLIC_POSTHOG_KEY   project API key
 *   NEXT_PUBLIC_POSTHOG_HOST  e.g. https://eu.i.posthog.com
 *
 * Privacy: images are processed entirely in the browser and never uploaded.
 * Session replay must not leak them either, so all inputs are masked and the
 * preview/canvas surfaces carry `.ph-no-capture` (see `result-viewer.tsx`
 * and `canvas-view.tsx`).
 */
export function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      // 'history_change' covers App Router client-side navigations too.
      capture_pageview: "history_change",
      capture_pageleave: true,
      autocapture: true,
      session_recording: { maskAllInputs: true },
    });

    registerSink((event, params) => posthog.capture(event, params));
  }, []);

  return null;
}
