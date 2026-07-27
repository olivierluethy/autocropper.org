/**
 * Autocropper logo processing pipeline.
 *
 * Pure client-side. Canvas + ImageData + Uint8Array only.
 *
 * Mirrors the reference OpenCV (Python) implementation step by step:
 *   1. Decode the image.
 *   2. If the image already has a non-opaque alpha channel, use it.
 *      Otherwise sample 20×20 patches from the four corners and compute
 *      a per-channel median + per-channel std (averaged across channels).
 *   3. Build a hard binary mask (`L1 distance > threshold`) and a soft
 *      gradient mask (`(diff − threshold) / transition * 255`).
 *      `threshold = max(20, std * 3.5)` and `transition = max(15, threshold/2)`.
 *   4. Morphological close (3×3, 1 iteration) on **both** masks.
 *   5. 8-connectivity connected components on the hard mask. Keep all
 *      components with area ≥ max(20, H·W·5e-5) and union their bboxes.
 *   6. Crop the RGB and the soft mask to that bbox.
 *   7. Color decontamination by alpha:
 *        decontaminated = (C − BG·(1−α)) / max(α, 0.01)
 *        final          =  C · α  +  decontaminated · (1−α)
 *   8. Place the cropped RGBA on a `max(w, h)` square transparent canvas
 *      (no extra padding).
 *   9. Lanczos-4 resample to each requested target size.
 *  10. Export PNG via `canvas.toBlob`.
 */

import type { ImageFormat } from "./image/sniff";

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BgInfo {
  r: number;
  g: number;
  b: number;
  std: number;
}

/**
 * Canvas-free RGBA image. The cutout algorithm operates purely on these so it
 * runs identically in the browser and under Node (for the quality harness and
 * unit tests) — canvases only appear at the I/O edges (decode in, PNG out).
 */
export interface RawImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function rawImage(width: number, height: number): RawImage {
  return { data: new Uint8ClampedArray(width * height * 4), width, height };
}

export interface ProcessedResult {
  originalUrl: string;
  /** Dimensions actually processed (after any working-resolution cap). */
  originalWidth: number;
  originalHeight: number;
  /** True decoded dimensions before capping — what the user actually uploaded. */
  sourceWidth: number;
  sourceHeight: number;
  /** Detected input format (magic-byte based), for the "understood" UI line. */
  format: ImageFormat;
  /** True when we converted internally (HEIC/TIFF/PSD) — drives a quiet note. */
  converted: boolean;
  /** Short, non-blocking note, e.g. "Converted from HEIC". */
  note?: string;
  croppedCanvas: HTMLCanvasElement;
  squareCanvas: HTMLCanvasElement;
  sizes: Record<number, HTMLCanvasElement>;
  bbox: BBox;
  bg: BgInfo | null;
  components: number;
  durationMs: number;
}

export const TARGET_SIZES = [16, 32, 48, 64, 128, 256, 512] as const;
export const PREVIEW_SIZES = [16, 48, 128] as const;

const CORNER_PATCH = 20;
const LANCZOS_A = 4;

/* ------------------------------------------------------------------ */
/* Image decode                                                        */
/* ------------------------------------------------------------------ */

export function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}

/* ------------------------------------------------------------------ */
/* Statistics helpers                                                  */
/* ------------------------------------------------------------------ */

function median(arr: number[]): number {
  arr.sort((a, b) => a - b);
  const n = arr.length;
  return n % 2 === 0 ? Math.floor((arr[n / 2 - 1] + arr[n / 2]) / 2) : arr[(n - 1) >> 1];
}

function stdOf(arr: number[]): number {
  const n = arr.length;
  if (n === 0) return 0;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += arr[i];
  mean /= n;
  let sq = 0;
  for (let i = 0; i < n; i++) {
    const d = arr[i] - mean;
    sq += d * d;
  }
  return Math.sqrt(sq / n);
}

/* ------------------------------------------------------------------ */
/* Step 2: Corner sampling → per-channel median + mean of channel-std  */
/* ------------------------------------------------------------------ */

export function sampleCorners(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): BgInfo {
  const patch = Math.min(CORNER_PATCH, Math.max(2, Math.floor(Math.min(w, h) / 4)));
  const corners: Array<[number, number]> = [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch],
  ];
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (const [x0, y0] of corners) {
    for (let y = y0; y < y0 + patch; y++) {
      const row = y * w;
      for (let x = x0; x < x0 + patch; x++) {
        const i = (row + x) * 4;
        rs.push(data[i]);
        gs.push(data[i + 1]);
        bs.push(data[i + 2]);
      }
    }
  }
  const r = median(rs.slice());
  const g = median(gs.slice());
  const b = median(bs.slice());
  // std per channel, then mean of those (matches Python `np.std(..., axis=0).mean()`).
  const std = (stdOf(rs) + stdOf(gs) + stdOf(bs)) / 3;
  return { r, g, b, std };
}

/* ------------------------------------------------------------------ */
/* Perceptual colour (CIELAB / ΔE) for background clustering (spec 2.1) */
/* ------------------------------------------------------------------ */

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

