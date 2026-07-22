---
title: "Favicon in Every Size You Need (16 to 512)"
slug: "favicon-all-sizes"
description: "Which favicon sizes you actually need, which files to ship, and how to generate 16 to 512 px from one logo without the icon turning to mush."
date: "2026-07-22"
updated: "2026-07-22"
author: "Autocropper"
tags: ["favicon", "icons", "web"]
seoIndex: true
canonical: ""
---
A complete favicon set in 2026 is smaller than most generators suggest: a `favicon.ico` containing 16, 32 and 48 px, a 180 px `apple-touch-icon.png`, and 192 and 512 px PNGs for the web app manifest. Optionally an SVG. That's it — the dozens of extra files older generators emit are for platforms that no longer exist.

Here's what each file does, what markup to ship, and how to produce the sizes from one logo without the small ones turning into mush.

## The files that actually matter

| File | Size | Why it exists |
|---|---|---|
| `favicon.ico` | 16, 32, 48 bundled | Requested from the site root by browsers no matter what your markup says |
| `favicon-32.png` | 32 × 32 | What most desktop browsers actually display in the tab |
| `apple-touch-icon.png` | 180 × 180 | iOS home screen when someone saves your site |
| `icon-192.png` | 192 × 192 | Web app manifest, Android home screen |
| `icon-512.png` | 512 × 512 | Manifest, install prompts, splash screens |
| `icon.svg` | vector | Optional; scales perfectly and can adapt to dark mode |

Two details that trip people up:

**The `.ico` is not dead.** Browsers request `/favicon.ico` from your document root even when you declare PNG icons in the markup. Serving one keeps your logs free of 404s. It's a container format, so a single `.ico` holds the 16, 32 and 48 px versions at once.

**The apple-touch-icon must be opaque.** iOS composites it onto a background rather than honouring transparency, so a transparent PNG picks up an unintended dark backdrop. Give this one a solid colour. Don't pre-round the corners either — iOS applies its own mask, and baked-in corners produce a visible double-rounding.

## The markup

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

The manifest carries the larger sizes:

```json
{
  "icons": [
    { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" },
    { "src": "/icon-maskable.png", "type": "image/png", "sizes": "512x512", "purpose": "maskable" }
  ]
}
```

A **maskable** icon is a separate variant with extra padding, because Android crops manifest icons to whatever shape the launcher uses. Only the central circle — roughly 80% of the width — is guaranteed visible. Reuse your standard 512 px icon as maskable and the edges will get shaved off on some devices.

## Why the 16 px version looks terrible

Nearly every "my favicon is blurry" problem is one of these three:

**Downscaling from an already-downscaled file.** Exporting 512, then scaling that to 256, then to 32, compounds resampling error at every step. Each size should be derived from the original source, not from the previous output.

**Too much detail for the pixel budget.** At 16 × 16 you have 256 pixels. A full wordmark, a thin outline, or a subtle gradient cannot survive that. Most brands with detailed logos ship a *simplified* favicon — a single letter or the isolated symbol. If your 16 px output is unreadable, that's the signal to simplify, not to sharpen.

**Cropping to the canvas instead of the mark.** Design exports often carry generous transparent margins. Crop to the file's bounds and your logo ends up tiny and off-centre inside its own favicon, wasting half the pixels you have.

If your icons look soft rather than wrong, [why your icons look blurry](/blog/why-your-icons-look-blurry) covers the resampling side in more depth.

## Google's favicon in search results

Google shows a favicon next to your result on mobile. Its documented requirements are worth meeting because they're stricter than the browser's: the icon should be **square and a multiple of 48 px** (48, 96, 144, and so on), reachable at a stable URL, and crawlable — don't block the icon path in `robots.txt`.

A 512 px PNG satisfies the multiple-of-48 rule only if it's actually square and clean, which is another reason to generate the ladder from one properly cropped source rather than hand-exporting each size.

## Generating 16 to 512 from one logo

Doing this by hand means cropping, padding, exporting, changing the size, exporting again — then checking the small end and usually redoing the crop because it was chosen for the large one.

Autocropper does it in one pass: it detects the mark's real bounding box, strips uniform or transparent background, squares the crop with consistent padding, and resamples 16, 32, 48, 64, 128, 256 and 512 px directly from the source using a Lanczos filter, so no output is a downscale of another output. It runs entirely in your browser — the logo is never uploaded anywhere.

[Generate every favicon size from one logo](/#hero-tool) and download the set as a ZIP.

You'll still need to bundle the `.ico` yourself (it's a container format, not a resize) and flatten the apple-touch-icon onto a solid background. For how the same source feeds app store icons and profile pictures, see [the icon size guide](/blog/icon-size-guide-2026).

## Checklist before you ship

- The 16 px version is **recognisable**, not a grey smudge.
- `favicon.ico` exists at the **document root**.
- The apple-touch-icon is **opaque** and **not pre-rounded**.
- The maskable manifest icon has **padding to the 80% safe circle**.
- Checked on a **white** tab background and a **dark** one.
- The icon path is **not blocked** in `robots.txt`.

## FAQ

### What size should a favicon be?

Ship 16, 32 and 48 px inside `favicon.ico`, plus 180 px for iOS and 192 and 512 px for the manifest. 32 px is the one most desktop browsers display.

### Do I still need favicon.ico?

Yes, practically speaking. Browsers request `/favicon.ico` from the root regardless of your markup, so shipping one avoids constant 404s even though the PNG and SVG icons are what users see.

### Can I use an SVG favicon?

Modern browsers support `type="image/svg+xml"` icons, and an SVG can respond to `prefers-color-scheme` so the icon adapts to dark mode. Keep the raster fallbacks — Safari's support has historically lagged, and the `.ico` covers the gap.

### Why does my favicon look blurry?

Almost always because it was resized from an already-resized copy, or because the logo has more detail than 16 × 16 pixels can hold. Generate from the original source, and simplify the mark for the small sizes.

### Why isn't my new favicon showing up?

Browsers cache favicons aggressively, sometimes beyond a normal hard refresh. Test in a private window, and give Google days to weeks to refresh the one in search results.

### Does the favicon need a transparent background?

For the tab icon, transparency is fine and adapts to light and dark browser chrome. The apple-touch-icon is the exception — it needs a solid background because iOS won't preserve transparency.
