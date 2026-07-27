import { describe, expect, it } from "vitest";
import {
  coverageMatte,
  floodFillBackground,
  imageLumaStd,
  robustBBox,
  sampleBorderClusters,
  buildBgMask,
  sharpEdges,
  suppressSoftSkirt,
  placeOnSquare,
  type BgInfo,
  type RawImage,
} from "./logo-pipeline";

/** Build an opaque RGBA buffer from a per-pixel painter. */
function rgba(w: number, h: number, fn: (x: number, y: number) => [number, number, number]): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * w + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  return d;
}

describe("imageLumaStd", () => {
  it("is 0 for a perfectly uniform image", () => {
    expect(imageLumaStd(rgba(20, 20, () => [225, 29, 72]), 20, 20)).toBeCloseTo(0, 5);
  });

  it("is large for a high-contrast checkerboard", () => {
    const d = rgba(20, 20, (x, y) => ((x + y) % 2 ? [255, 255, 255] : [0, 0, 0]));
    expect(imageLumaStd(d, 20, 20)).toBeGreaterThan(100);
  });
});

/**
 * Builds a `hard` foreground mask (1 = foreground) from an ASCII grid where
 * '#' is foreground and '.' is background. Rows must be equal length.
 */
function mask(rows: string[]): { hard: Uint8Array; w: number; h: number } {
  const h = rows.length;
  const w = rows[0].length;
  const hard = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) hard[y * w + x] = rows[y][x] === "#" ? 1 : 0;
  }
  return { hard, w, h };
}

/** Paint a filled rectangle of foreground into a hard mask. */
function fgRect(hard: Uint8Array, w: number, x0: number, y0: number, ww: number, hh: number) {
  for (let y = y0; y < y0 + hh; y++) for (let x = x0; x < x0 + ww; x++) hard[y * w + x] = 1;
}

describe("placeOnSquare", () => {
  function opaque(w: number, h: number, fn?: (x: number, y: number) => number): RawImage {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i] = 200; data[i + 3] = fn ? fn(x, y) : 255;
    }
    return { data, width: w, height: h };
  }
  const alphaAt = (img: RawImage, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3];

  it("produces a square canvas with a transparent safe margin", () => {
    const sq = placeOnSquare(opaque(30, 30));
    expect(sq.width).toBe(sq.height);
    expect(sq.width).toBeGreaterThan(30); // margin added
    // The entire outer border ring is transparent.
    for (let x = 0; x < sq.width; x++) {
      expect(alphaAt(sq, x, 0)).toBe(0);
      expect(alphaAt(sq, x, sq.height - 1)).toBe(0);
    }
  });

  it("centers on the alpha centroid, not the geometric box", () => {
    // Wide crop (60×24): mass is heavy in the TOP of the short axis, where the
    // square has vertical slack to recenter. Box-centering would leave the mass
    // visually high; centroid-centering should pull it toward the middle.
    const sq = placeOnSquare(opaque(60, 24, (_x, y) => (y < 8 ? 255 : y >= 20 ? 60 : 0)));
    let sy = 0, sa = 0;
    for (let y = 0; y < sq.height; y++) for (let x = 0; x < sq.width; x++) {
      const a = alphaAt(sq, x, y); sy += y * a; sa += a;
    }
    const cy = sy / sa;
    expect(Math.abs(cy - sq.height / 2)).toBeLessThan(sq.height * 0.12);
  });
});