/** sRGB byte triple → CIELAB (D65). */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b);
  const X = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047;
  const Y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const Z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function deltaE(a: [number, number, number], b: [number, number, number]): number {
  const dL = a[0] - b[0], da = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

export interface BgCluster {
  r: number;
  g: number;
  b: number;
  count: number;
  std: number;
}

/**
 * Sample the border RING (not just corners) and cluster it in CIELAB, so an
 * image can have more than one background colour — a split background, a framed
 * image, a screenshot with UI chrome, or a 1px border frame. The dominant
 * cluster is the primary background; smaller clusters (e.g. a thin frame) are
 * still treated as removable background downstream. Tolerance is derived from
 * the ring's own noise so JPEG-compressed backgrounds aren't over-segmented.
 */
export function sampleBorderClusters(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  ring = 3,
): { clusters: BgCluster[]; tol: number } {
  const r = Math.min(ring, Math.max(1, Math.floor(Math.min(w, h) / 6)));
  const samples: Array<[number, number, number]> = [];
  const push = (x: number, y: number) => {
    const p = (y * w + x) * 4;
    samples.push([data[p], data[p + 1], data[p + 2]]);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < r || y < r || x >= w - r || y >= h - r) push(x, y);
    }
  }

  // Greedy ΔE clustering. CLUSTER_DE separates visibly different colours while
  // keeping compression noise inside one cluster.
  const CLUSTER_DE = 10;
  interface Acc { L: number; a: number; bb: number; sr: number; sg: number; sb: number; n: number; }
  const accs: Acc[] = [];
  for (const [cr, cg, cb] of samples) {
    const lab = rgbToLab(cr, cg, cb);
    let best = -1, bestDE = Infinity;
    for (let i = 0; i < accs.length; i++) {
      const c = accs[i];
      const de = deltaE(lab, [c.L / c.n, c.a / c.n, c.bb / c.n]);
      if (de < bestDE) { bestDE = de; best = i; }
    }
    if (best >= 0 && bestDE < CLUSTER_DE) {
      const c = accs[best];
      c.L += lab[0]; c.a += lab[1]; c.bb += lab[2];
      c.sr += cr; c.sg += cg; c.sb += cb; c.n++;
    } else {
      accs.push({ L: lab[0], a: lab[1], bb: lab[2], sr: cr, sg: cg, sb: cb, n: 1 });
    }
  }

  // Keep clusters that are a meaningful share of the ring (drops stray noise).
  const minCount = Math.max(4, Math.floor(samples.length * 0.02));
  let clusters: BgCluster[] = accs
    .filter((c) => c.n >= minCount)
    .map((c) => ({ r: Math.round(c.sr / c.n), g: Math.round(c.sg / c.n), b: Math.round(c.sb / c.n), count: c.n, std: 0 }))
    .sort((a, b) => b.count - a.count);
  if (clusters.length === 0 && accs.length) {
    const c = accs.reduce((a, b) => (b.n > a.n ? b : a));
    clusters = [{ r: Math.round(c.sr / c.n), g: Math.round(c.sg / c.n), b: Math.round(c.sb / c.n), count: c.n, std: 0 }];
  }

  // Distinguish a thin FRAME (real background) from the MARK touching the edge.
  // A frame lives only in the outer ring; the mark extends well inward. So for
  // each secondary cluster, sample a band just inside the ring — if the colour
  // persists there, it's the mark and must NOT be treated as background.
  if (clusters.length > 1) {
    const inLab = clusters.map((c) => rgbToLab(c.r, c.g, c.b));
    let innerTotal = 0;
    const innerHit = new Array(clusters.length).fill(0);
    const d0 = r, d1 = Math.min(r + 6, Math.floor(Math.min(w, h) / 2));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dEdge = Math.min(x, y, w - 1 - x, h - 1 - y);
        if (dEdge < d0 || dEdge >= d1) continue;
        innerTotal++;
        const p = (y * w + x) * 4;
        const lab = rgbToLab(data[p], data[p + 1], data[p + 2]);
        for (let ci = 1; ci < clusters.length; ci++) {
          if (deltaE(lab, inLab[ci]) < CLUSTER_DE) innerHit[ci]++;
        }
      }
    }
    clusters = clusters.filter((_c, ci) =>
      ci === 0 || innerHit[ci] < Math.max(2, innerTotal * 0.02),
    );
  }

  // Adaptive tolerance from within-dominant-cluster spread.
  const dom = clusters[0];
  const domLab = rgbToLab(dom.r, dom.g, dom.b);
  let se = 0, ne = 0;
  for (const [cr, cg, cb] of samples) {
    const de = deltaE(rgbToLab(cr, cg, cb), domLab);
    if (de < CLUSTER_DE) { se += de * de; ne++; }
  }
  const noise = ne ? Math.sqrt(se / ne) : 0;
  const tol = Math.max(8, noise * 3);
  return { clusters, tol };
}

/**
 * Foreground mask (1 = foreground) = pixels whose CIELAB ΔE to the NEAREST
 * background cluster exceeds `tol`. Multi-cluster so a differently-coloured
 * frame or a split background is all recognised as background.
 */
export function buildBgMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  clusters: BgCluster[],
  tol: number,
): Uint8Array {
  const n = w * h;
  const labs = clusters.map((c) => rgbToLab(c.r, c.g, c.b));

  // Decide foreground-vs-background per QUANTIZED colour (6 bits/channel) into a
  // 262k lookup, so the expensive sRGB→Lab conversion runs ~262k times instead
  // of once per pixel. At 16 MP that's a ~50× speedup with no visible change
  // (the quantization step is far below the ΔE tolerance).
  const lut = new Uint8Array(1 << 18); // 64³
  for (let ri = 0; ri < 64; ri++) {
    for (let gi = 0; gi < 64; gi++) {
      for (let bi = 0; bi < 64; bi++) {
        const lab = rgbToLab((ri << 2) | 2, (gi << 2) | 2, (bi << 2) | 2);
        let minDE = Infinity;
        for (const cl of labs) {
          const de = deltaE(lab, cl);
          if (de < minDE) minDE = de;
        }
        lut[(ri << 12) | (gi << 6) | bi] = minDE > tol ? 1 : 0;
      }
    }
  }

  const hard = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    hard[i] = lut[((data[p] >> 2) << 12) | ((data[p + 1] >> 2) << 6) | (data[p + 2] >> 2)];
  }
  return hard;
}

/* ------------------------------------------------------------------ */
/* Alpha channel detection                                             */
/* ------------------------------------------------------------------ */

