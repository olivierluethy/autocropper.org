---
title: "Logo to Chrome Extension Icons (16, 32, 48, 128)"
slug: "chrome-extension-icon-sizes"
description: "Chrome extensions need icons at 16, 32, 48, and 128 px. Here's what each is for, the manifest.json setup, and how to make all four from your logo in one drag."
date: "2026-07-22"
readTime: "6 min"
seoIndex: "yes"
---

# Logo to Chrome Extension Icons (16, 32, 48, 128)

A Chrome extension needs its icon at four sizes: **16, 32, 48, and 128 pixels**, square PNGs. That's the whole set. This post covers what each one is for, how to declare them in `manifest.json`, and how to generate all four from your logo in a single drag — transparent, cropped, and still sharp at 16 px.

The good news if you're mid-build: those four sizes are the exact ones our tool outputs as presets, so this is a genuinely one-step job.

## What each size is for

- **16×16** — the favicon for your extension's own pages, and part of the toolbar (action) icon.
- **32×32** — the toolbar icon on high-DPI displays, and used on Windows.
- **48×48** — shown on the extensions management page (`chrome://extensions`).
- **128×128** — used during installation and, importantly, **required for your Chrome Web Store listing**.

Ship all four and Chrome picks the right one for each context and pixel density. Miss the 128 and you can't publish to the Web Store.

## Declaring them in manifest.json

In Manifest V3, you declare the icon set in two places — the general `icons` block and the toolbar `action` icon:

```json
{
  "manifest_version": 3,
  "name": "Your Extension",
  "version": "1.0",
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png"
    }
  }
}
```

The `icons` block covers the store, the install prompt and the management page. The `action.default_icon` is the little icon in the browser toolbar — providing both 16 and 32 lets Chrome render it crisply on standard and Retina screens.

## Use transparent PNGs — and make the 16 px one count

Extension icons should be **transparent PNGs**. Your toolbar icon sits on Chrome's chrome, which can be light or dark depending on the user's theme, so a transparent background lets the mark sit cleanly on either. This is where a transparent, background-removed export is exactly right — no white box fighting a dark toolbar.

The size that makes or breaks the set is the **16 px toolbar icon**. At that resolution there are only 256 pixels to work with, and two things usually ruin it:

- **A white halo.** If your logo came off a white background, the semi-transparent edge pixels still carry some of that white, and it smears into a pale fringe when you shrink the image. Autocropper un-mixes the background colour out of those edge pixels first, so the mark stays clean against any toolbar.
- **A crude downscale.** Shrinking with the browser's default resampling aliases hard edges into jagged noise — fatal at 16 px. Autocropper uses Lanczos-4 resampling, which weighs neighbouring pixels properly and keeps thin strokes legible.

It's deterministic image processing, not an AI model reinterpreting your logo — the same input gives the same clean output, which matters when you're regenerating icons across versions.

## How to make the set from your logo

1. **Drop your logo in.** Drag a PNG, JPG, or WebP onto the tool at the top of the page, use the file picker, or paste from your clipboard. Flat backgrounds — white, grey, a brand colour — work best.
2. **Let it crop and clean.** It finds the mark (keeping every part together — a wordmark plus a detached symbol stay as one logo), removes the background, trims the whitespace, and centres it on a transparent square. Use the 2× preview to check the 16 and 48 px edges.
3. **Download the ZIP.** You get 16, 32, 48 and 128 among the sizes — drop them into your `icons/` folder and point `manifest.json` at them.

No account, no upload — the whole pipeline runs in your browser tab, which also means you can process an internal or client extension's logo without sending it to anyone's server. The free tier covers 5 logos a day; Pro (5 CHF/month) removes the limit if you're producing a lot of them.

## Do it now

If your extension's logo is open, this is a 30-second job: drop it in, check the preview, grab the ZIP, wire up four lines of `manifest.json`.

[Turn your logo into extension icons →](https://autocropper.org/)

## Bottom line

Chrome extension icons: **16, 32, 48, 128**, transparent PNGs, declared in the `icons` block (plus 16/32 in `action.default_icon` for the toolbar). The 128 is mandatory for the Web Store. Generate all four from your logo in one drag, keep the 16 px one sharp, and you're publish-ready.

## FAQ

**What icon sizes does a Chrome extension need?**
16, 32, 48, and 128 px. The 128 is required for the Chrome Web Store; 48 shows on the extensions page; 16 and 32 cover the toolbar icon.

**Should extension icons be transparent?**
Yes. The toolbar can be light or dark, so a transparent PNG lets the mark sit cleanly on either. Autocropper outputs transparent PNGs by default.

**Do the same icons work for Edge and Firefox?**
Edge is Chromium-based and uses the same manifest and sizes. Firefox uses a similar set (it favours 48 and 96, plus 16/32 for the toolbar) — the 16/32/48/128 you generate here cover the essentials, and you can add a 96 if you're targeting Firefox specifically.

**Can I make these without uploading my logo anywhere?**
Yes. Everything — decoding, background removal, cropping, resizing — runs in your browser tab. Check the network tab; nothing leaves your device.

**Does my logo get blurry at 16 px?**
That's the failure mode this tool is built to avoid, using edge decontamination and Lanczos-4 downscaling instead of a naive shrink. Check the 2× preview before you download.

## Related

- [The 2026 icon size guide](/blog/icon-size-guide-2026)
- [Why your icons look blurry — and how to fix it](/blog/why-your-icons-look-blurry)
- [Logo to favicon: turn your logo into a complete favicon set](/blog/logo-to-favicon-set)
- [Resize a logo to every size you need](/blog/resize-logo-to-every-size)