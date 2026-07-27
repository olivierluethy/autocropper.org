import type { ImageFormat } from "./sniff";

/**
 * Cap the working resolution by the longest edge. Large inputs (8000 px phone
 * exports, scanner TIFFs) are downscaled defensively before processing: iOS
 * Safari has a hard canvas-memory ceiling and will crash the tab otherwise, and
 * the icon outputs top out at 512 px so full resolution buys nothing downstream.
 * Aspect ratio is preserved; dimensions are floored to ≥ 1 px.
 */
export function fitWithin(
  w: number,
  h: number,
  maxEdge: number,
): { width: number; height: number; scale: number } {
  const longest = Math.max(w, h);
  if (longest <= maxEdge) return { width: w, height: h, scale: 1 };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
    scale,
  };
}

/**
 * Tier-4 graceful failure copy. Never a generic "upload failed" — name the
 * format we detected and tell the user exactly how to get unstuck.
 */
export function unsupportedMessage(format: ImageFormat): string {
  switch (format) {
    case "pdf":
      return "This looks like a PDF. Export the artwork as PNG or JPEG (or an SVG) and try again.";
    case "jxl":
      return "This looks like a JPEG XL (.jxl) file. Export it as PNG or JPEG and try again.";
    case "jp2":
      return "This looks like a JPEG 2000 (.jp2) file. Export it as PNG or JPEG and try again.";
    default:
      return "That file doesn't look like an image we can read. Try exporting it as PNG, JPEG, or SVG.";
  }
}