function alphaIsMeaningful(data: Uint8ClampedArray): boolean {
  // True if any pixel's alpha is below 250 — matches the Python check.
  for (let p = 3; p < data.length; p += 4) {
    if (data[p] < 250) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Step 3: Hard + soft masks (L1 distance, transition formula)         */
/* ------------------------------------------------------------------ */

export function buildMasks(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  bg: BgInfo,
): { hard: Uint8Array; soft: Uint8Array; threshold: number } {
  const n = w * h;
  const hard = new Uint8Array(n);
  const soft = new Uint8Array(n);

  const threshold = Math.max(20, Math.floor(bg.std * 3.5));
  const transition = Math.max(15, threshold >> 1);

  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const dr = data[p] - bg.r;
    const dg = data[p + 1] - bg.g;
    const db = data[p + 2] - bg.b;
    // L1 distance — exactly what Python computes (`np.sum(|diff|, axis=2)`).
    const diffSum = (dr < 0 ? -dr : dr) + (dg < 0 ? -dg : dg) + (db < 0 ? -db : db);

    hard[i] = diffSum > threshold ? 1 : 0;

    let s = ((diffSum - threshold) / transition) * 255;
    if (s < 0) s = 0;
    else if (s > 255) s = 255;
    soft[i] = s;
  }
  return { hard, soft, threshold };
}

/* ------------------------------------------------------------------ */
/* Step 4: Morphological close — works for both binary and grayscale   */
/* ------------------------------------------------------------------ */

function dilate3x3(src: Uint8Array, w: number, h: number): Uint8Array {
  const dst = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    const y0 = y > 0 ? y - 1 : 0;
    const y1 = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const x0 = x > 0 ? x - 1 : 0;
      const x1 = x < w - 1 ? x + 1 : w - 1;
      let m = 0;
      for (let yy = y0; yy <= y1; yy++) {
        const row = yy * w;
        for (let xx = x0; xx <= x1; xx++) {
          const v = src[row + xx];
          if (v > m) m = v;
        }
      }
      dst[y * w + x] = m;
    }
  }
  return dst;
}

function erode3x3(src: Uint8Array, w: number, h: number): Uint8Array {
  const dst = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    const y0 = y > 0 ? y - 1 : 0;
    const y1 = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const x0 = x > 0 ? x - 1 : 0;
      const x1 = x < w - 1 ? x + 1 : w - 1;
      let m = 255;
      for (let yy = y0; yy <= y1; yy++) {
        const row = yy * w;
        for (let xx = x0; xx <= x1; xx++) {
          const v = src[row + xx];
          if (v < m) m = v;
        }
      }
      dst[y * w + x] = m;
    }
  }
  return dst;
}

export function morphClose(
  src: Uint8Array,
  w: number,
  h: number,
): Uint8Array {
  return erode3x3(dilate3x3(src, w, h), w, h);
}

/* ------------------------------------------------------------------ */
/* Step 5: 8-connectivity components → union bbox of all significant   */
/* ------------------------------------------------------------------ */

