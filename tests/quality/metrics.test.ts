import { describe, expect, it } from "vitest";
import type { BBox, RawImage } from "@/lib/logo-pipeline";
import {
  alphaTransitionFraction,
  bboxIoU,
  deltaE,
  haloScore,
  interiorIntegrity,
  residualBackground,
  rgbToLab,
} from "./metrics";

/** Build a solid RawImage with a per-pixel painter, for metric fixtures. */
function paint(
  w: number,
  h: number,
  fn: (x: number, y: number) => [number, number, number, number],
): RawImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fn(x, y);
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  }
  return { data, width: w, height: h };
}

describe("rgbToLab / deltaE", () => {
  it("gives ΔE 0 for identical colors", () => {
    expect(deltaE(rgbToLab(120, 40, 200), rgbToLab(120, 40, 200))).toBeCloseTo(0, 5);
  });

  it("gives a large ΔE between black and white", () => {
    expect(deltaE(rgbToLab(0, 0, 0), rgbToLab(255, 255, 255))).toBeGreaterThan(95);
  });

  it("flags a small RGB delta that is perceptually visible", () => {
    // Near-white vs pure white — perceptually noticeable, should be > 1.
    expect(deltaE(rgbToLab(255, 255, 255), rgbToLab(240, 240, 240))).toBeGreaterThan(1);
  });
});

describe("bboxIoU", () => {
  const a: BBox = { x: 10, y: 10, w: 20, h: 20 };

  it("is 1 for identical boxes", () => {
    expect(bboxIoU(a, { ...a })).toBeCloseTo(1, 5);
  });

  it("is 0 for disjoint boxes", () => {
    expect(bboxIoU(a, { x: 100, y: 100, w: 5, h: 5 })).toBe(0);
  });

  it("computes partial overlap correctly", () => {
    // Two 20×20 boxes overlapping in a 10×20 = 200 region.
    // union = 400 + 400 − 200 = 600 → IoU = 200/600 = 1/3.
    const b: BBox = { x: 20, y: 10, w: 20, h: 20 };
    expect(bboxIoU(a, b)).toBeCloseTo(1 / 3, 4);
  });
});

describe("residualBackground", () => {
  const bg = { r: 255, g: 255, b: 255 };

  it("is zero when the border ring is fully transparent", () => {
    // Opaque red center, transparent everywhere in the outer ring.
    const img = paint(40, 40, (x, y) => {
      const inner = x > 12 && x < 28 && y > 12 && y < 28;
      return inner ? [200, 0, 0, 255] : [0, 0, 0, 0];
    });
    expect(residualBackground(img, bg)).toBe(0);
  });

  it("counts opaque background-colored pixels left in the outer ring", () => {
    // Entire image is opaque white == leftover background not removed.
    const img = paint(40, 40, () => [255, 255, 255, 255]);
    expect(residualBackground(img, bg)).toBeGreaterThan(0);
  });
});

describe("interiorIntegrity", () => {
  it("is 1 when all interior sample points are opaque", () => {
    const img = paint(40, 40, () => [255, 255, 255, 255]);
    expect(interiorIntegrity(img, [{ x: 20, y: 20 }, { x: 10, y: 30 }])).toBe(1);
  });

  it("drops when interior counters were knocked transparent", () => {
    // A hole punched at (20,20) — a destroyed letter counter.
    const img = paint(40, 40, (x, y) =>
      x === 20 && y === 20 ? [0, 0, 0, 0] : [255, 255, 255, 255],
    );
    expect(interiorIntegrity(img, [{ x: 20, y: 20 }, { x: 10, y: 10 }])).toBe(0.5);
  });
});

describe("haloScore", () => {
  const fg = { r: 200, g: 30, b: 60 };

  it("is ~0 when edge-band color matches the true foreground", () => {
    // Transition-band pixels carry the true fg color (clean decontamination).
    const img = paint(40, 40, (x) => {
      const a = x < 10 ? 128 : 255; // a band of semi-transparent fg-colored pixels
      return [fg.r, fg.g, fg.b, a];
    });
    expect(haloScore(img, fg)).toBeLessThan(2);
  });

  it("is high when edge pixels are contaminated toward the background", () => {
    // Semi-transparent band carries near-white (a baked-in white halo).
    const img = paint(40, 40, (x) => {
      if (x < 10) return [245, 245, 245, 128]; // contaminated edge
      return [fg.r, fg.g, fg.b, 255];
    });
    expect(haloScore(img, fg)).toBeGreaterThan(20);
  });
});

describe("alphaTransitionFraction", () => {
  it("is low for a crisp bimodal matte", () => {
    // Half transparent, half fully opaque — no mid-alpha pixels.
    const img = paint(40, 40, (x) => (x < 20 ? [0, 0, 0, 0] : [10, 10, 10, 255]));
    expect(alphaTransitionFraction(img)).toBe(0);
  });

  it("is high for a smeared matte with many mid-alpha pixels", () => {
    const img = paint(40, 40, () => [10, 10, 10, 128]);
    expect(alphaTransitionFraction(img)).toBeGreaterThan(0.9);
  });
});
