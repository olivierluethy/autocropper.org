/**
 * Pure quality metrics for the cutout regression harness.
 *
 * These turn "the cutout looks clean" into numbers we can gate on. All operate
 * on RawImage bytes + ground-truth supplied by the fixture, so they run in Node
 * with no browser. Perceptual comparisons use CIELAB ΔE (CIE76), not raw RGB,
 * because two colors close in RGB can be visibly different and vice versa.
 */

import type { BBox, RawImage } from "@/lib/logo-pipeline";

export type Lab = [number, number, number];
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/* ---- Color: sRGB → CIELAB, ΔE ---- */

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

export function rgbToLab(r: number, g: number, b: number): Lab {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  // linear sRGB → XYZ (D65)
  let X = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  let Y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  let Z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;
  // normalize by D65 white
  X /= 0.95047; Y /= 1.0; Z /= 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE(a: Lab, b: Lab): number {
  const dL = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

/* ---- Bounding box ---- */

export function bboxIoU(a: BBox, b: BBox): number {
  const ix0 = Math.max(a.x, b.x);
  const iy0 = Math.max(a.y, b.y);
  const ix1 = Math.min(a.x + a.w, b.x + b.w);
  const iy1 = Math.min(a.y + a.h, b.y + b.h);
  const iw = Math.max(0, ix1 - ix0);
  const ih = Math.max(0, iy1 - iy0);
  const inter = iw * ih;
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}

/* ---- Residual background: opaque bg-colored pixels left in the outer ring ---- */

const OPAQUE = 200;
const RESIDUAL_DE = 10;

export function residualBackground(
  img: RawImage,
  bg: RGB,
  ring = 2,
  tol = RESIDUAL_DE,
): number {
  const { data, width: w, height: h } = img;
  const bgLab = rgbToLab(bg.r, bg.g, bg.b);
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inRing = x < ring || y < ring || x >= w - ring || y >= h - ring;
      if (!inRing) continue;
      const i = (y * w + x) * 4;
      if (data[i + 3] < OPAQUE) continue;
      if (deltaE(rgbToLab(data[i], data[i + 1], data[i + 2]), bgLab) < tol) count++;
    }
  }
  return count;
}

/* ---- Interior integrity: are known counter points still opaque? ---- */

export function interiorIntegrity(
  img: RawImage,
  points: Array<{ x: number; y: number }>,
): number {
  if (points.length === 0) return 1;
  const { data, width: w } = img;
  let opaque = 0;
  for (const p of points) {
    const i = (p.y * w + p.x) * 4;
    if (data[i + 3] > 230) opaque++;
  }
  return opaque / points.length;
}

/* ---- Halo score: color contamination of the semi-transparent edge band ---- */

export function haloScore(img: RawImage, fg: RGB): number {
  const { data } = img;
  const fgLab = rgbToLab(fg.r, fg.g, fg.b);
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a <= 16 || a >= 240) continue; // only the transition band
    sum += deltaE(rgbToLab(data[i], data[i + 1], data[i + 2]), fgLab);
    n++;
  }
  return n === 0 ? 0 : sum / n;
}

/* ---- Edge clearance: the mark must not touch the icon edge (safe margin) ---- */

export function edgeClear(img: RawImage, ring = 2): number {
  const { data, width: w, height: h } = img;
  let clear = 0, total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= ring && y >= ring && x < w - ring && y < h - ring) continue;
      total++;
      if (data[(y * w + x) * 4 + 3] < 10) clear++;
    }
  }
  return total ? clear / total : 1;
}

/* ---- Alpha bimodality: fraction of the matte stuck in the mid transition ---- */

export function alphaTransitionFraction(img: RawImage): number {
  const { data } = img;
  let mid = 0;
  let present = 0; // any non-fully-transparent pixel
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a <= 16) continue;
    present++;
    if (a < 240) mid++;
  }
  return present === 0 ? 0 : mid / present;
}