export function unionBBox(
  mask: Uint8Array,
  w: number,
  h: number,
): { bbox: BBox | null; count: number } {
  const minArea = Math.max(20, Math.floor(w * h * 0.00005));
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);

  let unionMinX = w;
  let unionMaxX = -1;
  let unionMinY = h;
  let unionMaxY = -1;
  let kept = 0;

  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || visited[i]) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = i;
    visited[i] = 1;

    let minX = w, maxX = 0, minY = h, maxY = 0;
    let size = 0;

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % w;
      const y = (idx - x) / w;
      size++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      // 8-connectivity
      const xLeft = x > 0;
      const xRight = x < w - 1;
      const yTop = y > 0;
      const yBot = y < h - 1;
      if (xLeft) {
        const n = idx - 1;
        if (mask[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
      }
      if (xRight) {
        const n = idx + 1;
        if (mask[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
      }
      if (yTop) {
        const n = idx - w;
        if (mask[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
        if (xLeft) {
          const nn = idx - w - 1;
          if (mask[nn] && !visited[nn]) { visited[nn] = 1; queue[tail++] = nn; }
        }
        if (xRight) {
          const nn = idx - w + 1;
          if (mask[nn] && !visited[nn]) { visited[nn] = 1; queue[tail++] = nn; }
        }
      }
      if (yBot) {
        const n = idx + w;
        if (mask[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
        if (xLeft) {
          const nn = idx + w - 1;
          if (mask[nn] && !visited[nn]) { visited[nn] = 1; queue[tail++] = nn; }
        }
        if (xRight) {
          const nn = idx + w + 1;
          if (mask[nn] && !visited[nn]) { visited[nn] = 1; queue[tail++] = nn; }
        }
      }
    }

    if (size >= minArea) {
      kept++;
      if (minX < unionMinX) unionMinX = minX;
      if (maxX > unionMaxX) unionMaxX = maxX;
      if (minY < unionMinY) unionMinY = minY;
      if (maxY > unionMaxY) unionMaxY = maxY;
    }
  }

  if (kept === 0) return { bbox: null, count: 0 };
  return {
    bbox: {
      x: unionMinX,
      y: unionMinY,
      w: unionMaxX - unionMinX + 1,
      h: unionMaxY - unionMinY + 1,
    },
    count: kept,
  };
}

/* ------------------------------------------------------------------ */
/* Shadow / glow removal (spec 2.4)                                     */
/* ------------------------------------------------------------------ */

/**
 * Remove soft low-alpha regions — drop shadows, outer glows, reflections — that
 * are not anchored to a solid part of the mark. At 16–48 px these read as dirt.
 *
 * A real mark has a solid core (high alpha); its anti-aliased edge sits within a
 * pixel or two of that core. A shadow/glow is soft *everywhere* and extends well
 * beyond any core. So we keep alpha only where it is within `radius` px of a
 * solid core (`alpha ≥ coreThresh`) and zero it elsewhere. Default policy is to
 * remove (spec 2.4); a "keep shadow" toggle can pass this step by.
 */
/**
 * Central-difference edge map of a single channel (luma or alpha), 1 where the
 * gradient exceeds `thresh`. Computed from the ORIGINAL image, not the matte:
 * the matte's normalization can introduce discontinuity artefacts, whereas a
 * real mark's colour/alpha edge is genuinely steep and a shadow's is genuinely
 * gentle.
 */
export function sharpEdges(
  chan: (i: number) => number,
  w: number,
  h: number,
  thresh: number,
): Uint8Array {
  const sharp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const l = x > 0 ? chan(i - 1) : chan(i);
      const r = x < w - 1 ? chan(i + 1) : chan(i);
      const u = y > 0 ? chan(i - w) : chan(i);
      const d = y < h - 1 ? chan(i + w) : chan(i);
      if (Math.max(Math.abs(r - l), Math.abs(d - u)) > thresh) sharp[i] = 1;
    }
  }
  return sharp;
}

export function suppressSoftSkirt(
  soft: Uint8Array,
  sharp: Uint8Array,
  w: number,
  h: number,
  highThresh = 200,
  margin = 3,
): Uint8Array {
  const n = soft.length;

  // Label high-alpha components; keep a component only if it contains a sharp
  // edge. A solid blob with no sharp boundary anywhere is a shadow/glow.
  const label = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  const keep: boolean[] = [];
  let next = 0;
  for (let s = 0; s < n; s++) {
    if (soft[s] < highThresh || label[s] !== -1) continue;
    const id = next++;
    let head = 0, tail = 0, hasSharp = false;
    queue[tail++] = s;
    label[s] = id;
    while (head < tail) {
      const idx = queue[head++];
      if (sharp[idx]) hasSharp = true;
      const x = idx % w;
      const y = (idx - x) / w;
      if (x > 0 && soft[idx - 1] >= highThresh && label[idx - 1] === -1) { label[idx - 1] = id; queue[tail++] = idx - 1; }
      if (x < w - 1 && soft[idx + 1] >= highThresh && label[idx + 1] === -1) { label[idx + 1] = id; queue[tail++] = idx + 1; }
      if (y > 0 && soft[idx - w] >= highThresh && label[idx - w] === -1) { label[idx - w] = id; queue[tail++] = idx - w; }
      if (y < h - 1 && soft[idx + w] >= highThresh && label[idx + w] === -1) { label[idx + w] = id; queue[tail++] = idx + w; }
    }
    keep[id] = hasSharp;
  }

  // Allowed = kept solid regions grown by `margin` to re-include their own soft
  // anti-aliased edge (which sits just outside the high-alpha core).
  let allowed: Uint8Array = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (label[i] !== -1 && keep[label[i]]) allowed[i] = 1;
  for (let r = 0; r < margin; r++) allowed = dilate3x3(allowed, w, h);

  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = allowed[i] ? soft[i] : 0;
  return out;
}

/* ------------------------------------------------------------------ */
/* Coverage matte (spec 2.3): fractional alpha from normalized distance */
/* ------------------------------------------------------------------ */

/**
 * Estimate a fractional-alpha matte from the pixel's distance to the background.
 *
 * For a pixel blended over a flat background, `C = α·F + (1−α)·B`, so
 * `‖C − B‖ = α·‖F − B‖` for any linear norm. Dividing the per-pixel distance by
 * the full foreground-to-background distance therefore recovers the true
 * coverage α — a smooth matte instead of the old hard L1 threshold. `Tfull` is
 * taken as the median distance over the *eroded interior* (pixels that are
 * definitely fully-covered foreground), which is robust to edge pixels and to a
 * multi-shade mark. Paired with `decontaminateAndCompose`, this is what removes
 * the pale/dark edge halo.
 */
export function coverageMatte(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  bg: BgInfo,
  hard: Uint8Array,
): Uint8Array {
  const n = w * h;
  const dist = (p: number) =>
    Math.abs(data[p] - bg.r) + Math.abs(data[p + 1] - bg.g) + Math.abs(data[p + 2] - bg.b);

  // Per-pixel full-coverage reference `T = ‖F − B‖`. A single global value breaks
  // multi-colour marks (a light mark next to a dark one), so we seed `T` from the
  // definite interior of each region and propagate it outward across the thin
  // unknown edge band — each edge then normalizes by its OWN foreground colour.
  const interior = erode3x3(erode3x3(hard, w, h), w, h);
  const T = new Float32Array(n);
  const idists: Array<{ i: number; d: number }> = [];
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    if (interior[i]) idists.push({ i, d: Math.max(1, dist(p)) });
  }
  // Only seed T from *strong* interior. A soft drop shadow / glow also survives
  // the hard threshold, but if it seeds its own (small) full-coverage reference
  // it normalizes to opaque and can no longer be told from the mark. Excluding
  // weak interior makes shadows inherit the nearest real mark's scale, so they
  // stay low-alpha and get removed downstream — while genuine multi-colour marks
  // (each a strong region) still seed their own scale and stay halo-free.
  const sorted = idists.map((o) => o.d).sort((a, b) => a - b);
  const strong = sorted.length ? sorted[Math.floor(sorted.length * 0.85)] : 1;
  const seedMin = 0.5 * strong;
  const dists: number[] = [];
  for (const o of idists) {
    if (o.d >= seedMin) {
      T[o.i] = o.d;
      dists.push(o.d);
    }
  }
  // Fallback reference for pixels no interior can reach (thin marks, stray edges).
  let globalT = dists.length ? median(dists.slice()) : 1;
  if (dists.length < 16) {
    // Too little interior (thin stroke): fall back to hard-foreground distances.
    const hd: number[] = [];
    for (let i = 0, p = 0; i < n; i++, p += 4) if (hard[i]) hd.push(Math.max(1, dist(p)));
    if (hd.length) globalT = median(hd.slice());
  }
  if (globalT < 1) globalT = 1;

  // Propagate T outward a few rings (covers the unknown band). "Nearest wins"
  // via max of already-assigned neighbours; regions are separated far enough
  // that a light edge never borrows a dark region's scale.
  const RINGS = 6;
  let cur = T;
  for (let pass = 0; pass < RINGS; pass++) {
    let dirty = false;
    const next = cur.slice();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (cur[idx] > 0) continue;
        let m = 0;
        if (x > 0 && cur[idx - 1] > m) m = cur[idx - 1];
        if (x < w - 1 && cur[idx + 1] > m) m = cur[idx + 1];
        if (y > 0 && cur[idx - w] > m) m = cur[idx - w];
        if (y < h - 1 && cur[idx + w] > m) m = cur[idx + w];
        if (m > 0) { next[idx] = m; dirty = true; }
      }
    }
    cur = next;
    if (!dirty) break;
  }

  const soft = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const tl = cur[i] > 0 ? cur[i] : globalT;
    let a = (dist(p) / tl) * 255;
    if (a < 0) a = 0;
    else if (a > 255) a = 255;
    soft[i] = a;
  }
  return soft;
}

/* ------------------------------------------------------------------ */
/* Robust bounding box (spec 2.5)                                       */
/* ------------------------------------------------------------------ */

interface Component {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
}

/** Euclidean gap between a component's box and another box (0 if touching). */
function boxGap(c: Component, box: BBox): number {
  const bMaxX = box.x + box.w - 1;
  const bMaxY = box.y + box.h - 1;
  const dx = Math.max(0, c.minX - bMaxX, box.x - c.maxX);
  const dy = Math.max(0, c.minY - bMaxY, box.y - c.maxY);
  return Math.hypot(dx, dy);
}

