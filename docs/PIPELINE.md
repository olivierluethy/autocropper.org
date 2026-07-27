# Autocropper — Current Pipeline Map (Phase 0)

_As-built snapshot taken before any Phase 1–3 changes. Describes what the code does **today**, not what it should do._

## 1. Where files enter

All input is handled by `components/upload-zone.tsx`, rendered inside `components/hero.tsx`.

Three entry paths, all funnel into one `handle(file, source)`:

| Path | Handler | Notes |
|------|---------|-------|
| Drag & drop | `onDrop` → `e.dataTransfer.files[0]` | single file only |
| Click / tap to select | hidden `<input type="file">` → `onPick` | `accept="image/png,image/jpeg,image/webp,image/bmp,image/gif"` |
| Clipboard paste | `onPaste` scans `clipboardData.items` for `image/*` | works |

The `<input>` `accept` attribute is **not** `image/*` — it is a hardcoded 5-type list. On iOS/Android this greys out HEIC and many valid files in the picker.

## 2. Accepted formats (enforced in TWO places)

**Place 1 — `upload-zone.tsx` `validate()`:**
- Explicitly **rejects SVG** with a message ("SVG isn't supported…").
- Accepts only if `file.type ∈ {png, jpeg, webp, bmp, gif}` **or** the name matches `\.(png|jpe?g|webp|bmp|gif)$`.
- Rejects everything else: "Unsupported file type. Use PNG, JPG, WebP, BMP or GIF."
- Rejects `file.size > 10 MB`.
- Detection is by **MIME type + extension only** — no magic-byte sniffing.

**Place 2 — `loadImage()` in `lib/logo-pipeline.ts`:**
- Decodes via `new Image()` + `URL.createObjectURL(blob)` → relies entirely on **native browser `<img>` decode**.
- Anything the browser can't decode (HEIC/HEIF, TIFF, PSD, PDF, AVIF in old browsers, corrupt files) rejects with `"Failed to decode image"`.

There is **no `createImageBitmap`, no WASM decoders, no lazy decoder loading, no EXIF/ICC handling, no CMYK handling, no animation-frame selection**. Decode = whatever `<img>` natively supports.

## 3. Decode → internal representation

`imageToData(img)`:
- Draws the `<img>` onto a `<canvas>` at `naturalWidth × naturalHeight`.
- `getImageData()` → `Uint8ClampedArray` RGBA. This is the single working buffer.

No orientation correction, no ICC→sRGB conversion, no resolution cap. Whatever size the image is, the full-resolution `ImageData` is processed on the main thread.

## 4. Background removal / alpha extraction (the cutout algorithm)

Runs in `processLogo()`. Mirrors a reference OpenCV/Python script step by step.

**Branch A — image already has meaningful alpha** (`alphaIsMeaningful`: any pixel alpha < 250):
- `hard[i] = alpha > 10`, `soft[i] = alpha`. Existing alpha used directly, no morph, no decontamination (`bg = null`).

**Branch B — opaque image, background must be detected:**
1. `sampleCorners()` — samples four **20×20 corner patches** only. Computes per-channel **median** (bg color) and mean-of-per-channel **std** (noise estimate).
2. `buildMasks()`:
   - `threshold = max(20, floor(std * 3.5))`, `transition = max(15, threshold/2)`.
   - Per pixel: `diffSum = |r−bg.r| + |g−bg.g| + |b−bg.b|` (**L1 distance in raw sRGB**).
   - `hard[i] = diffSum > threshold` (1 = foreground).
   - `soft[i] = clamp((diffSum − threshold) / transition * 255, 0, 255)` — a linear ramp used as the alpha matte.
3. `morphClose()` (3×3 dilate then erode) on **both** masks, 1 iteration.

**Both branches → bounding box (`unionBBox`)**:
- 8-connectivity connected components on the **hard** mask.
- Keep components with `area ≥ max(20, W·H·5e-5)`.
- Bbox = **union of all kept components' bboxes**.
- If none kept → throws `"No significant logo detected."`

**Crop + edge cleanup (`decontaminateAndCompose`)**:
- Crops RGB + soft mask to bbox.
- If `bg` present: color decontamination per pixel:
  - `decon = (C − bg·(1−α)) / max(α, 0.01)`
  - `final = C·α + decon·(1−α)`, clamped.
- Output alpha = `soft` value directly (`a8`).

## 5. Bounding box

Computed as the union of all connected components of the **hard binary mask** whose area passes the threshold (see above). Geometric min/max — **no** alpha-mass percentile trimming, **no** speck rejection beyond the area floor, **no** centroid.

## 6. Square canvas & centering

`squareCanvas()`:
- Side = `max(crop.w, crop.h)`.
- Crop drawn **geometrically centered** (`(size − w)/2`, `(size − h)/2`).
- **No padding / safe margin** — the mark can touch the icon edge.
- Centering is on the **bbox geometry**, not the alpha centroid.

## 7. Resizing to each target size

`TARGET_SIZES = [16, 32, 48, 64, 128, 256, 512]`.

- `resampleLanczos()` — separable Lanczos-4 (fixed radius `a=4`, cv2 style), single-step from the square canvas to each target.
- Operates on **straight (non-premultiplied) sRGB bytes**. RGB and alpha are resampled independently.
- **Not** done in linear light. **Not** premultiplied. No mip chain (single-step downscale, e.g. 1024→16).
- Result → `<canvas>` per size via `putImageData`.

## 8. Where the work runs

**100% main thread.** `processLogo` is a plain async function called directly from `hero.tsx` `handleFile`. No Web Worker, no WASM. `getImageData` on the full-res image + Lanczos on the main thread will block the UI and risks the iOS Safari canvas memory ceiling on large photos.

## 9. Export

