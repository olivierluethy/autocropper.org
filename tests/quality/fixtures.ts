/**
 * Synthetic fixture corpus with exact ground truth.
 *
 * We generate logos procedurally rather than shipping binary assets because it
 * gives us *known* ground truth — the exact bbox, the exact background colour,
 * the exact foreground colour, and the exact interior-counter coordinates — so
 * the metrics can be asserted precisely instead of eyeballed. Each fixture is
 * built to exercise a specific Phase-0 weakness (see `category`/`note`).
 *
 * Edges are anti-aliased via coverage so the halo/matting metrics have a real
 * background-blended edge band to evaluate (the classic `C = αF + (1−α)B`).
 */

import type { BBox } from "@/lib/logo-pipeline";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Fixture {
  name: string;
  category: string;
  note: string;
  width: number;
  height: number;
  data: Uint8ClampedArray;
  truth: {
    bbox: BBox;
    /** Background colour the algorithm should detect (undefined = transparent input). */
    bg?: RGB;
    /** Dominant foreground colour, for the halo (contamination) metric. */
    fg?: RGB;
    /** Interior points (counters/eyes) that must stay opaque by default. */
    interior?: Array<{ x: number; y: number }>;
  };
}

/* ---- tiny drawing toolkit ---- */

class Surface {
  data: Uint8ClampedArray;
  constructor(public w: number, public h: number, bg?: RGB) {
    this.data = new Uint8ClampedArray(w * h * 4);
    if (bg) this.fill(() => ({ ...bg, a: 255 }));
  }
  fill(fn: (x: number, y: number) => RGB & { a: number }) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = fn(x, y);
        const i = (y * this.w + x) * 4;
        this.data[i] = c.r; this.data[i + 1] = c.g; this.data[i + 2] = c.b; this.data[i + 3] = c.a;
      }
    }
  }
  // Composite a covered foreground over whatever is there (opaque bg) or set
  // straight alpha when the surface has no background (transparent input).
  private blend(x: number, y: number, fg: RGB, cov: number, transparent: boolean) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || cov <= 0) return;
    const i = (y * this.w + x) * 4;
    if (transparent) {
      // Straight-alpha over transparent: pick the higher coverage.
      const a = Math.round(cov * 255);
      if (a >= this.data[i + 3]) {
        this.data[i] = fg.r; this.data[i + 1] = fg.g; this.data[i + 2] = fg.b; this.data[i + 3] = a;
      }
      return;
    }
    const inv = 1 - cov;
    this.data[i] = Math.round(fg.r * cov + this.data[i] * inv);
    this.data[i + 1] = Math.round(fg.g * cov + this.data[i + 1] * inv);
    this.data[i + 2] = Math.round(fg.b * cov + this.data[i + 2] * inv);
    this.data[i + 3] = 255;
  }
  disk(cx: number, cy: number, r: number, fg: RGB, opts: { transparent?: boolean; inner?: number; innerFg?: RGB } = {}) {
    const transparent = !!opts.transparent;
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        const cov = Math.max(0, Math.min(1, r - d + 0.5));
        if (opts.inner != null && d < opts.inner) continue; // leave the counter hole
        this.blend(x, y, fg, cov, transparent);
      }
    }
  }
  rect(x0: number, y0: number, ww: number, hh: number, fg: RGB, transparent = false) {
    for (let y = y0; y < y0 + hh; y++) {
      for (let x = x0; x < x0 + ww; x++) this.blend(x, y, fg, 1, transparent);
    }
  }
  raw(): Uint8ClampedArray {
    return this.data;
  }
}

const ROSE: RGB = { r: 225, g: 29, b: 72 };
const INK: RGB = { r: 20, g: 22, b: 28 };
const TEAL: RGB = { r: 13, g: 148, b: 136 };
const WHITE: RGB = { r: 255, g: 255, b: 255 };

/* ---- fixtures ---- */

function fx(
  name: string,
  category: string,
  note: string,
  s: Surface,
  truth: Fixture["truth"],
): Fixture {
  return { name, category, note, width: s.w, height: s.h, data: s.raw(), truth };
}

export const ALL_FIXTURES: Fixture[] = [];