/**
 * Bounding box that is robust to specks and to over-eager area floors.
 *
 * A single leftover compression speck must not define the crop, yet a genuine
 * small detail — the dot of an `i`, a separate accent, a two-part lockup — must
 * survive. So we keep a component when it is either (a) a meaningful share of
 * the largest component's mass, or (b) small but sitting within a short gap of
 * the main mass. Everything else (distant specks) is dropped. 8-connectivity so
 * anti-aliased diagonals stay a single component.
 */
export function robustBBox(
  hard: Uint8Array,
  w: number,
  h: number,
): { bbox: BBox | null; count: number } {
  const visited = new Uint8Array(hard.length);
  const queue = new Int32Array(hard.length);
  const comps: Component[] = [];
  const TINY = 2; // ignore 1px noise outright

  for (let i = 0; i < hard.length; i++) {
    if (!hard[i] || visited[i]) continue;
    let head = 0, tail = 0;
    queue[tail++] = i;
    visited[i] = 1;
    let minX = w, maxX = 0, minY = h, maxY = 0, area = 0;
    while (head < tail) {
      const idx = queue[head++];
      const x = idx % w;
      const y = (idx - x) / w;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const nIdx = ny * w + nx;
          if (hard[nIdx] && !visited[nIdx]) { visited[nIdx] = 1; queue[tail++] = nIdx; }
        }
      }
    }
    if (area >= TINY) comps.push({ minX, maxX, minY, maxY, area });
  }

  if (comps.length === 0) return { bbox: null, count: 0 };

  const largest = comps.reduce((a, b) => (b.area > a.area ? b : a));
  const minAreaAbs = Math.max(20, Math.floor(w * h * 0.00005));
  // "Significant on its own": a real fraction of the biggest mass.
  const sigThresh = Math.max(minAreaAbs, largest.area * 0.02);
  const significant = comps.filter((c) => c.area >= sigThresh);
  const core = significant.length ? significant : [largest];

  const union = (list: Component[]): BBox => {
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (const c of list) {
      if (c.minX < x0) x0 = c.minX;
      if (c.minY < y0) y0 = c.minY;
      if (c.maxX > x1) x1 = c.maxX;
      if (c.maxY > y1) y1 = c.maxY;
    }
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  };

  const mainBox = union(core);
  // Also keep small components hugging the main mass (i-dots, accents).
  const gapPx = Math.max(8, Math.round(Math.min(w, h) * 0.04));
  const SMALL_MIN = 6;
  const kept = [...core];
  for (const c of comps) {
    if (core.includes(c)) continue;
    if (c.area >= SMALL_MIN && boxGap(c, mainBox) <= gapPx) kept.push(c);
  }

  return { bbox: union(kept), count: kept.length };
}

/* ------------------------------------------------------------------ */
/* Edge-seeded flood fill (spec 2.2)                                    */
/* ------------------------------------------------------------------ */

/**
 * Return a mask of background pixels *reachable from the image border*.
 *
 * This is the fix for the single most common broken-cutout: a global colour
 * match removes every background-coloured pixel, including the white counters
 * inside letters (o/e/a), a mascot's eye, or a roundel's inner shape. By only
 * treating border-connected background as removable, enclosed background stays
 * opaque. 4-connectivity (not 8) so a 1px diagonal touch doesn't leak the fill
 * through a corner into the interior.
 *
 * `hard[i] === 1` means foreground; background is `hard[i] === 0`.
 */
export function floodFillBackground(
  hard: Uint8Array,
  w: number,
  h: number,
): Uint8Array {
  const outside = new Uint8Array(hard.length);
  const queue = new Int32Array(hard.length);
  let head = 0;
  let tail = 0;

  const seed = (i: number) => {
    if (!hard[i] && !outside[i]) {
      outside[i] = 1;
      queue[tail++] = i;
    }
  };
  // Seed from every border pixel that is background.
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) seed(idx - 1);
    if (x < w - 1) seed(idx + 1);
    if (y > 0) seed(idx - w);
    if (y < h - 1) seed(idx + w);
  }
  return outside;
}

/**
 * Standard deviation of luminance over a subsample of the image. Used to tell a
 * near-uniform image (a solid-colour mark, or an already-tight crop with no
 * background to remove) apart from varied/photographic input. Subsampled with a
 * stride so it stays cheap on large images.
 */
