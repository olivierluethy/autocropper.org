# Autocropper — product brief

Context document for anyone (human or LLM) writing about autocropper.org. Everything
here is checked against the code, not the marketing copy. When the two disagree, the
code wins — see [Claims you may NOT make](#claims-you-may-not-make).

---

## One paragraph

**Autocropper turns one logo image into a complete square icon set — 16, 32, 48, 64,
128, 256 and 512 px PNGs — in about five seconds, entirely inside the browser tab.**
You drop a PNG/JPG/WebP in, it finds the logo, removes the background, crops away the
dead space, centres the mark on a transparent square, downscales each size with
Lanczos resampling, and hands you the files individually or as a ZIP. No account, no
upload, no server. The image never leaves the device.

## The problem it solves

Shipping icons today means chaining single-purpose tools: remove.bg to knock out the
background, a crop tool to trim the whitespace, an image editor to square and centre
it, then an icon generator (or seven manual exports) to produce each size. That's
~10–15 minutes per logo, several tabs, at least one paid service, and images handed to
three different companies' servers. Every re-export loses a bit of edge quality —
halos from a bad matte, jagged anti-aliasing from a naive downscale.

Autocropper collapses that chain into one drag-and-drop. Same output, one tab, nothing
uploaded.

## Who it's for

- **Indie devs and founders** shipping an app or a landing page who need a favicon set
  and app icons *now* and don't want a Figma round-trip.
- **Designers and agencies** processing client logos in volume — the repetitive part,
  not the creative part.
- **Marketers / no-code builders** who have a logo PNG and need it to look right in a
  browser tab, an app store listing and a social avatar.
- **Privacy-sensitive teams** who can't legally paste client assets into a third-party
  SaaS uploader.

## What it actually does — the pipeline

Implemented in `lib/logo-pipeline.ts`, pure Canvas + typed arrays, no WASM, no AI API.
It's a port of a reference OpenCV/Python implementation, step for step:

1. **Decode** the image in the browser.
2. **Find the background.** If the file already has a meaningful alpha channel, use it.
   Otherwise sample four 20×20 corner patches and compute a per-channel median colour
   plus a standard deviation.
3. **Build two masks** from the L1 colour distance to that background: a hard binary
   mask (`diff > threshold`, `threshold = max(20, std × 3.5)`) and a soft gradient mask
   for anti-aliased edges.
4. **Morphological close** (3×3) on both masks — closes pinholes in the mark.
5. **Connected-component analysis** (8-connectivity BFS). Every component above a
   minimum area is kept and their bounding boxes are unioned. This is the "logo-aware"
   part: a wordmark plus a detached symbol plus a dot on an "i" stay together as one
   logo, instead of the tool cropping to the largest blob.
6. **Crop** to that union bounding box.
7. **Colour decontamination.** Semi-transparent edge pixels carry a fraction of the old
   background colour. It's un-mixed with `(C − BG·(1−α)) / max(α, 0.01)` and blended
   back. This is what kills the white halo you get from a naive background removal.
8. **Square the canvas** at `max(width, height)`, transparent, mark centred, no padding.
9. **Lanczos-4 resample** (separable, fixed radius, cv2-style) down to each target size
   — the reason 16 px output stays legible instead of turning to mush.
10. **Export PNG** via `canvas.toBlob`.

Typical end-to-end runtime is under a second of compute; the site quotes ~5 s
end-to-end including the user's own drag-and-drop.

## Product surface

| | |
|---|---|
| **Input formats** | PNG, JPG/JPEG, WebP, BMP, GIF — max 10 MB, one image at a time |
| **Input methods** | drag-and-drop, file picker, paste from clipboard |
| **Output** | PNG at 16 / 32 / 48 / 64 / 128 / 256 / 512 px, transparent background, square |
| **Download** | any single size, or the whole set + source as `autocropper-icons.zip` |
| **Preview** | before/after view, plus 2× zoom to inspect edge quality at 16/48/128 px |
| **Account** | none — the tool runs immediately on page load |
| **Pricing** | Free: 5 logos/day, all preset sizes, ZIP export. Pro: 5 CHF/month for unlimited logos and custom sizes |
| **Stack** | Next.js 16, React 19, Tailwind 4, deployed as a static-ish site; analytics via PostHog + GA4 + Vercel Analytics |

## The differentiators, ranked

These are the angles worth writing about, strongest first:

1. **Nothing is uploaded.** There is no upload endpoint. The claim is verifiable — open
   the network tab and watch. This is the hardest-to-copy advantage and the one that
   matters to anyone handling client assets.
2. **One input → the whole ladder.** Competing tools give you one output size per run.
   Autocropper produces the full set in one pass.
3. **Logo-aware cropping.** Multi-component union bounding box, not "trim to the biggest
   shape". Purpose-built for logos and graphic marks, which is a narrower and better-served
   niche than generic "background remover".
4. **Edge quality.** Decontamination + Lanczos-4, not `drawImage` at a smaller size.
   This is why the icons don't get halos or blur.
5. **Zero friction.** No signup, no API key, no watermark, no queue.

## Honest limitations

Say these plainly — they build trust and they keep the posts accurate:

- **Flat or near-flat backgrounds only.** White, light grey, brand colours, soft
  gradients. Photographic or busy backgrounds are not the target; for those, run a
  segmentation tool first and feed the result back in.
- **SVG is rejected.** Raster in, raster out.
- **Square output only.** No arbitrary aspect ratios, no social banner dimensions
  (1500×500 etc.), no OG-image sizing.
- **One image at a time.** It is one-image-to-many-sizes, not many-images-to-one-size.
  "Bulk" means the ZIP of sizes, not a folder of logos.
- **No `.ico` file.** The favicon sizes come out as PNGs, which every modern browser
  accepts, but there's no multi-resolution `.ico` bundling.
- **Not a photo cutout tool.** remove.bg does people and products; this does marks.
- **Custom sizes are a Pro feature**, not available on free.

## Claims you may NOT make

- Never say it accepts SVG. (The `how-it-works` section on the site currently implies
  it does — that copy is wrong, the upload validator rejects SVG. Don't propagate it.)
- Never say it crops to non-square or custom aspect ratios.
- Never say it batch-processes multiple source images.
- Never invent statistics, user counts, benchmarks or testimonials. "~150× faster" and
  "10–15 minutes manually" are existing marketing framings on the site, not measured
  study results — use them as framing, never as cited data.
- Never say it uses AI or a machine-learning model. It's deterministic classical image
  processing, and the fact that it *isn't* an AI black box is part of the pitch.

---

## Search / content strategy

The goal of the blog is long-tail organic traffic from people who are mid-task —
they have a logo file open and a problem to solve right now. Those searches convert
because the tool is on the same page as the answer.

**The cluster where Autocropper is most differentiated and competition is thinnest is
logos → icons.** Prioritise it over generic "crop image online" head terms, which are
dominated by Canva, Adobe Express and iLoveIMG and which the tool doesn't even serve
well (it only does squares).

### Content clusters

| Cluster | Example queries | Why we can win |
|---|---|---|
| **Logo → icon set** | "resize logo to all sizes", "logo to app icon", "logo to favicon" | Exactly what the tool does end to end |
| **Icon sizes reference** | "all app icon sizes ios android", "favicon sizes 2026", "what size should a favicon be" | Evergreen reference traffic, natural CTA |
| **Quality problems** | "icon looks blurry", "white halo after removing background", "png loses quality when resized" | We have a real technical answer (Lanczos, decontamination) |
| **Privacy / local processing** | "resize images without uploading", "offline image resizer", "crop image without upload" | The no-upload architecture is the whole answer |
| **Whitespace / trimming** | "auto trim whitespace around image", "crop image to content" | Direct match for the bounding-box step |
| **Workflow / automation** | "stop resizing icons manually", "icon generator vs manual export" | Softer, top-of-funnel, links down to the above |

### Priority queue (from `docs/blog-post-prompt.md`)

1. Resize a logo to all sizes for a website
2. All app icon sizes for iOS & Android in one go
3. Favicon in every size you need (16 to 512)
4. Crop an image to an exact pixel size online
5. Crop an image to a perfect square
6. Crop PNG without losing quality
7. Auto-trim whitespace around an image

### Cadence and mechanics

One to two genuinely useful posts a week, each owning one long-tail query. The full
authoring contract — frontmatter schema, the `seoIndex` switch, word count, FAQ block,
CTA rules, internal linking — lives in **[`docs/blog-post-prompt.md`](blog-post-prompt.md)**.
Read it before writing a post; this brief is the *what*, that file is the *how*.

### Voice

Direct, technical, unhyped. Short sentences. Explain the mechanism, not just the
benefit — the audience is developers and designers who can smell filler. Lead with the
answer to the search query in the first two sentences, then earn the rest of the read.
One CTA, contextual, never a banner.

### Posts already published

`content/blog/` currently covers: icon size guide 2026, resize logo to every size, how
to generate perfect app icons, favicon all sizes, crop one image into multiple sizes,
why your icons look blurry, the hidden cost of manual image processing, why speed
matters more than features, why perfect cropping feels surprisingly important, the
future of image editing is less editing, stop doing things manually, why we built
autocropper. Check the directory before proposing a topic — don't cannibalise an
existing post's query, extend it instead.
