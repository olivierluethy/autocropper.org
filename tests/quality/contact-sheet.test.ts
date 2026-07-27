import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { it } from "vitest";
import { processLogoCore, type RawImage } from "@/lib/logo-pipeline";
import { ALL_FIXTURES } from "./fixtures";
import { encodePngDataUri } from "./png";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Composite straight-RGBA over a flat background colour → opaque RGBA. */
function over(img: RawImage, bg: [number, number, number]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(img.width * img.height * 4);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) out[i * 4 + c] = img.data[i * 4 + c] * a + bg[c] * (1 - a);
    out[i * 4 + 3] = 255;
  }
  return out;
}

function overChecker(img: RawImage): Uint8ClampedArray {
  const out = new Uint8ClampedArray(img.width * img.height * 4);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const c = (((x >> 2) + (y >> 2)) & 1) ? 210 : 245;
      const a = img.data[i + 3] / 255;
      for (let k = 0; k < 3; k++) out[i + k] = img.data[i + k] * a + c * (1 - a);
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Alpha channel as a grayscale image, to eyeball the matte. */
function matteGray(img: RawImage): Uint8ClampedArray {
  const out = new Uint8ClampedArray(img.width * img.height * 4);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3];
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = a;
    out[i * 4 + 3] = 255;
  }
  return out;
}

it("generates the visual contact sheet", () => {
  const cells: string[] = [];
  for (const f of ALL_FIXTURES) {
    let body: string;
    try {
      const c = processLogoCore(f.data, f.width, f.height);
      const input = encodePngDataUri(f.data, f.width, f.height);
      const matte = encodePngDataUri(matteGray(c.square), c.square.width, c.square.height);
      const o = c.sizes[128];
      const onWhite = encodePngDataUri(over(o, [255, 255, 255]), o.width, o.height);
      const onBlack = encodePngDataUri(over(o, [0, 0, 0]), o.width, o.height);
      const onCheck = encodePngDataUri(overChecker(o), o.width, o.height);
      const img = (src: string, label: string) =>
        `<figure><img src="${src}" width="96" height="96" alt="${label}"><figcaption>${label}</figcaption></figure>`;
      body =
        img(input, "input") + img(matte, "matte") +
        img(onWhite, "white") + img(onBlack, "black") + img(onCheck, "checker");
    } catch (e) {
      body = `<p class="err">threw: ${e instanceof Error ? e.message : e}</p>`;
    }
    cells.push(`<section><h2>${f.name} <small>${f.category} — ${f.note}</small></h2><div class="row">${body}</div></section>`);
  }

  const html = `<!doctype html><meta charset="utf-8"><title>Autocropper cutout contact sheet</title>
<style>
  body{font:14px/1.4 system-ui,sans-serif;margin:24px;background:#0b0d10;color:#e6e8eb}
  section{border-top:1px solid #22262b;padding:14px 0}
  h2{font-size:15px;margin:0 0 8px} small{color:#8a9099;font-weight:400}
  .row{display:flex;gap:14px;flex-wrap:wrap}
  figure{margin:0;text-align:center}
  img{image-rendering:auto;border:1px solid #22262b;border-radius:6px;background:#111}
  figcaption{color:#8a9099;font-size:11px;margin-top:4px}
  .err{color:#ff6b6b}
</style>
<h1>Cutout contact sheet <small style="color:#8a9099">${ALL_FIXTURES.length} fixtures · input · matte · output@128 on white/black/checker</small></h1>
${cells.join("\n")}`;

  const outPath = path.join(HERE, "contact-sheet.html");
  writeFileSync(outPath, html);
  console.log(`[contact-sheet] wrote ${outPath}`);
});
