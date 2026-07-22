"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Package, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { ProcessedResult } from "@/lib/logo-pipeline";
import { canvasToBlob, PREVIEW_SIZES, TARGET_SIZES } from "@/lib/logo-pipeline";
import { track } from "@/lib/analytics";
import { BeforeAfter } from "./before-after";
import { CanvasView } from "./canvas-view";

interface Props {
  result: ProcessedResult;
  onReset: () => void;
}

function bumpUsage(): { count: number; limit: number; over: boolean } {
  const limit = 5;
  if (typeof window === "undefined") return { count: 0, limit, over: false };
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem("autocropper.usage");
    const parsed: { date: string; count: number } = raw
      ? JSON.parse(raw)
      : { date: today, count: 0 };
    const next = parsed.date === today ? parsed.count + 1 : 1;
    localStorage.setItem(
      "autocropper.usage",
      JSON.stringify({ date: today, count: next }),
    );
    return { count: next, limit, over: next > limit };
  } catch {
    return { count: 0, limit, over: false };
  }
}

export function ResultViewer({ result, onReset }: Props) {
  const [busyZip, setBusyZip] = useState(false);
  const [usage] = useState(() => bumpUsage());

  const zoomed = useMemo(() => {
    const out: Record<number, HTMLCanvasElement> = {};
    for (const s of PREVIEW_SIZES) {
      const src = result.sizes[s];
      const zoom = document.createElement("canvas");
      zoom.width = s * 2;
      zoom.height = s * 2;
      const ctx = zoom.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, s * 2, s * 2);
      out[s] = zoom;
    }
    return out;
  }, [result]);

  useEffect(() => {
    const url = result.originalUrl;
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
  }, [result.originalUrl]);

  // Fire `free_limit_hit` once when the user crosses the daily quota.
  useEffect(() => {
    if (usage.over) {
      track("free_limit_hit", { count: usage.count, limit: usage.limit });
    }
  }, [usage]);

  async function downloadOne(size: number, source: "preview_card" | "size_bar") {
    const canvas = result.sizes[size];
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autocropper-${size}x${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
    track("download_clicked", { format: "png", mode: "single", num_files: 1, size });
    track("download_click", { size, source });
  }

  async function downloadZip() {
    if (busyZip) return;
    const t0 = performance.now();
    track("download_clicked", {
      format: "zip",
      mode: "zip",
      // Every preset size plus the full-resolution source PNG.
      num_files: TARGET_SIZES.length + 1,
    });
    track("zip_download_click", {
      count: TARGET_SIZES.length,
      sizes: TARGET_SIZES.join(","),
    });
    setBusyZip(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const s of TARGET_SIZES) {
        const blob = await canvasToBlob(result.sizes[s]);
        zip.file(`autocropper-${s}x${s}.png`, blob);
      }
      const fullBlob = await canvasToBlob(result.squareCanvas);
      zip.file("autocropper-source.png", fullBlob);

      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = "autocropper-icons.zip";
      a.click();
      URL.revokeObjectURL(url);
      track("zip_download_complete", {
        count: TARGET_SIZES.length,
        ms: Math.round(performance.now() - t0),
        size_kb: Math.round(out.size / 1024),
      });
    } finally {
      setBusyZip(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
            Done
          </p>
          <h3 className="text-2xl font-semibold tracking-tight">
            Your icon set is ready
          </h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--color-fg-muted)]">
          <span>
            Processed in{" "}
            <span className="text-[var(--color-fg)] font-semibold tabular-nums">
              {result.durationMs.toFixed(0)} ms
            </span>
          </span>
          <span aria-hidden>·</span>
          <span>
            {result.originalWidth}×{result.originalHeight} → {result.bbox.w}×{result.bbox.h}
          </span>
        </div>
      </div>

      <BeforeAfter
        originalUrl={result.originalUrl}
        processedCanvas={result.squareCanvas}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {PREVIEW_SIZES.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold tabular-nums">
                {s}×{s}
              </span>
              <button
                type="button"
                onClick={() => downloadOne(s, "preview_card")}
                aria-label={`Download ${s}×${s} PNG`}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium hover:border-[var(--color-fg-muted)]"
              >
                <Download className="h-3 w-3" />
                PNG
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CanvasView source={result.sizes[s]} className="aspect-square" />
              <CanvasView source={zoomed[s]} className="aspect-square" pixelated />
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
              actual · 2× zoom
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">Halo test</h4>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Clean edges on white means no leftover background color.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[16, 48, 128, 256].map((s) => (
            <CanvasView
              key={s}
              source={result.sizes[s] ?? result.sizes[128]}
              className="aspect-square"
              background="white"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {TARGET_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => downloadOne(s, "size_bar")}
              className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium tabular-nums hover:border-[var(--color-fg-muted)]"
            >
              {s}px
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              track("tool_reset", { had_result: true });
              onReset();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:border-[var(--color-fg-muted)]"
          >
            <RefreshCw className="h-4 w-4" />
            New logo
          </button>
          <button
            type="button"
            onClick={downloadZip}
            disabled={busyZip}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-fg)] px-3 py-2 text-sm font-medium text-[var(--color-bg)] hover:opacity-90 disabled:opacity-50"
          >
            <Package className="h-4 w-4" />
            {busyZip ? "Zipping…" : "Download all (ZIP)"}
          </button>
        </div>
      </div>

      {usage.over ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          You&apos;ve hit the free tier limit ({usage.limit} logos / day). Keep
          going with{" "}
          <a
            href="#pricing"
            onClick={() =>
              track("cta_click", { cta: "upgrade_pro", location: "limit_banner" })
            }
            className="font-medium underline underline-offset-2"
          >
            Autocropper Pro
          </a>
          {" "}for unlimited usage.
        </div>
      ) : (
        <p className="text-xs text-[var(--color-fg-subtle)]" suppressHydrationWarning>
          Free tier: {usage.count} of {usage.limit} logos used today.
        </p>
      )}
    </motion.div>
  );
}
