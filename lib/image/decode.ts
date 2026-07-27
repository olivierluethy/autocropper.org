/**
 * Tiered image decode → one normalized internal representation.
 *
 * The rest of the pipeline should never know the input format. Everything here
 * funnels an arbitrary user file down to straight RGBA `ImageData`-shaped bytes,
 * upright, colour-managed by the browser to the display, and capped in size.
 *
 * Tiers:
 *   1. Native `createImageBitmap` — PNG/JPEG/WebP/GIF/BMP/AVIF/ICO. Fastest.
 *   2. Lazy WASM/JS decoders, fetched only when that format actually arrives —
 *      HEIC/HEIF (libheif), TIFF (utif2), PSD (ag-psd). Zero main-bundle cost.
 *   3. SVG vector path — sanitize, then rasterize through a secure-static `<img>`.
 *   4. Graceful, specific failure — never a bare "unsupported file type".
 *
 * Module top-level touches no browser globals (only pure imports), so pure
 * helpers like `resolveFormat` remain unit-testable under Node.
 */

import { sniffFormat, type ImageFormat } from "./sniff";
import { fitWithin, unsupportedMessage } from "./normalize";
import { parseSvgViewport, sanitizeSvg } from "./svg";

// Longest working edge. The largest icon we emit is 512 px, so ~2048 gives 4×
// oversampling — ample for a clean downscale — while keeping the pipeline well
// inside the time budget and away from iOS Safari's canvas-memory ceiling.
const MAX_EDGE_DESKTOP = 2048;
const MAX_EDGE_MOBILE = 1280;

const EXT_TO_FORMAT: Record<string, ImageFormat> = {
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
  jpe: "jpeg",
  gif: "gif",
  bmp: "bmp",
  webp: "webp",
  avif: "avif",
  heic: "heic",
  heif: "heif",
  tif: "tiff",
  tiff: "tiff",
  psd: "psd",
  pdf: "pdf",
  ico: "ico",
  svg: "svg",
  jxl: "jxl",
  jp2: "jp2",
};

const MIME_TO_FORMAT: Record<string, ImageFormat> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/x-ms-bmp": "bmp",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/tiff": "tiff",
  "image/vnd.adobe.photoshop": "psd",
  "application/pdf": "pdf",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/svg+xml": "svg",
  "image/jxl": "jxl",
  "image/jp2": "jp2",
};

/**
 * Reconcile the magic-byte result with the file's MIME/extension. Magic bytes
 * win outright; the hints only rescue a guess when the signature is unknown.
 */
export function resolveFormat(
  sniffed: ImageFormat,
  mime: string,
  filename: string,
): ImageFormat {
  if (sniffed !== "unknown") return sniffed;
  const ext = /\.([a-z0-9]+)$/i.exec(filename)?.[1]?.toLowerCase();
  if (ext && EXT_TO_FORMAT[ext]) return EXT_TO_FORMAT[ext];
  const m = mime.toLowerCase();
  if (MIME_TO_FORMAT[m]) return MIME_TO_FORMAT[m];
  return "unknown";
}

/* ------------------------------------------------------------------ */
/* Result shape                                                        */
/* ------------------------------------------------------------------ */

export interface SvgVectorSource {
  /** Sanitized SVG markup, ready to re-rasterize at any size (Phase 2.9 hook). */
  svg: string;
  width: number;
  height: number;
}

export interface DecodedImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  /** True decoded dimensions before any working-resolution cap was applied. */
  sourceWidth: number;
  sourceHeight: number;
  format: ImageFormat;
  /** True when we converted internally (non-native decoder), for a quiet UI note. */
  converted: boolean;
  /** Short, non-blocking note, e.g. "Converted from HEIC". */
  note?: string;
  /** Present for SVG input — enables per-size vector rendering downstream. */
  vector?: SvgVectorSource;
}

/* ------------------------------------------------------------------ */
/* Browser helpers (only called at runtime, never at import time)      */
/* ------------------------------------------------------------------ */

function maxEdgeForDevice(): number {
  if (typeof navigator !== "undefined") {
    // deviceMemory is a coarse hint; small screens also imply tighter limits.
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const smallScreen =
      typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 500;
    if ((mem != null && mem <= 4) || smallScreen) return MAX_EDGE_MOBILE;
  }
  return MAX_EDGE_DESKTOP;
}

function newCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Draw a decoded source into a (possibly downscaled) canvas and read RGBA. */
function drawToImageData(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxEdge: number,
): { data: Uint8ClampedArray; width: number; height: number; sourceWidth: number; sourceHeight: number } {
  const fit = fitWithin(srcW, srcH, maxEdge);
  const canvas = newCanvas(fit.width, fit.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, fit.width, fit.height);
  const id = ctx.getImageData(0, 0, fit.width, fit.height);
  return { data: id.data, width: fit.width, height: fit.height, sourceWidth: srcW, sourceHeight: srcH };
}

/** Wrap raw RGBA (from utif2/ag-psd) as normalized data, downscaling if needed. */
function rgbaToImageData(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  maxEdge: number,
): { data: Uint8ClampedArray; width: number; height: number; sourceWidth: number; sourceHeight: number } {
  const fit = fitWithin(w, h, maxEdge);
  if (fit.scale === 1) return { data: rgba, width: w, height: h, sourceWidth: w, sourceHeight: h };
  // Over the cap: paint full-res then let the canvas downscale. Copy into a
  // fresh ImageData so the backing store is a plain ArrayBuffer.
  const id = new ImageData(w, h);
  id.data.set(rgba);
  const full = newCanvas(w, h);
  full.getContext("2d")!.putImageData(id, 0, 0);
  return drawToImageData(full, w, h, maxEdge);
}

/* ------------------------------------------------------------------ */
/* Tier 1 — native                                                     */
/* ------------------------------------------------------------------ */

async function decodeNative(blob: Blob, maxEdge: number) {
  // `imageOrientation: 'from-image'` applies EXIF rotation up front so nothing
  // downstream has to know about orientation flags (JPEG/HEIC selfies etc.).
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  try {
    return drawToImageData(bitmap, bitmap.width, bitmap.height, maxEdge);
  } finally {
    bitmap.close();
  }
}

/* ------------------------------------------------------------------ */
/* Tier 2 — lazy decoders                                              */
/* ------------------------------------------------------------------ */

async function decodeHeic(blob: Blob, maxEdge: number) {
  const { heicTo } = await import("heic-to");
  const bitmap = await heicTo({ blob, type: "bitmap" });
  try {
    return drawToImageData(bitmap, bitmap.width, bitmap.height, maxEdge);
  } finally {
    bitmap.close();
  }
}

interface UtifIfd {
  width: number;
  height: number;
  [k: string]: unknown;
}
interface UtifModule {
  decode(buf: ArrayBuffer): UtifIfd[];
  decodeImage(buf: ArrayBuffer, ifd: UtifIfd, ifds: UtifIfd[]): void;
  toRGBA8(ifd: UtifIfd): Uint8Array;
}

async function decodeTiff(blob: Blob, maxEdge: number) {
  const UTIF = (await import("utif2")).default as unknown as UtifModule;
  const buf = await blob.arrayBuffer();
  const ifds = UTIF.decode(buf);
  if (!ifds.length) throw new Error("Empty TIFF");
  // Pick the largest page (thumbnails are common as page 0 in some exports).
  let best = ifds[0];
  for (const ifd of ifds) {
    UTIF.decodeImage(buf, ifd, ifds);
    if (ifd.width * ifd.height > best.width * best.height) best = ifd;
  }
  const rgba = new Uint8ClampedArray(UTIF.toRGBA8(best).buffer);
  const pageNote = ifds.length > 1 ? ` (largest of ${ifds.length} pages)` : "";
  return {
    ...rgbaToImageData(rgba, best.width, best.height, maxEdge),
    note: `Converted from TIFF${pageNote}`,
  };
}

async function decodePsd(blob: Blob, maxEdge: number) {
  const { readPsd } = await import("ag-psd");
  const psd = readPsd(await blob.arrayBuffer(), {
    skipLayerImageData: true,
    skipThumbnail: true,
  });
  if (!psd.canvas) throw new Error("PSD has no composite image");
  const ctx = psd.canvas.getContext("2d")!;
  const id = ctx.getImageData(0, 0, psd.width, psd.height);
  return {
    ...rgbaToImageData(id.data, psd.width, psd.height, maxEdge),
    note: "Flattened from PSD",
  };
}

/* ------------------------------------------------------------------ */
/* Tier 3 — SVG vector                                                 */
/* ------------------------------------------------------------------ */