export function imageLumaStd(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): number {
  const n = w * h;
  const stride = Math.max(1, Math.floor(Math.sqrt(n) / 128)); // ~cap samples
  const lumas: number[] = [];
  for (let i = 0; i < n; i += stride) {
    const p = i * 4;
    lumas.push(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
  }
  return stdOf(lumas);
}

/* ------------------------------------------------------------------ */
/* Step 7: Color decontamination blend, applied to the cropped region  */
/* ------------------------------------------------------------------ */

function decontaminateAndCompose(
  srcData: Uint8ClampedArray,
  srcW: number,
  alpha: Uint8Array,
  bbox: BBox,
  bg: BgInfo | null,
): RawImage {
  const out = rawImage(bbox.w, bbox.h);
  const od = out.data;
  for (let y = 0; y < bbox.h; y++) {
    for (let x = 0; x < bbox.w; x++) {
      const sx = bbox.x + x;
      const sy = bbox.y + y;
      const sIdx = sy * srcW + sx;
      const sp = sIdx * 4;
      const a8 = alpha[sIdx];
      const dp = (y * bbox.w + x) * 4;

      if (!bg) {
        // No decontamination — just copy RGB and use alpha as-is.
        od[dp] = srcData[sp];
        od[dp + 1] = srcData[sp + 1];
        od[dp + 2] = srcData[sp + 2];
        od[dp + 3] = a8;
        continue;
      }

      const a = a8 / 255;
      const aSafe = a < 0.01 ? 0.01 : a;
      const inv = 1 - a;

      // Recover the TRUE foreground colour: F = (C − (1−α)·B) / α. We store F
      // straight (not a blend of F with the still-contaminated C) so a mark cut
      // from white shows no pale halo when later placed on a dark surface — and
      // vice-versa. At α≈1 this is a no-op (F ≈ C); the edge band is where it
      // matters. Clamped because low-α division can overshoot the gamut.
      let fr = (srcData[sp] - bg.r * inv) / aSafe;
      let fg = (srcData[sp + 1] - bg.g * inv) / aSafe;
      let fb = (srcData[sp + 2] - bg.b * inv) / aSafe;

      if (fr < 0) fr = 0; else if (fr > 255) fr = 255;
      if (fg < 0) fg = 0; else if (fg > 255) fg = 255;
      if (fb < 0) fb = 0; else if (fb > 255) fb = 255;

      od[dp] = fr;
      od[dp + 1] = fg;
      od[dp + 2] = fb;
      od[dp + 3] = a8;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Step 8: Place crop on max(w,h) square transparent canvas            */
/* ------------------------------------------------------------------ */

/** Browser boundary: materialize a RawImage as a canvas for display/export. */
function rawToCanvas(raw: RawImage): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = raw.width;
  c.height = raw.height;
  // Copy into a fresh ImageData so the backing store is a plain ArrayBuffer.
  const id = new ImageData(raw.width, raw.height);
  id.data.set(raw.data);
  c.getContext("2d")!.putImageData(id, 0, 0);
  return c;
}

/**
 * Center a crop on a transparent square (spec 2.6). Two refinements over a plain
 * box-center paste: (1) a safe margin so the mark never touches the icon edge at
 * 16 px, and (2) centering on the ALPHA CENTROID rather than the geometric box —
 * a mark with a heavy side reads as off-centre when box-centered.
 */
export function placeOnSquare(crop: RawImage, margin = 0.08): RawImage {
  const content = Math.max(crop.width, crop.height);
  const size = Math.ceil(content / (1 - 2 * margin));
  const marginPx = Math.floor((size - content) / 2);
  const out = rawImage(size, size);

  // Alpha centroid of the crop.
  let sx = 0, sy = 0, sa = 0;
  for (let y = 0; y < crop.height; y++) {
    for (let x = 0; x < crop.width; x++) {
      const av = crop.data[(y * crop.width + x) * 4 + 3];
      if (av) { sx += x * av; sy += y * av; sa += av; }
    }
  }
  const cx = sa ? sx / sa : crop.width / 2;
  const cy = sa ? sy / sa : crop.height / 2;

  // Place so the centroid lands at the canvas center, clamped to preserve the
  // margin on every side.
  const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
  const dx = clamp(Math.round(size / 2 - cx), marginPx, size - crop.width - marginPx);
  const dy = clamp(Math.round(size / 2 - cy), marginPx, size - crop.height - marginPx);

  for (let y = 0; y < crop.height; y++) {
    const srcRow = y * crop.width * 4;
    const dstRow = ((y + dy) * size + dx) * 4;
    out.data.set(crop.data.subarray(srcRow, srcRow + crop.width * 4), dstRow);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Step 9: Lanczos-4 resampling, separable, fixed-radius (cv2 style)   */
/* ------------------------------------------------------------------ */

function lanczosKernel(x: number, a: number): number {
  if (x === 0) return 1;
  if (x <= -a || x >= a) return 0;
  const px = Math.PI * x;
  return (a * Math.sin(px) * Math.sin(px / a)) / (px * px);
}

interface AxisMap {
  start: Int32Array; // start source index per dst slot
  width: Int32Array; // number of source taps per dst slot
  weights: Float32Array; // flattened weights, indexed by dstSlot * maxWidth + i
  maxWidth: number;
}

function buildAxisMap(srcLen: number, dstLen: number, a: number): AxisMap {
  const start = new Int32Array(dstLen);
  const width = new Int32Array(dstLen);
  const maxWidth = a * 2; // fixed radius — cv2.INTER_LANCZOS4 style
  const weights = new Float32Array(dstLen * maxWidth);
  for (let d = 0; d < dstLen; d++) {
    const center = ((d + 0.5) * srcLen) / dstLen - 0.5;
    const s = Math.floor(center) - a + 1;
    const e = Math.floor(center) + a;
    const lo = Math.max(0, s);
    const hi = Math.min(srcLen - 1, e);
    let sum = 0;
    const wOff = d * maxWidth;
    let count = 0;
    for (let ix = lo; ix <= hi; ix++) {
      const v = lanczosKernel(ix - center, a);
      weights[wOff + count] = v;
      sum += v;
      count++;
    }
    start[d] = lo;
    width[d] = count;
    if (sum !== 0) {
      const inv = 1 / sum;
      for (let i = 0; i < count; i++) weights[wOff + i] *= inv;
    }
  }
  return { start, width, weights, maxWidth };
}

function clampByte(v: number): number {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return Math.round(v);
}

// sRGB↔linear tables. Resampling in linear light on PREMULTIPLIED alpha is
// non-negotiable (spec 2.7): straight-alpha downscaling drags transparent
// pixels' RGB into the edge (a dark ring), and gamma-space averaging darkens or
// lightens anti-aliased edges. Both show up badly at 16–48 px.
const SRGB_TO_LINEAR = (() => {
  const t = new Float32Array(256);
  for (let i = 0; i < 256; i++) t[i] = srgbToLinear(i);
  return t;
})();

function linearToSrgb(c: number): number {
  if (c <= 0) return 0;
  if (c >= 1) return 255;
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return s * 255;
}

export function resampleLanczos(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  a: number = LANCZOS_A,
): RawImage {
  const xMap = buildAxisMap(srcW, dstW, a);
  const yMap = buildAxisMap(srcH, dstH, a);

  // Premultiplied-linear source: (R·α, G·α, B·α, α) with linear RGB and α∈[0,1].
  const src = new Float32Array(srcW * srcH * 4);
  for (let i = 0, p = 0; i < srcW * srcH; i++, p += 4) {
    const al = srcData[p + 3] / 255;
    src[p] = SRGB_TO_LINEAR[srcData[p]] * al;
    src[p + 1] = SRGB_TO_LINEAR[srcData[p + 1]] * al;
    src[p + 2] = SRGB_TO_LINEAR[srcData[p + 2]] * al;
    src[p + 3] = al;
  }

  // Horizontal pass: srcH × dstW × 4 floats (still premultiplied-linear)
  const tmp = new Float32Array(srcH * dstW * 4);
  for (let y = 0; y < srcH; y++) {
    const srcRow = y * srcW * 4;
    const dstRow = y * dstW * 4;
    for (let dx = 0; dx < dstW; dx++) {
      const ws = xMap.weights;
      const wOff = dx * xMap.maxWidth;
      const startX = xMap.start[dx];
      const widthX = xMap.width[dx];
      let r = 0, g = 0, b = 0, alpha = 0;
      for (let i = 0; i < widthX; i++) {
        const w = ws[wOff + i];
        const sp = srcRow + (startX + i) * 4;
        r += src[sp] * w;
        g += src[sp + 1] * w;
        b += src[sp + 2] * w;
        alpha += src[sp + 3] * w;
      }
      const dp = dstRow + dx * 4;
      tmp[dp] = r;
      tmp[dp + 1] = g;
      tmp[dp + 2] = b;
      tmp[dp + 3] = alpha;
    }
  }

  // Vertical pass, then unpremultiply and convert linear → sRGB bytes.
  const out = rawImage(dstW, dstH);
  const od = out.data;
  for (let dy = 0; dy < dstH; dy++) {
    const ws = yMap.weights;
    const wOff = dy * yMap.maxWidth;
    const startY = yMap.start[dy];
    const widthY = yMap.width[dy];
    const dstRow = dy * dstW * 4;
    for (let dx = 0; dx < dstW; dx++) {
      let r = 0, g = 0, b = 0, alpha = 0;
      for (let i = 0; i < widthY; i++) {
        const w = ws[wOff + i];
        const tp = (startY + i) * dstW * 4 + dx * 4;
        r += tmp[tp] * w;
        g += tmp[tp + 1] * w;
        b += tmp[tp + 2] * w;
        alpha += tmp[tp + 3] * w;
      }
      const dp = dstRow + dx * 4;
      if (alpha > 1e-6) {
        const inv = 1 / alpha;
        od[dp] = clampByte(linearToSrgb(r * inv));
        od[dp + 1] = clampByte(linearToSrgb(g * inv));
        od[dp + 2] = clampByte(linearToSrgb(b * inv));
      } else {
        od[dp] = 0; od[dp + 1] = 0; od[dp + 2] = 0;
      }
      od[dp + 3] = clampByte(alpha * 255);
    }
  }
  return out;
}

/**
 * Small-size legibility (spec 2.8). At 16–32 px a thin stroke can land below one
 * pixel and fade to grey mush. A gentle alpha gamma (<1) firms up the partially
 * covered edge/stroke pixels without touching solid interiors (α=255 → 255) or
 * shifting any colour — monotonic, so it can't ring like an unsharp mask. Kept
 * subtle and applied only at the smallest sizes.
 */
export function applyAlphaGamma(img: RawImage, gamma: number): RawImage {
  const out = rawImage(img.width, img.height);
  out.data.set(img.data);
  for (let i = 3; i < out.data.length; i += 4) {
    const a = out.data[i];
    if (a > 0 && a < 255) out.data[i] = clampByte(255 * Math.pow(a / 255, gamma));
  }
  return out;
}

/** Pure: resample a RawImage to a square target size. */
export function resizeRaw(src: RawImage, size: number): RawImage {
  const resized =
    src.width === size && src.height === size
      ? src
      : resampleLanczos(src.data, src.width, src.height, size, size);
  // Firm up thin strokes at the smallest sizes only.
  return size <= 32 ? applyAlphaGamma(resized, 0.85) : resized;
}

/* ------------------------------------------------------------------ */
/* Step 10: PNG export                                                 */
/* ------------------------------------------------------------------ */

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = "image/png",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("toBlob returned null"));
      },
      type,
      quality,
    );
  });
}

