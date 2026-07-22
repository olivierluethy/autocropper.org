---
title: "PWA Icon Sizes and the Web App Manifest (192 & 512)"
slug: "pwa-icon-sizes"
description: "A PWA needs manifest icons at 192 and 512 px, plus a maskable one. Here's what each is for, the manifest.json setup, and how to make them from your logo."
date: "2026-07-22"
readTime: "7 min"
seoIndex: "yes"
---

# PWA Icon Sizes and the Web App Manifest (192 & 512)

A progressive web app needs two icon sizes in its web app manifest: **192×192 and 512×512**, both square PNGs. For a proper install experience on Android you also want a **maskable** version, so the icon fills whatever shape the device masks it into instead of floating in a box.

That's the whole answer. Below is what each icon does, how to declare them in `manifest.json`, the maskable safe-zone detail most generators get wrong, and how to produce them from your logo without uploading it anywhere.

## The sizes and what each is for

- **192×192** — the home-screen icon on Android when someone installs your PWA.
- **512×512** — used for the splash screen and as the high-resolution source the system scales from.
- **Maskable icon (usually 512×512)** — a separate version whose content sits inside a safe zone so Android can mask it to a circle, squircle, rounded square, or teardrop without clipping the mark.

192 and 512 are the practical baseline Chrome looks for to treat your app as installable. Add a maskable icon on top and the install looks native instead of a small logo in a white tile.

## Declaring them in the manifest

Reference the icons in your `manifest.json` (or `site.webmanifest`) with an `icons` array. Each entry carries a `purpose` — `any` for the standard icons, `maskable` for the adaptive one:

```json
{
  "name": "Your App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Keep the maskable icon as its own entry rather than combining `purpose: "any maskable"` on one file — the two need different padding, so a single file can't satisfy both well.

## The maskable safe zone (the part most tools get wrong)

A standard icon can be transparent and cropped tight to the mark. A **maskable** icon can't — Android crops it to a shape, and if your logo runs to the edges, the mask will clip it.

The rule: the important content must fit inside a **safe zone of roughly the central 80%** of the image (about 10% padding on every side), and the **background should be filled**, not transparent, so there's no empty corner showing through the mask. So a maskable icon is an opaque square — brand colour or white — with your mark sitting comfortably in the middle.

You can test a maskable icon against every device shape at maskable.app before you ship it.

## How to make these from your logo

Autocropper turns your logo into a clean, cropped, centred, transparent square in one drag, entirely in your browser — no account, no upload. Here's how that maps to the PWA set, honestly:

**The standard icons (purpose `any`).** Transparent is fine here, so this is a direct fit. The **512×512** is one of Autocropper's free preset sizes, so you get it exactly. The **192×192** isn't a free preset — the free ladder is 16, 32, 48, 64, 128, 256, 512 — so either grab it as a **custom size on Pro** (5 CHF/month), or export the 256 and let it scale down to 192, which browsers handle cleanly for manifest icons.

**The maskable icon.** Because it needs an *opaque* background and safe-zone padding, and Autocropper outputs a transparent, tight-cropped square, this one takes an extra step: take the clean 512 export, place it on a solid brand-colour background, and scale the mark to about 80% so it sits inside the safe zone. One composite in any editor and you have a maskable icon that won't get clipped.

The upside of the transparent, background-removed export is that it's the ideal starting point for both — the mark is already isolated and centred, so you're not fighting a leftover white box or a halo when you build either version.

## Why the icons stay sharp

At 192 and 512 you're not fighting the 16 px legibility problem, but edge quality still matters — a pale halo around a transparent mark shows up clearly on a coloured splash screen. Autocropper un-mixes the old background colour out of the semi-transparent edge pixels, so there's no fringe, and it downscales with Lanczos-4 rather than a crude shrink. It's deterministic image processing, not an AI model, so regenerating the set across versions gives identical output.

## Do it now

If your app's logo is open, drop it into the tool at the top of the page, grab the 512 and 256, and you've got your standard manifest icons in seconds — nothing leaves your device.

[Turn your logo into PWA icons →](https://autocropper.org/)

## Bottom line

PWA manifest icons: **192 and 512, PNG**, declared with `purpose: "any"`, plus a **maskable** 512 that's opaque and padded to the ~80% safe zone. Generate the transparent standard icons from your logo in one drag (512 free, 192 as a custom size or scaled from 256), then build the maskable version by putting that clean mark on a solid background.

## FAQ

**What icon sizes does a PWA need?**
192×192 and 512×512 as the baseline, both PNG. Add a maskable 512 for a proper adaptive icon on Android.

**What's a maskable icon?**
A version whose content sits inside a safe zone (roughly the central 80%) on a filled background, so Android can mask it to a circle or squircle without clipping. Standard icons don't need this; maskable ones do.

**Can PWA icons be transparent?**
The standard `purpose: "any"` icons can be transparent. The maskable icon should have a solid background, or the mask will show empty corners.

**Can Autocropper make the exact 192 size?**
The free presets are 16/32/48/64/128/256/512, so 512 is exact. For 192, use a custom size on Pro, or scale the 256 export down — browsers render manifest icons cleanly either way.

**Does my logo get uploaded?**
No. Decoding, background removal, cropping and resizing all run in your browser tab. Nothing is sent to a server.

## Related

- [The 2026 icon size guide](/blog/icon-size-guide-2026)
- [Apple touch icon: what size it is and how to make one](/blog/apple-touch-icon-size)
- [Logo to favicon: turn your logo into a complete favicon set](/blog/logo-to-favicon-set)
- [How to generate perfect app icons](/blog/how-to-generate-perfect-app-icons)