function add(f: Fixture) {
  ALL_FIXTURES.push(f);
}

// 1. Transparent PNG — alpha channel already present.
{
  const s = new Surface(160, 160);
  s.disk(80, 80, 50, ROSE, { transparent: true });
  add(fx("transparent-png", "background", "already-transparent input, do nothing destructive", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, fg: ROSE,
  }));
}

// 2. Flat white background.
{
  const s = new Surface(160, 160, WHITE);
  s.disk(80, 80, 50, ROSE);
  add(fx("white-bg", "background", "flat white background removal", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg: WHITE, fg: ROSE,
  }));
}

// 3. Off-white / slightly tinted background.
{
  const bg = { r: 244, g: 242, b: 236 };
  const s = new Surface(160, 160, bg);
  s.disk(80, 80, 50, INK);
  add(fx("off-white-bg", "background", "tinted near-white background", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg, fg: INK,
  }));
}

// 4. Flat dark background, light logo.
{
  const bg = { r: 14, g: 15, b: 18 };
  const s = new Surface(160, 160, bg);
  s.disk(80, 80, 50, WHITE);
  add(fx("dark-bg", "background", "dark background, light mark (dark-halo risk)", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg, fg: WHITE,
  }));
}

// 5. Brand-color background.
{
  const s = new Surface(160, 160, TEAL);
  s.disk(80, 80, 50, WHITE);
  add(fx("brand-color-bg", "background", "solid brand-color background", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg: TEAL, fg: WHITE,
  }));
}

// 6. Vertical gradient background.
{
  const s = new Surface(160, 160);
  s.fill((_x, y) => {
    const t = y / 159;
    const v = Math.round(255 - t * 24); // 255 → 231
    return { r: v, g: v, b: v, a: 255 };
  });
  s.disk(80, 80, 50, ROSE);
  add(fx("gradient-bg", "background", "subtle gradient background (single threshold fails)", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg: { r: 243, g: 243, b: 243 }, fg: ROSE,
  }));
}

// 7. Noisy/compressed-looking white background.
{
  const s = new Surface(160, 160);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  s.fill(() => {
    const v = 255 - Math.round(rnd() * 10);
    return { r: v, g: v, b: v, a: 255 };
  });
  s.disk(80, 80, 50, INK);
  add(fx("noisy-bg", "background", "noisy background (needs adaptive tolerance)", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg: WHITE, fg: INK,
  }));
}

// 8. Letter-O counter — THE interior-integrity case.
{
  const s = new Surface(160, 160, WHITE);
  s.disk(80, 80, 55, INK, { inner: 30 }); // ring with a white hole
  add(fx("letter-counter", "interior", "white counter inside a ring must stay opaque", s, {
    bbox: { x: 25, y: 25, w: 110, h: 110 }, bg: WHITE, fg: INK,
    interior: [{ x: 80, y: 80 }], // dead center of the counter
  }));
}

// 9. Mascot eye — small white dot inside a colored blob.
{
  const s = new Surface(160, 160, WHITE);
  s.disk(80, 80, 50, TEAL);
  s.disk(80, 80, 10, WHITE); // the eye
  // Two-tone mark (teal + white eye): single-fg halo is meaningless; the
  // interior-integrity check is what guards this fixture.
  add(fx("mascot-eye", "interior", "enclosed white eye must stay opaque", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg: WHITE,
    interior: [{ x: 80, y: 80 }],
  }));
}

// 10. Thin monoline ring.
{
  const s = new Surface(160, 160, WHITE);
  s.disk(80, 80, 50, INK, { inner: 46 }); // 4px-ish ring
  add(fx("thin-monoline", "small-detail", "thin stroke must survive", s, {
    bbox: { x: 30, y: 30, w: 100, h: 100 }, bg: WHITE, fg: INK,
  }));
}

// 11. Wordmark — disconnected letters on white.
{
  const s = new Surface(220, 100, WHITE);
  for (let i = 0; i < 4; i++) s.rect(20 + i * 48, 30, 32, 40, INK);
  add(fx("wordmark", "bbox", "multiple disconnected glyphs, union bbox", s, {
    bbox: { x: 20, y: 30, w: 32 + 3 * 48, h: 40 }, bg: WHITE, fg: INK,
  }));
}