- `canvasToBlob()` → `image/png` per size.
- ZIP (`result-viewer.tsx`): lazy-imports `jszip`, bundles all 7 sizes + `autocropper-source.png` (the square canvas).
- Single-size download via `<a download>`.

## 10. Output surfaces (for Phase 3 context)

`result-viewer.tsx` renders: before/after slider (`before-after.tsx`, mouse+touch but touch not `touch-action`-guarded), 3-up preview cards (actual + 2× zoom), a 4-up "Halo test" on white, a size-chip download bar, ZIP/reset actions, and a localStorage free-tier counter (5/day) with a `free_limit_hit` event.

---

## User-facing dead-end errors (every place a valid image can fail today)

1. `validate()` — **SVG explicitly rejected** (even though it's the ideal vector source).
2. `validate()` — any non-{png,jpg,webp,bmp,gif} type/extension rejected (HEIC, TIFF, AVIF, ICO, PSD, PDF, JXL, files with no/wrong extension).
3. `validate()` — `> 10 MB` rejected outright (common for phone photos / high-res exports).
4. `loadImage()` — `"Failed to decode image"` for anything `<img>` can't decode natively (HEIC is the big one — iPhone default format).
5. `processLogo()` — `"No significant logo detected."` when no component passes the area floor (blank/low-contrast/photographic inputs, or a background the corner sampler misjudged).

## Top 5 cutout weaknesses (assessment)

1. **Interior counters are destroyed — no edge-seeded flood fill.** The mask is a *global* color match: any pixel near the background color becomes transparent, including the white insides of `o/e/a`, roundels, and mascot eyes. This is the single biggest correctness bug (spec 2.2). Fix: connected-component flood fill seeded from the border.
2. **Background model is too weak.** Four 20×20 corners only (misses split/gradient/framed backgrounds), **L1 distance in raw sRGB** (not perceptual ΔE/CIELAB), single global threshold. Fails on gradients, tinted white, noisy JPEG, multi-color backgrounds (spec 2.1).
3. **Resampling in the wrong space → guaranteed edge fringe.** Lanczos runs on **straight, non-premultiplied, gamma-encoded sRGB**. Transparent-pixel RGB bleeds into edges and downscales pick up dark/light rings — exactly the halo the "Halo test" panel is meant to catch. Must be **premultiplied + linear light**, ideally with a mip chain (spec 2.7).
4. **No real alpha matting.** The "soft" matte is just a linear ramp of L1 distance — no trimap, no fractional-alpha estimation, no edge-aware (guided/bilateral) refinement, no JPEG-ringing suppression. Decontamination uses one global bg color, so it can't clean a gradient or multi-color edge (spec 2.3).
5. **Framing/centering/robustness gaps.** No safe margin (mark touches the 16px edge), geometric-center not alpha-centroid, no alpha-mass percentile bbox or speck rejection beyond a flat area floor, no shadow/glow removal, no small-size legibility handling, and **SVG/vector path is entirely absent** (specs 2.4–2.9).

Plus a cross-cutting constraint risk: **everything runs on the main thread with no resolution cap**, which threatens both the ~5 s promise and iOS Safari stability on large photos.

---

# Phase 2 update — near-perfect cutout (implemented)

The cutout was rebuilt incrementally, each change gated by `npm run test:quality`
(26 ground-truth fixtures, 8 metrics, regression-gated) and a live-browser smoke.

**New pure core** — `processLogoCore(data,w,h)` in `lib/logo-pipeline.ts` is
canvas-free and the single source of truth (browser + Node harness). Steps:

1. **Background model (2.1)** — `sampleBorderClusters` samples the border *ring*
   and clusters colours in CIELAB; a thin frame vs a mark-touching-edge is told
   apart by inward extent. `buildBgMask` marks a pixel background by ΔE to the
   nearest cluster (quantized 6-bit LUT for speed).
2. **Coverage matte (2.3)** — `coverageMatte` gives fractional α from
   `dist(C,bg)/‖F−B‖`, with per-region local `T` propagation (multi-colour marks
   stay halo-free); `decontaminateAndCompose` recovers true `F=(C−(1−α)B)/α`.
3. **Edge-seeded flood fill (2.2)** — enclosed background (letter counters, eyes)
   filled opaque; a confidence guard handles occluding frames.
4. **Shadow/glow removal (2.4)** — `suppressSoftSkirt` keeps high-α regions with
   a sharp original-image edge; soft skirts are dropped.
5. **Robust bbox (2.5)** — `robustBBox` share + gap-distance keep/reject; a
   uniform-image fallback replaces the old "no logo" crash on full-bleed marks.
6. **Centering + margin (2.6)** — `placeOnSquare` centers on the alpha centroid
   with an 8 % safe margin (mark never touches the edge).
7. **Resampling (2.7)** — `resampleLanczos` runs in **linear light on
   premultiplied alpha** (kills dark/light downscale rings).
8. **Small-size legibility (2.8)** — gentle alpha gamma at ≤32 px.
9. **Vector per-size (2.9)** — SVG re-rendered from the vector at each size
   (`renderVectorRegion`), not downscaled once.

**Performance** — CIELAB LUT + a 2048 px working cap keep the worst case ~1.4 s
(typical ≤1024 px ~0.5 s) on the main thread, inside the ~5 s promise. A Web
Worker wrapper was prototyped (the core is worker-ready) but deferred: Turbopack
worker bundling hung the production build.

**Harness** — `npm run test:quality` (gate), `npm run contact-sheet` (visual
`tests/quality/contact-sheet.html`). Current: avg IoU 0.99, avg halo 2.25 ΔE,
avg small-size halo 1.98, edge-clearance & interior-integrity 1.00. The one
imperfect fixture is `outer-glow` (concentric touching glow, IoU 0.86).
