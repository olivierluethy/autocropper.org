"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

interface Props {
  originalUrl: string;
  processedCanvas: HTMLCanvasElement;
}

export function BeforeAfter({ originalUrl, processedCanvas }: Props) {
  const [pos, setPos] = useState(50);
  const wrap = useRef<HTMLDivElement>(null);
  const procRef = useRef<HTMLCanvasElement>(null);
  // Fire `before_after_interact` exactly once per mount, the first time the
  // slider moves more than ~5 % from its initial position.
  const interactedRef = useRef(false);

  useEffect(() => {
    const c = procRef.current;
    if (!c) return;
    c.width = processedCanvas.width;
    c.height = processedCanvas.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(processedCanvas, 0, 0);
  }, [processedCanvas]);

  function commitPos(next: number) {
    setPos(next);
    if (!interactedRef.current && Math.abs(next - 50) > 5) {
      interactedRef.current = true;
      track("before_after_interact", { final_position: Math.round(next) });
    }
  }

  const dragging = useRef(false);

  function handleMove(clientX: number) {
    const node = wrap.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    commitPos(Math.max(0, Math.min(100, x)));
  }

  return (
    <div
      ref={wrap}
      // Masked in session replay: this shows the user's own uploaded image.
      data-ph-no-capture
      // `touch-action: none` + pointer capture: dragging the handle moves the
      // slider instead of scrolling the page, and works for touch/mouse/pen with
      // one code path.
      style={{ touchAction: "none" }}
      className="ph-no-capture relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] select-none touch-none cursor-ew-resize"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        handleMove(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) handleMove(e.clientX);
      }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
      role="slider"
      aria-label="Before / after comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") commitPos(Math.max(0, pos - 5));
        if (e.key === "ArrowRight") commitPos(Math.min(100, pos + 5));
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalUrl}
          alt="Original logo"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>

      <div
        className="absolute inset-0 checker"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas
            ref={procRef}
            className="block max-h-full max-w-full object-contain"
            aria-label="Cleaned logo"
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--color-fg)]/70"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] text-[var(--color-fg)] shadow-md text-sm font-medium">
          ⇆
        </div>
      </div>

      <span className="absolute left-3 top-3 rounded-md bg-[var(--color-bg-elev)]/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-fg-muted)]">
        Original
      </span>
      <span className="absolute right-3 top-3 rounded-md bg-[var(--color-bg-elev)]/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-fg-muted)]">
        Autocropper
      </span>
    </div>
  );
}
