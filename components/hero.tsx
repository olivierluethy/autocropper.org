"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";
import { processLogo, TARGET_SIZES, type ProcessedResult } from "@/lib/logo-pipeline";
import { UploadZone } from "./upload-zone";
import { ResultViewer } from "./result-viewer";
import { track, useSectionView } from "@/lib/analytics";

export function Hero() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  useSectionView(sectionRef, "hero");

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    // The pipeline always runs logo-aware cropping over the fixed preset
    // ladder, so these properties are constant today — they exist so the
    // funnel keeps working if the size selection ever becomes user-driven.
    track("crop_started", {
      num_target_sizes: TARGET_SIZES.length,
      logo_mode: true,
      source: "preset",
    });
    try {
      const r = await processLogo(file);
      setResult(r);
      track("crop_completed", {
        duration_ms: Math.round(r.durationMs),
        num_outputs: TARGET_SIZES.length,
      });
      track("upload_success", {
        ms: Math.round(r.durationMs),
        w: r.originalWidth,
        h: r.originalHeight,
        bbox_w: r.bbox.w,
        bbox_h: r.bbox.h,
        components: r.components,
        had_alpha: r.bg === null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Processing failed";
      setError(`Could not process this image. ${msg}`);
      track("crop_failed", { error_type: msg.slice(0, 60) });
      track("upload_error", { reason: msg.slice(0, 60), stage: "processing" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="relative isolate" ref={sectionRef}>
      <div className="absolute inset-x-0 top-0 -z-10 h-[60vh] glow" aria-hidden />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" aria-hidden />

      {/* Tight top spacing on small screens keeps the upload zone inside the
          first viewport — it's the thing people came to use. */}
      <div className="mx-auto max-w-6xl px-5 pt-6 pb-10 sm:pt-14 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* The eyebrow repeats the subhead; on mobile that costs a line the
              upload zone needs more. */}
          <div className="mb-5 hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-1 text-xs font-medium text-[var(--color-fg-muted)] sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            One upload replaces five tools
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-6xl">
            Turn any logo into a perfect icon set.
            <span className="block text-[var(--color-fg-muted)]">In seconds.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-[var(--color-fg-muted)] sm:mt-5 sm:text-lg">
            One upload replaces 5 tools. No quality loss. No uploads. No friction.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mx-auto mt-6 max-w-3xl sm:mt-10"
        >
          <div
            className={[
              "relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-3 sm:p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_30px_80px_-20px_rgba(0,0,0,0.4)]",
            ].join(" ")}
          >
            {!result ? (
              <>
                <UploadZone onFile={handleFile} busy={busy} />
                {busy ? (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-[var(--color-fg-muted)]">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing in your browser…
                  </div>
                ) : null}
                {error ? (
                  <div role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="p-2 sm:p-3">
                <ResultViewer
                  key={result.originalUrl}
                  result={result}
                  onReset={() => {
                    setResult(null);
                    setError(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Proof sits under the tool: the upload zone gets the first look,
              the reassurance answers the question it raises. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-fg-subtle)]">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> ~5 s end-to-end
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> 100 % in-browser
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> No signup
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
