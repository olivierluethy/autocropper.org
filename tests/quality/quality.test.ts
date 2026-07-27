import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { processLogoCore, type CutoutResult } from "@/lib/logo-pipeline";
import { ALL_FIXTURES } from "./fixtures";
import {
  alphaTransitionFraction,
  bboxIoU,
  edgeClear,
  haloScore,
  interiorIntegrity,
  residualBackground,
} from "./metrics";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASELINE = path.join(HERE, "baseline.json");
const RESULTS = path.join(HERE, "results.json");
const UPDATE = !!process.env.UPDATE_BASELINE;

interface Row {
  name: string;
  category: string;
  iou: number;
  residual: number;
  halo: number;
  /** Halo measured on the 32px downscaled output — catches resampling-space rings. */
  smallHalo: number;
  interior: number;
  alphaMid: number;
  edgeClear: number;
  crisp16: number;
  ms: number;
}

/** Direction + tolerance per metric for the regression gate. */
const GATE: Record<keyof Omit<Row, "name" | "category">, { dir: "up" | "down"; tol: number }> = {
  iou: { dir: "up", tol: 0.02 },
  residual: { dir: "down", tol: 3 },
  halo: { dir: "down", tol: 1.0 },
  smallHalo: { dir: "down", tol: 1.5 },
  interior: { dir: "up", tol: 0.001 },
  alphaMid: { dir: "down", tol: 0.03 },
  edgeClear: { dir: "up", tol: 0.001 },
  crisp16: { dir: "up", tol: 0.03 },
  ms: { dir: "down", tol: 1e9 }, // runtime tracked, not gated (machine-dependent)
};

function evaluate(): Row[] {
  const rows: Row[] = [];
  for (const f of ALL_FIXTURES) {
    let core: CutoutResult | null = null;
    const t0 = performance.now();
    try {
      core = processLogoCore(f.data, f.width, f.height);
    } catch {
      core = null;
    }
    const ms = performance.now() - t0;

    if (!core) {
      rows.push({ name: f.name, category: f.category, iou: 0, residual: 999, halo: 999, smallHalo: 999, interior: 0, alphaMid: 1, edgeClear: 0, crisp16: 0, ms });
      continue;
    }

    const iou = bboxIoU(core.bbox, f.truth.bbox);
    const residual = f.truth.bg ? residualBackground(core.cropped, f.truth.bg) : 0;
    const halo = f.truth.fg ? haloScore(core.cropped, f.truth.fg) : 0;
    const smallHalo = f.truth.fg && core.sizes[32] ? haloScore(core.sizes[32], f.truth.fg) : 0;

    // Map source-space interior points into the crop.
    let interior = 1;
    if (f.truth.interior?.length) {
      const mapped = f.truth.interior.map((p) => ({ x: p.x - core!.bbox.x, y: p.y - core!.bbox.y }));
      interior = interiorIntegrity(core.cropped, mapped);
    }
    const alphaMid = alphaTransitionFraction(core.cropped);
    const edge = edgeClear(core.square);
    const crisp16 = core.sizes[16] ? 1 - alphaTransitionFraction(core.sizes[16]) : 1;

    rows.push({ name: f.name, category: f.category, iou, residual, halo, smallHalo, interior, alphaMid, edgeClear: edge, crisp16, ms });
  }
  return rows;
}

function fmtTable(rows: Row[]): string {
  const head = ["fixture", "cat", "IoU↑", "resid↓", "halo↓", "s.halo↓", "inter↑", "αmid↓", "ms"];
  const widths = [18, 12, 6, 7, 7, 8, 7, 7, 6];
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join(" ");
  const out = [line(head), line(widths.map((w) => "-".repeat(w)))];
  for (const r of rows) {
    out.push(
      line([
        r.name, r.category,
        r.iou.toFixed(2), r.residual.toFixed(0), r.halo.toFixed(1), r.smallHalo.toFixed(1),
        r.interior.toFixed(2), r.alphaMid.toFixed(2), r.ms.toFixed(0),
      ]),
    );
  }
  return out.join("\n");
}

describe("cutout quality", () => {
  it("prints the metric table and gates against the baseline", () => {
    const rows = evaluate();
    console.log("\n" + fmtTable(rows) + "\n");
    writeFileSync(RESULTS, JSON.stringify(rows, null, 2));

    if (UPDATE || !existsSync(BASELINE)) {
      writeFileSync(BASELINE, JSON.stringify(rows, null, 2));
      console.log(`[quality] baseline ${UPDATE ? "updated" : "created"} at ${BASELINE}`);
      return;
    }

    const baseline: Row[] = JSON.parse(readFileSync(BASELINE, "utf8"));
    const byName = new Map(baseline.map((r) => [r.name, r]));
    const regressions: string[] = [];

    for (const r of rows) {
      const base = byName.get(r.name);
      if (!base) continue;
      for (const key of Object.keys(GATE) as Array<keyof typeof GATE>) {
        const { dir, tol } = GATE[key];
        const now = r[key] as number;
        const was = base[key] as number;
        const worse = dir === "up" ? now < was - tol : now > was + tol;
        if (worse) regressions.push(`${r.name}.${key}: ${was.toFixed(2)} → ${now.toFixed(2)} (${dir === "up" ? "dropped" : "rose"})`);
      }
    }

    if (regressions.length) {
      console.error("[quality] regressions:\n  " + regressions.join("\n  "));
    }
    expect(regressions, regressions.join("; ")).toHaveLength(0);
  });
});