/** Ensure the root <svg> carries explicit px width/height for standalone render. */
function ensureSvgSize(svg: string, w: number, h: number): string {
  const hasW = /<svg\b[^>]*\swidth\s*=/i.test(svg);
  const hasH = /<svg\b[^>]*\sheight\s*=/i.test(svg);
  if (hasW && hasH) return svg;
  return svg.replace(/<svg\b/i, `<svg width="${w}" height="${h}"`);
}

/** Render sanitized SVG markup to RGBA at an explicit pixel size. */
export function renderSvg(
  svg: string,
  width: number,
  height: number,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    // Secure static mode: no scripts run, external subresources blocked,
    // same-origin blob keeps the canvas untainted.
    img.decoding = "async";
    img.onload = () => {
      try {
        const canvas = newCanvas(width, height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        const id = ctx.getImageData(0, 0, width, height);
        resolve({ data: id.data, width, height });
      } catch (e) {
        reject(e instanceof Error ? e : new Error("SVG render failed"));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render this SVG."));
    };
    img.src = url;
  });
}

/** Strip the outer <svg> wrapper, keeping only its children. */
function innerSvg(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/i, "").replace(/<\/svg\s*>\s*$/i, "");
}

/**
 * Vector shortcut (spec 2.9): render a specific user-space region of an SVG at
 * an exact pixel size, straight from the vector — so every icon size is crisp at
 * its native resolution instead of a single raster downscaled. `viewBox` is the
 * content region (already padded/squared) in the SVG's own coordinates.
 */
export function renderVectorRegion(
  svg: string,
  viewBox: { x: number; y: number; w: number; h: number },
  size: number,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const wrapped =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}">${innerSvg(svg)}</svg>`;
  return renderSvg(wrapped, size, size);
}

async function decodeSvg(blob: Blob, maxEdge: number): Promise<DecodedImage> {
  const raw = await blob.text();
  const clean = sanitizeSvg(raw);
  const { width: vw, height: vh } = parseSvgViewport(clean);
  const sized = ensureSvgSize(clean, vw, vh);

  // Rasterize generously (≥1024 longest edge) so downstream downscales stay
  // crisp; the vector source is kept for the Phase 2.9 per-size render path.
  const target = fitWithin(
    Math.max(vw, 1024 * (vw / Math.max(vw, vh))),
    Math.max(vh, 1024 * (vh / Math.max(vw, vh))),
    maxEdge,
  );
  const rendered = await renderSvg(sized, target.width, target.height);
  return {
    data: rendered.data,
    width: rendered.width,
    height: rendered.height,
    sourceWidth: vw,
    sourceHeight: vh,
    format: "svg",
    converted: false,
    note: "Vector (SVG)",
    vector: { svg: sized, width: vw, height: vh },
  };
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

const NATIVE: ReadonlySet<ImageFormat> = new Set([
  "png",
  "jpeg",
  "gif",
  "bmp",
  "webp",
  "avif",
  "ico",
]);

export async function decodeImage(
  file: Blob & { name?: string; type?: string },
  opts: { maxEdge?: number } = {},
): Promise<DecodedImage> {
  const maxEdge = opts.maxEdge ?? maxEdgeForDevice();

  // Sniff from the first bytes; reconcile with the (untrusted) MIME/extension.
  const header = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const sniffed = sniffFormat(header);
  const format = resolveFormat(sniffed, file.type || "", file.name || "");

  // SVG first — it must go down the vector path, never a raster decoder.
  if (format === "svg") return decodeSvg(file, maxEdge);

  if (format === "heic" || format === "heif") {
    const r = await decodeHeic(file, maxEdge);
    return { ...r, format, converted: true, note: "Converted from HEIC" };
  }
  if (format === "tiff") {
    const r = await decodeTiff(file, maxEdge);
    return { ...r, format, converted: true };
  }
  if (format === "psd") {
    const r = await decodePsd(file, maxEdge);
    return { ...r, format, converted: true };
  }

  // Explicitly-deferred formats get a specific message rather than a decode attempt.
  if (format === "pdf" || format === "jxl" || format === "jp2") {
    throw new Error(unsupportedMessage(format));
  }

  // Native tier — and a last-ditch native attempt for unknown signatures, since
  // the browser can sometimes decode things our sniffer doesn't recognise.
  if (NATIVE.has(format) || format === "unknown") {
    try {
      const r = await decodeNative(file, maxEdge);
      return { ...r, format, converted: false };
    } catch {
      throw new Error(unsupportedMessage("unknown"));
    }
  }

  throw new Error(unsupportedMessage(format));
}
