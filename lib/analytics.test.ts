import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSink, track } from "./analytics";

// `track()` bails out when there's no `window`. Stubbing a bare object is
// enough — it only ever touches `window.gtag` — and avoids pulling in a full
// DOM implementation for four assertions.
vi.stubGlobal("window", {} as Window & typeof globalThis);

/**
 * `track()` fans out to GA and to the PostHog sink. The fan-out is what makes
 * every existing call site report to both destinations, so it's worth pinning.
 */
describe("track", () => {
  const captured: { event: string; params: Record<string, unknown> }[] = [];

  beforeEach(() => {
    captured.length = 0;
    registerSink((event, params) => captured.push({ event, params }));
  });

  afterEach(() => {
    delete (window as { gtag?: unknown }).gtag;
    vi.restoreAllMocks();
  });

  it("sends to the registered sink", () => {
    track("blog_post_viewed", { slug: "a", seo_index: true });
    expect(captured).toHaveLength(1);
    expect(captured[0].event).toBe("blog_post_viewed");
    expect(captured[0].params).toEqual({ slug: "a", seo_index: true });
  });

  it("drops null and undefined params", () => {
    track("crop_failed", { error_type: "boom", detail: undefined, other: null });
    expect(captured[0].params).toEqual({ error_type: "boom" });
  });

  it("preserves arrays for PostHog but joins them for GA4", () => {
    const gtag = vi.fn();
    (window as { gtag?: unknown }).gtag = gtag;

    track("image_uploaded", { count: 1, file_types: ["image/png", "image/webp"] });

    expect(captured[0].params.file_types).toEqual(["image/png", "image/webp"]);
    expect(gtag).toHaveBeenCalledWith("event", "image_uploaded", {
      count: 1,
      file_types: "image/png,image/webp",
    });
  });

  it("does not throw when no destination is configured", () => {
    registerSink(() => {
      throw new Error("sink should have been replaced");
    });
    // Re-register a no-op sink to model "PostHog never initialised".
    registerSink(() => {});
    expect(() => track("crop_started", { logo_mode: true })).not.toThrow();
  });
});
