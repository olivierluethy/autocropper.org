"use client";

import { useEffect, useRef } from "react";

interface Props {
  source: HTMLCanvasElement;
  className?: string;
  background?: "transparent" | "white" | "black";
  pixelated?: boolean;
  ariaLabel?: string;
}

/**
 * Renders an `HTMLCanvasElement` produced by the pipeline without mutating it.
 * We draw the bitmap into a local `<canvas>` we own, so React's
 * "props are immutable" rule isn't violated and the source canvas can be
 * reused freely (e.g. for ZIP export).
 */
export function CanvasView({
  source,
  className,
  background = "transparent",
  pixelated,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = !pixelated;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(source, 0, 0);
  }, [source, pixelated]);

  const bgClass =
    background === "white"
      ? "bg-white"
      : background === "black"
        ? "bg-black"
        : "checker";

  return (
    // `ph-no-capture` keeps the user's own image out of PostHog session
    // replays — the pipeline never uploads it, and neither should analytics.
    <div
      data-ph-no-capture
      className={[
        "ph-no-capture flex items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)]",
        bgClass,
        className || "",
      ].join(" ")}
    >
      <canvas
        ref={ref}
        aria-label={ariaLabel}
        className={[
          "block max-w-full h-auto",
          pixelated ? "[image-rendering:pixelated]" : "",
        ].join(" ")}
      />
    </div>
  );
}