describe("sampleBorderClusters", () => {
  const W = 60, H = 60;
  function withBorder(paint: (x: number, y: number) => [number, number, number]) {
    const d = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const [r, g, b] = paint(x, y);
      const i = (y * W + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
    return d;
  }

  it("finds one cluster for a uniform border", () => {
    const d = withBorder(() => [255, 255, 255]);
    const { clusters } = sampleBorderClusters(d, W, H);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].r).toBeGreaterThan(250);
  });

  it("finds two clusters for a white field with a 1px dark frame", () => {
    const d = withBorder((x, y) => {
      const onFrame = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      return onFrame ? [20, 22, 28] : [255, 255, 255];
    });
    const { clusters } = sampleBorderClusters(d, W, H);
    expect(clusters.length).toBeGreaterThanOrEqual(2);
    // Dominant cluster is white (majority of the ring is the inner white).
    expect(clusters[0].r).toBeGreaterThan(200);
    // A dark frame cluster exists.
    expect(clusters.some((c) => c.r < 60)).toBe(true);
  });
});

describe("buildBgMask", () => {
  it("marks pixels near ANY background cluster as background", () => {
    const clusters = [
      { r: 255, g: 255, b: 255, count: 100, std: 0 },
      { r: 20, g: 22, b: 28, count: 20, std: 0 },
    ];
    const d = new Uint8ClampedArray(3 * 1 * 4);
    // pixel 0 white (bg), pixel 1 dark frame (bg), pixel 2 rose (fg)
    d.set([255, 255, 255, 255], 0);
    d.set([20, 22, 28, 255], 4);
    d.set([225, 29, 72, 255], 8);
    const hard = buildBgMask(d, 3, 1, clusters, 12);
    expect(hard[0]).toBe(0);
    expect(hard[1]).toBe(0);
    expect(hard[2]).toBe(1);
  });
});

describe("suppressSoftSkirt", () => {
  const W = 40, H = 40;
  const sharpOf = (soft: Uint8Array) => sharpEdges((i) => soft[i], W, H, 90);

  it("removes a soft skirt not anchored to any solid core (a drop shadow)", () => {
    // A uniform low-alpha field (≈35%) with no solid core anywhere.
    const soft = new Uint8Array(W * H).fill(90);
    const out = suppressSoftSkirt(soft, sharpOf(soft), W, H);
    expect(Array.from(out).every((v) => v === 0)).toBe(true);
  });

  it("keeps a solid core and its immediate anti-aliased edge", () => {
    const soft = new Uint8Array(W * H);
    // Solid 10×10 core in the middle, alpha 255.
    for (let y = 15; y < 25; y++) for (let x = 15; x < 25; x++) soft[y * W + x] = 255;
    // A 1px soft AA ring just outside the core.
    for (let x = 14; x < 26; x++) { soft[14 * W + x] = 120; soft[25 * W + x] = 120; }
    const out = suppressSoftSkirt(soft, sharpOf(soft), W, H);
    expect(out[20 * W + 20]).toBe(255); // core preserved
    expect(out[14 * W + 20]).toBe(120); // adjacent AA edge preserved
  });

  it("drops a distant soft blob while keeping the solid mark", () => {
    const soft = new Uint8Array(W * H);
    for (let y = 5; y < 12; y++) for (let x = 5; x < 12; x++) soft[y * W + x] = 255; // mark
    for (let y = 30; y < 37; y++) for (let x = 30; x < 37; x++) soft[y * W + x] = 80; // far shadow
    const out = suppressSoftSkirt(soft, sharpOf(soft), W, H);
    expect(out[8 * W + 8]).toBe(255); // mark kept
    expect(out[33 * W + 33]).toBe(0); // far shadow removed
  });
});