/* ------------------------------------------------------------------ */
/* Pure cutout core (canvas-free — runs in the browser AND under Node)  */
/* ------------------------------------------------------------------ */

export interface CutoutResult {
  bbox: BBox;
  bg: BgInfo | null;
  components: number;
  /** Decontaminated crop at the bbox resolution. */
  cropped: RawImage;
  /** Crop centered on a max(w,h) transparent square. */
  square: RawImage;
  /** One resampled RawImage per requested target size. */
  sizes: Record<number, RawImage>;
}

/**
 * The full cutout algorithm, operating purely on RGBA bytes. This is the single
 * source of truth exercised by both `processLogo` (browser) and the quality
 * harness (Node) — so a metric regression means a real algorithm regression.
 */
export interface CutoutOptions {
  /** Remove drop shadows / outer glows by default (spec 2.4). */
  removeShadow?: boolean;
}

export function processLogoCore(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  sizes: readonly number[] = TARGET_SIZES,
  opts: CutoutOptions = {},
): CutoutResult {
  const removeShadow = opts.removeShadow ?? true;
  const n = w * h;

  // Step 2 — alpha-channel detection vs background sampling.
  let bg: BgInfo | null = null;
  let hard: Uint8Array;
  let soft: Uint8Array;

  if (alphaIsMeaningful(data)) {
    hard = new Uint8Array(n);
    soft = new Uint8Array(n);
    for (let i = 0, p = 3; i < n; i++, p += 4) {
      const a = data[p];
      hard[i] = a > 10 ? 1 : 0;
      soft[i] = a;
    }
  } else {
    // Multi-cluster background model (spec 2.1): border-ring + CIELAB clustering
    // finds every background colour (incl. a thin frame); the dominant cluster
    // drives the matte/decontamination.
    const { clusters, tol } = sampleBorderClusters(data, w, h);
    bg = { r: clusters[0].r, g: clusters[0].g, b: clusters[0].b, std: tol };
    hard = morphClose(buildBgMask(data, w, h, clusters, tol), w, h);
    // Fractional-alpha coverage matte (spec 2.3) instead of the hard L1 ramp —
    // this is what lets decontamination recover clean edges free of a halo.
    soft = coverageMatte(data, w, h, bg, hard);

    // Edge-seeded flood fill (spec 2.2): only background *reachable from the
    // border* is truly background. Enclosed background — the white counter of an
    // 'o', a mascot's eye, an inner roundel shape — is filled back to opaque so
    // it survives, instead of being punched transparent by the global match.
    const outside = floodFillBackground(hard, w, h);

    // Remove border-connected background from the matte outright. This clears a
    // differently-coloured frame/chrome that the dominant-bg coverage would
    // otherwise keep opaque (its ΔE to white is large).
    for (let i = 0; i < n; i++) if (outside[i]) soft[i] = 0;

    // Confidence guard: only reclassify enclosed background as foreground when
    // the border flood actually found the real background. If a frame occludes
    // the whole border (or the mark bleeds to every edge), the flood reaches
    // little/none of the background and "enclosed" would wrongly mean "all of
    // it" — so we skip the fill and leave the plain global match in place.
    let bgCount = 0;
    let outCount = 0;
    for (let i = 0; i < n; i++) {
      if (!hard[i]) {
        bgCount++;
        if (outside[i]) outCount++;
      }
    }
    if (outCount > bgCount * 0.5) {
      for (let i = 0; i < n; i++) {
        if (!outside[i] && !hard[i]) soft[i] = 255;
      }
    }
  }

  // Shadow / glow removal (spec 2.4) — strip soft skirts before measuring the
  // box, so the crop hugs the actual mark rather than its shadow. Sharpness is
  // read from the ORIGINAL image (luma for cut-from-background input, alpha for
  // already-transparent input) — the mark's edge is steep, a shadow's is not.
  if (removeShadow) {
    const sharp = bg
      ? sharpEdges((i) => 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2], w, h, 60)
      : sharpEdges((i) => data[i * 4 + 3], w, h, 90);
    soft = suppressSoftSkirt(soft, sharp, w, h);
  }

  // Derive the final foreground from the (suppressed) matte so the bbox reflects
  // exactly what will be visible. A mid-alpha threshold keeps faint sub-pixel
  // fringe from inflating the crop (a light-touch stand-in for percentile trim).
  const hardFinal = new Uint8Array(n);
  for (let i = 0; i < n; i++) hardFinal[i] = soft[i] > 80 ? 1 : 0;

  // Step 5 — connected components → robust bbox (speck rejection + accent keep).
  let { bbox, count } = robustBBox(hardFinal, w, h);
  if (!bbox) {
    // No foreground separated. If the image is near-uniform there is simply no
    // background to remove — a solid-colour mark or an already-tight crop — so
    // keep the whole image opaque rather than erroring (spec: "must not be
    // re-cropped"). Genuinely varied input with no detectable mark still errors
    // (likely a photo, not a clean logo source).
    if (imageLumaStd(data, w, h) < 6) {
      bbox = { x: 0, y: 0, w, h };
      count = 1;
      for (let i = 0; i < n; i++) soft[i] = 255;
    } else {
      throw new Error(
        "No significant logo detected. Try a sharper image or a flatter background.",
      );
    }
  }

  // Steps 6–8 — crop + decontamination, then center on a square.
  const cropped = decontaminateAndCompose(data, w, soft, bbox, bg);
  const square = placeOnSquare(cropped);

  // Step 9 — resample to each target size.
  const out: Record<number, RawImage> = {};
  for (const s of sizes) out[s] = resizeRaw(square, s);

  return { bbox, bg, components: count, cropped, square, sizes: out };
}