// 12. Icon + wordmark lockup with a gap.
{
  const s = new Surface(240, 100, WHITE);
  s.disk(45, 50, 28, ROSE);
  s.rect(110, 35, 110, 30, INK);
  // Two-colour lockup: the single-fg halo metric is meaningless here (rose vs
  // ink), so we leave `fg` unset and let this fixture guard bbox instead.
  add(fx("lockup-gap", "bbox", "icon + text separated by a gap", s, {
    bbox: { x: 17, y: 22, w: 203, h: 56 }, bg: WHITE,
  }));
}

// 13a. i-dot — a small accent close to the mark MUST be kept.
{
  const s = new Surface(120, 160, WHITE);
  s.rect(56, 70, 10, 66, INK); // stem
  s.rect(56, 52, 10, 10, INK); // dot, 8px gap above the stem
  add(fx("i-dot", "bbox", "small nearby accent (i-dot) must be kept", s, {
    bbox: { x: 56, y: 52, w: 10, h: 84 }, bg: WHITE, fg: INK,
  }));
}

// 13b. Stray speck — a far small blob MUST be rejected, not inflate the box.
{
  const s = new Surface(160, 160, WHITE);
  s.disk(80, 80, 45, INK);
  s.rect(146, 8, 6, 6, INK); // distant speck, small share
  add(fx("stray-speck", "bbox", "far small speck must be rejected", s, {
    bbox: { x: 35, y: 35, w: 90, h: 90 }, bg: WHITE, fg: INK,
  }));
}

// 14. Drop shadow — soft offset gray, well separated from the mark.
{
  const s = new Surface(200, 200, WHITE);
  // Soft shadow blob far to the lower-right, low contrast, gentle falloff.
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x < 200; x++) {
      const d = Math.hypot(x - 148, y - 148);
      const cov = Math.max(0, Math.min(1, (40 - d) / 30)) * 0.2;
      if (cov > 0) {
        const i = (y * 200 + x) * 4;
        const v = Math.round(255 * (1 - cov));
        s.data[i] = v; s.data[i + 1] = v; s.data[i + 2] = v; s.data[i + 3] = 255;
      }
    }
  }
  s.disk(58, 58, 36, ROSE);
  add(fx("drop-shadow", "shadow", "soft offset shadow must be removed, box hugs the mark", s, {
    bbox: { x: 22, y: 22, w: 72, h: 72 }, bg: WHITE, fg: ROSE,
  }));
}

// 14b. Outer glow — soft symmetric halo around the mark.
{
  const s = new Surface(180, 180, WHITE);
  for (let y = 0; y < 180; y++) {
    for (let x = 0; x < 180; x++) {
      const d = Math.hypot(x - 90, y - 90);
      const cov = Math.max(0, Math.min(1, (72 - d) / 34)) * 0.22; // soft ring out to r72
      if (cov > 0) {
        const i = (y * 180 + x) * 4;
        const v = Math.round(255 * (1 - cov));
        s.data[i] = v; s.data[i + 1] = v; s.data[i + 2] = v; s.data[i + 3] = 255;
      }
    }
  }
  s.disk(90, 90, 38, TEAL);
  add(fx("outer-glow", "shadow", "soft glow must be removed, box hugs the mark", s, {
    bbox: { x: 52, y: 52, w: 76, h: 76 }, bg: WHITE, fg: TEAL,
  }));
}

// 15. Tight-cropped — logo already fills the frame.
{
  const s = new Surface(100, 100, WHITE);
  s.rect(0, 0, 100, 100, ROSE);
  add(fx("tight-cropped", "bbox", "already tight — must not over-crop or pad wrongly", s, {
    bbox: { x: 0, y: 0, w: 100, h: 100 }, bg: WHITE, fg: ROSE,
  }));
}

// 16. Edge-touching mark.
{
  const s = new Surface(160, 120, WHITE);
  s.rect(0, 30, 90, 60, TEAL); // touches left edge
  add(fx("edge-touching", "bbox", "mark touches the canvas edge", s, {
    bbox: { x: 0, y: 30, w: 90, h: 60 }, bg: WHITE, fg: TEAL,
  }));
}

