import { describe, expect, it } from "vitest";
import { fitWithin, unsupportedMessage } from "./normalize";

describe("fitWithin", () => {
  it("leaves an image smaller than the cap untouched", () => {
    expect(fitWithin(800, 600, 4096)).toEqual({ width: 800, height: 600, scale: 1 });
  });

  it("leaves an image exactly at the cap untouched", () => {
    expect(fitWithin(4096, 2000, 4096)).toEqual({ width: 4096, height: 2000, scale: 1 });
  });

  it("scales a landscape image down by its longest edge", () => {
    const r = fitWithin(8000, 4000, 4096);
    expect(r.width).toBe(4096);
    expect(r.height).toBe(2048);
    expect(r.scale).toBeCloseTo(0.512, 3);
  });

  it("scales a portrait image down by its longest edge", () => {
    const r = fitWithin(2000, 10000, 4096);
    expect(r.height).toBe(4096);
    expect(r.width).toBe(819);
  });

  it("never returns a zero dimension for extreme aspect ratios", () => {
    const r = fitWithin(10000, 3, 4096);
    expect(r.width).toBe(4096);
    expect(r.height).toBeGreaterThanOrEqual(1);
  });
});

describe("unsupportedMessage", () => {
  it("gives a specific, actionable message for deferred vector/raw formats", () => {
    const pdf = unsupportedMessage("pdf");
    expect(pdf.toLowerCase()).toContain("pdf");
    expect(pdf.toLowerCase()).toMatch(/png|jpe?g|export/);
  });

  it("names JPEG XL when that is what arrived", () => {
    expect(unsupportedMessage("jxl").toLowerCase()).toContain("jpeg xl");
  });

  it("falls back to a generic-but-actionable message for unknown input", () => {
    const m = unsupportedMessage("unknown");
    expect(m.length).toBeGreaterThan(0);
    expect(m.toLowerCase()).toMatch(/image|png|jpe?g/);
  });
});