/* ------------------------------------------------------------------ */
/* Browser orchestrator                                                */
/* ------------------------------------------------------------------ */
//
// NOTE: the pure `processLogoCore` is intentionally worker-ready (no DOM, works
// on transferable RGBA). A Web Worker wrapper was prototyped but Turbopack's
// worker bundling hung the production build, so it is deferred. It is not needed
// to hold the ~5 s promise: after the CIELAB lookup-table and the 2048 px
// working cap, the worst case (a 2048 px image) is ~1.4 s and the typical case
// (≤1024 px) ~0.5 s on the main thread. Re-enabling means moving this core into
// its own DOM-free module and instantiating the worker from there.

export async function processLogo(
  blob: Blob,
  sizes: readonly number[] = TARGET_SIZES,
): Promise<ProcessedResult> {
  const t0 = performance.now();
  // Universal decode: sniffs the real format and normalizes any input
  // (HEIC/TIFF/PSD/SVG/…) to upright, size-capped, straight-RGBA bytes. Imported
  // dynamically so the heavy decoder chain is never pulled into the worker
  // bundle (the worker only needs the pure `logo-pipeline` core).
  const { decodeImage, renderVectorRegion } = await import("./image/decode");
  const decoded = await decodeImage(blob);
  const { data, width: w, height: h } = decoded;

  const core = processLogoCore(data, w, h, sizes);

  const croppedCanvas = rawToCanvas(core.cropped);
  const squareCanvas = rawToCanvas(core.square);
  const out: Record<number, HTMLCanvasElement> = {};

  // Vector shortcut (spec 2.9): for SVG, render each size directly from the
  // vector at its native resolution rather than downscaling one raster. We reuse
  // the raster cutout only to locate the content box, then map it into SVG
  // coordinates and re-render (squared, with the same safe margin).
  if (decoded.vector) {
    const { svg, width: vw } = decoded.vector;
    const scale = vw / w; // SVG user units per raster pixel
    const bw = core.bbox.w * scale, bh = core.bbox.h * scale;
    const content = Math.max(bw, bh);
    const boxSize = content / (1 - 2 * 0.08);
    const cx = (core.bbox.x + core.bbox.w / 2) * scale;
    const cy = (core.bbox.y + core.bbox.h / 2) * scale;
    const vb = { x: cx - boxSize / 2, y: cy - boxSize / 2, w: boxSize, h: boxSize };
    for (const s of sizes) {
      const r = await renderVectorRegion(svg, vb, s);
      out[s] = rawToCanvas(r);
    }
  } else {
    for (const s of sizes) out[s] = rawToCanvas(core.sizes[s]);
  }

  // Build the "before" preview from the normalized bitmap rather than the raw
  // blob: the source may be HEIC/TIFF/PSD, which an <img> cannot display. The
  // normalized image is the faithful upright/sRGB original, pre-cutout.
  const originalCanvas = rawToCanvas({ data, width: w, height: h });
  const originalBlob = await canvasToBlob(originalCanvas);
  const originalUrl = URL.createObjectURL(originalBlob);

  return {
    originalUrl,
    originalWidth: w,
    originalHeight: h,
    sourceWidth: decoded.sourceWidth,
    sourceHeight: decoded.sourceHeight,
    format: decoded.format,
    converted: decoded.converted,
    note: decoded.note,
    croppedCanvas,
    squareCanvas,
    sizes: out,
    bbox: core.bbox,
    bg: core.bg,
    components: core.components,
    durationMs: performance.now() - t0,
  };
}