// 17. 1px border frame around the image + centered logo.
{
  const s = new Surface(160, 160, WHITE);
  s.rect(0, 0, 160, 1, INK); s.rect(0, 159, 160, 1, INK);
  s.rect(0, 0, 1, 160, INK); s.rect(159, 0, 1, 160, INK);
  s.disk(80, 80, 45, ROSE);
  add(fx("border-frame", "bbox", "1px frame at the image border (corner sampling trap)", s, {
    bbox: { x: 35, y: 35, w: 90, h: 90 }, bg: WHITE, fg: ROSE,
  }));
}

// 18. Large image — runtime + downscale headroom.
{
  const s = new Surface(1400, 1400, WHITE);
  s.disk(700, 700, 450, ROSE);
  add(fx("large-1400", "performance", "large input, runtime budget + memory", s, {
    bbox: { x: 250, y: 250, w: 900, h: 900 }, bg: WHITE, fg: ROSE,
  }));
}

// 19. Split background — two background colours (needs multi-cluster).
{
  const s = new Surface(160, 160);
  s.fill((x) => (x < 80 ? { r: 255, g: 255, b: 255, a: 255 } : { r: 232, g: 236, b: 240, a: 255 }));
  s.disk(80, 80, 46, ROSE);
  add(fx("split-bg", "background", "two background colours, both removed", s, {
    bbox: { x: 34, y: 34, w: 92, h: 92 }, bg: WHITE, fg: ROSE,
  }));
}

// 20. Checkerboard background — classic transparency-checker source.
{
  const s = new Surface(160, 160);
  s.fill((x, y) => {
    const v = (((x >> 3) + (y >> 3)) & 1) ? 245 : 228;
    return { r: v, g: v, b: v, a: 255 };
  });
  s.disk(80, 80, 46, INK);
  add(fx("checkerboard-bg", "background", "checkerboard background, both tiles removed", s, {
    bbox: { x: 34, y: 34, w: 92, h: 92 }, bg: WHITE, fg: INK,
  }));
}

// 21. Two-tone mark — half rose, half teal (multi-colour decontamination).
{
  const s = new Surface(160, 160, WHITE);
  s.disk(80, 80, 48, ROSE);
  for (let y = 32; y < 128; y++) for (let x = 80; x < 128; x++) {
    if (Math.hypot(x - 80, y - 80) < 48) {
      const i = (y * 160 + x) * 4;
      s.data[i] = TEAL.r; s.data[i + 1] = TEAL.g; s.data[i + 2] = TEAL.b; s.data[i + 3] = 255;
    }
  }
  add(fx("two-tone-mark", "background", "two-colour mark must both stay halo-free", s, {
    bbox: { x: 32, y: 32, w: 96, h: 96 }, bg: WHITE,
  }));
}

// 22. Tiny mark in a large canvas — lots of empty space, safe margin.
{
  const s = new Surface(300, 300, WHITE);
  s.disk(150, 150, 24, TEAL);
  add(fx("tiny-in-large", "bbox", "small mark, large canvas — crop must be tight", s, {
    bbox: { x: 126, y: 126, w: 48, h: 48 }, bg: WHITE, fg: TEAL,
  }));
}

// 23. Very wide mark (extreme aspect ratio).
{
  const s = new Surface(240, 100, WHITE);
  s.rect(20, 44, 200, 12, INK);
  add(fx("wide-mark", "bbox", "extreme aspect ratio, centered with margin", s, {
    bbox: { x: 20, y: 44, w: 200, h: 12 }, bg: WHITE, fg: INK,
  }));
}

// 24. Very tall mark (extreme aspect ratio).
{
  const s = new Surface(100, 240, WHITE);
  s.rect(44, 20, 12, 200, ROSE);
  add(fx("tall-mark", "bbox", "extreme aspect ratio, centered with margin", s, {
    bbox: { x: 44, y: 20, w: 12, h: 200 }, bg: WHITE, fg: ROSE,
  }));
}