describe("coverageMatte", () => {
  // 20×20: left half white background, right half rose foreground, with a single
  // 50%-blended transition column at x=10.
  const W = 20, H = 20;
  const bg: BgInfo = { r: 255, g: 255, b: 255, std: 0 };
  const rose = [225, 29, 72];
  function build() {
    const data = new Uint8ClampedArray(W * H * 4);
    const hard = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let c: number[];
        if (x < 10) c = [255, 255, 255];
        else if (x === 10) c = [(rose[0] + 255) / 2, (rose[1] + 255) / 2, (rose[2] + 255) / 2];
        else c = rose;
        const i = (y * W + x) * 4;
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
        hard[y * W + x] = x >= 10 ? 1 : 0;
      }
    }
    return { data, hard };
  }

  it("is ~0 over the background and ~255 over full foreground", () => {
    const { data, hard } = build();
    const soft = coverageMatte(data, W, H, bg, hard);
    expect(soft[10 * W + 2]).toBeLessThan(10); // deep background
    expect(soft[10 * W + 17]).toBeGreaterThan(245); // deep foreground
  });

  it("estimates ~50% coverage in a half-blended transition pixel", () => {
    const { data, hard } = build();
    const soft = coverageMatte(data, W, H, bg, hard);
    const a = soft[10 * W + 10];
    expect(a).toBeGreaterThan(105);
    expect(a).toBeLessThan(150);
  });
});

describe("robustBBox", () => {
  const W = 200, H = 200;

  it("unions a large mark with a small nearby accent (i-dot)", () => {
    const hard = new Uint8Array(W * H);
    fgRect(hard, W, 40, 60, 8, 60); // bar
    fgRect(hard, W, 40, 48, 8, 6); // dot, 6px gap above the bar
    const { bbox } = robustBBox(hard, W, H);
    expect(bbox).not.toBeNull();
    expect(bbox!.y).toBeLessThanOrEqual(48); // the dot is included
    expect(bbox!.y + bbox!.h).toBeGreaterThanOrEqual(119);
  });

  it("rejects a far stray speck instead of inflating the box", () => {
    const hard = new Uint8Array(W * H);
    fgRect(hard, W, 60, 60, 80, 80); // main mark
    fgRect(hard, W, 180, 10, 6, 6); // far speck, small share
    const { bbox } = robustBBox(hard, W, H);
    // Box should hug the main mark, not stretch to the speck at x≈180.
    expect(bbox!.x + bbox!.w).toBeLessThan(150);
  });

  it("keeps multiple comparable elements (wordmark)", () => {
    const hard = new Uint8Array(W * H);
    for (let i = 0; i < 4; i++) fgRect(hard, W, 20 + i * 40, 80, 30, 40);
    const { bbox, count } = robustBBox(hard, W, H);
    expect(count).toBe(4);
    expect(bbox!.x).toBe(20);
    expect(bbox!.x + bbox!.w).toBe(20 + 3 * 40 + 30);
  });

  it("returns null when there is no foreground", () => {
    expect(robustBBox(new Uint8Array(W * H), W, H).bbox).toBeNull();
  });
});

describe("floodFillBackground", () => {
  it("marks all background when there is no foreground", () => {
    const { hard, w, h } = mask(["...", "...", "..."]);
    const out = floodFillBackground(hard, w, h);
    expect(Array.from(out)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it("marks nothing when the image is entirely foreground", () => {
    const { hard, w, h } = mask(["###", "###", "###"]);
    const out = floodFillBackground(hard, w, h);
    expect(Array.from(out).every((v) => v === 0)).toBe(true);
  });

  it("leaves an enclosed background pocket UNmarked (the letter-counter case)", () => {
    // Background border, a foreground ring, and one enclosed background cell.
    const { hard, w, h } = mask([
      ".....",
      ".###.",
      ".#.#.",
      ".###.",
      ".....",
    ]);
    const out = floodFillBackground(hard, w, h);
    expect(out[2 * w + 2]).toBe(0); // enclosed counter → not border-connected
    expect(out[0]).toBe(1); // corner background → reachable
  });

  it("marks a background channel that leaks to the border", () => {
    // The pocket is connected to the outside through a gap in the ring.
    const { hard, w, h } = mask([
      ".....",
      ".#.#.",
      ".#.#.",
      ".###.",
      ".....",
    ]);
    const out = floodFillBackground(hard, w, h);
    expect(out[2 * w + 2]).toBe(1); // interior reachable via the top gap
  });
});
