---
title: "Resize Your Logo to Every Size You Need (App Icon, Favicon, Social Profiles)"
slug: "resize-logo-to-every-size"
description: "One logo, every size: favicon, app icon and social profile picture. How to resize a logo without cutting it off or making it blurry."
date: "2026-07-21"
updated: "2026-07-21"
author: "Autocropper"
tags: ["logo", "app-icon", "favicon", "social"]
seoIndex: true
canonical: ""
---
To resize a logo to every size you need, crop it once to its true bounding box, square it up with consistent padding, then resample that single crop to each target size. Doing it that way — rather than exporting each size separately from a design file — is what keeps a logo from looking cut off at small sizes or blurry at large ones.

This post covers which sizes actually matter, why logos get clipped by platform masks, and how to produce the whole set in one pass.

## The three destinations a logo has to survive

Almost every logo resize request comes down to three contexts, and each one crops differently.

**Favicons** appear at 16–48 px in a browser tab, next to the page title. There is no room for a wordmark here. If your logo is a name rather than a mark, the favicon needs the initial or the symbol, not the full lockup.

**App icons** are square source images that the operating system masks — iOS rounds the corners, Android launchers may crop to a circle, a squircle or a rounded square depending on the device. Anything near the corners is at risk.

**Social profile pictures** are square uploads displayed as circles on most platforms. The corners of your square are guaranteed to be invisible; the inscribed circle is the only safe region.

The common thread: **you upload a square, the platform decides how to cut it.** Your job is to make sure the mark survives every cut.

## Why logos get cut off — and how to prevent it

A circular mask on a square image keeps roughly 78% of the area. Corner-to-corner artwork loses its corners. A rounded-square mask is gentler but still bites in.

The practical rule is a **safe area of about 6–10% padding** on every side of the visible mark. That padding costs you nothing visually — the eye reads a slightly smaller mark inside a circle as correctly sized — and it means your logo never gets clipped by a mask you don't control.

This is exactly where manual cropping fails. Eyeballing 8% padding across seven exports produces seven different paddings. Deriving them all from one measured bounding box produces one.

Two more failure modes worth knowing:

- **Cropping to the canvas instead of the mark.** Design files often carry generous transparent margins. Crop to the canvas and your mark ends up small and off-centre inside its own icon.
- **Optical versus geometric centring.** A mark with a descender or an asymmetric shape needs its *visual* mass centred, not its bounding box. Squaring the crop symmetrically around the detected subject gets much closer to this than dragging a crop box does.

## The size ladder to generate

You don't need to decide sizes one by one — generate the standard ladder and use what each platform asks for:

| Size | Where it's used |
|---|---|
| 16 × 16 | Browser tab favicon |
| 32 × 32 | Retina favicon, taskbar, bookmarks |
| 48 × 48 | Windows shortcuts, some Android densities |
| 64 × 64 | Desktop apps, UI avatars, list rows |
| 128 × 128 | macOS icons, larger UI surfaces |
| 256 × 256 | High-DPI desktop, web app manifest |
| 512 × 512 | Play Store listing, manifest icon, master source |

For social profiles, the honest advice is simpler than most size charts admit: **upload the largest square you have — 512 px is plenty — and let the platform downscale it.** Every major network resamples server-side. Pre-sizing to a platform's exact display dimensions gains you nothing and costs you a resampling pass.

For iOS specifically, modern Xcode takes a single **1024 × 1024** App Store icon and derives the rest, so a large clean square is all you need to hand a developer. The per-platform detail lives in [the icon size guide](/blog/icon-size-guide-2026).

## Do it in one pass

Manually, resizing a logo to this ladder means: open the design file, crop to the mark, add padding, export, change the export size, export again — seven times — then check the small ones and usually redo the crop.

Autocropper collapses that into one step. It detects the mark's bounding box, removes uniform or transparent background, squares the crop with consistent padding, and resamples each size directly from the source crop using a Lanczos filter, so no output is a downscale of another output. Everything runs locally in your browser — your unreleased brand mark never gets uploaded to anyone's server.

[Resize your logo to every size in one pass](/#hero-tool) and download the full set as a ZIP.

## Preparing the source file

**Export from vector at 1024 px or larger.** If your logo lives in an SVG or an AI file, render it big. Every downscale from there is clean; every upscale from a small PNG is not.

**Use transparency.** A transparent PNG makes the subject boundary unambiguous and lets the icon sit on any background. If your source has a white plate, decide deliberately whether the plate is part of the logo.

**Simplify for the small end if you must.** Hairline strokes, thin serifs and fine gradients do not survive 16 px. Many brands keep a dedicated simplified mark for favicon use — a single letter or symbol. If your 16 px output is unreadable, that's the signal.

**Check the result on white.** Halos from background removal are invisible on dark previews and glaring on a white browser tab. If your outputs look soft, [why your icons look blurry](/blog/why-your-icons-look-blurry) walks through the causes.

## FAQ

### What size should a logo be for a website?

For the favicon, generate 16, 32 and 48 px. For the header logo, export at twice its display size for Retina screens — a logo displayed at 120 px wide should be a 240 px asset. For the web app manifest, include 192 and 512 px.

### How do I resize a logo without losing quality?

Start from the largest source you have, resize down rather than up, use PNG for lossless output, and make sure each size is resampled from the original rather than from a previously resized copy.

### Can I use the same image for my app icon and my favicon?

Usually not the same *file*, but the same *mark*. The app icon can carry more detail; the favicon often needs a simplified version because 16 px erases fine detail. Generating both from one source keeps them visually consistent.

### Why does my logo look cut off as a profile picture?

Because the platform masks your square to a circle. Leave 6–10% padding around the mark so nothing important sits near the edges or corners.

### Should the logo have a background or be transparent?

Transparent is more flexible — it adapts to light and dark surfaces. Some app stores require an opaque icon, so a version on a solid brand colour is worth keeping alongside the transparent set.

### Is my logo uploaded when I use Autocropper?

No. The entire pipeline runs in your browser using the Canvas API. The file never leaves your machine, which matters when the logo isn't public yet.
