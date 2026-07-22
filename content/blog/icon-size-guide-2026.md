---
title: "The Complete Icon Size Guide (2026) — and How to Generate Them All in One Pass"
slug: "icon-size-guide-2026"
description: "Every favicon, app icon and profile picture size you need in 2026, which ones you can skip, and how to generate the whole set in one pass."
date: "2026-07-23"
updated: "2026-07-23"
author: "Autocropper"
tags: ["icons", "app-icon", "favicon", "social", "guide"]
seoIndex: true
canonical: ""
---
The short version for 2026: you need far fewer icon files than most size charts claim. One clean square master at 512 px or larger, plus a favicon set at 16/32/48, a 180 px apple-touch-icon and 192/512 px manifest icons, covers the web — and modern mobile toolchains generate their own sizes from a single 1024 px master.

This guide lists what each platform actually asks for, flags the sizes that are now legacy, and shows how to produce the whole set in one pass instead of exporting them one at a time.

## Web: favicons and manifest icons

The browser tab icon is the one people still get wrong, mostly by shipping a single low-resolution `favicon.ico` from 2012.

| File | Size | Purpose |
|---|---|---|
| `favicon.ico` | 16, 32, 48 bundled | Legacy fallback; still requested by some browsers at the site root |
| `favicon-32.png` | 32 × 32 | The size most desktop browsers actually display |
| `apple-touch-icon.png` | 180 × 180 | iOS home screen when a site is saved |
| `icon-192.png` | 192 × 192 | Web app manifest, Android home screen |
| `icon-512.png` | 512 × 512 | Manifest, splash screens, install prompts |

Two things worth knowing:

**The `.ico` still matters, slightly.** Browsers request `/favicon.ico` even when you declare PNG icons in the markup. Shipping one avoids a stream of 404s in your logs, even if the PNGs are what users see.

**The apple-touch-icon has no transparency.** iOS composites it on a background — usually black — so a transparent PNG gets an unintended dark backdrop. Give this one a solid background colour.

## Mobile apps: one master, not a folder of exports

This is where old guides waste the most of your time. Historically you shipped dozens of pre-scaled icon files per platform. That's no longer how it works.

**iOS.** Provide a single **1024 × 1024** App Store icon. Xcode has generated the smaller sizes from it for several versions now. The icon must be square, opaque, and free of pre-applied rounded corners — the system applies its own mask, and baked-in corners produce a visible double-rounding.

**Android.** The Play Store listing needs **512 × 512**. In the app itself, adaptive icons are made of a foreground and a background layer, each **108 dp**, of which only the centre **72 dp** is guaranteed visible — the launcher masks the rest to a circle, squircle or rounded square depending on the device. That safe-zone rule is why corner-to-corner artwork gets clipped on some phones and not others.

The practical takeaway: **hand your developer one large, clean, generously padded square.** The toolchain does the rest.

## Social profile pictures

Every major network takes a square upload and displays it as a circle or a rounded square. Which means two rules cover all of them:

1. **Upload a large square** — 512 px is comfortably enough. Every platform resamples server-side; pre-sizing to some exact display dimension gains nothing and adds a resampling pass.
2. **Keep the mark inside the inscribed circle.** A circular mask on a square keeps roughly 78% of the area. Corners are dead space. Design as if they don't exist.

Chasing per-platform pixel dimensions for profile pictures is largely wasted effort in 2026 — the display sizes change without notice, and the platforms downscale whatever you give them. What doesn't change is the circle.

Cover images and banners are a genuine exception: those are non-square, compositional, and platform-specific. They need a design decision per platform, not a size ladder.

## The sizes you can stop generating

- **Dozens of pre-scaled iOS app icon files.** One 1024 px master replaces them.
- **`apple-touch-icon-precomposed`.** Long obsolete.
- **Windows tile images (`browserconfig.xml`).** Effectively dead surface area.
- **Every individual density bucket for Android launcher icons.** Adaptive icon layers replace them.

Trimming this list is not just tidiness. Each unnecessary file is another asset that drifts out of sync the next time your logo changes.

## Generating the set in one pass

The reason people ship stale or inconsistent icons is that regenerating them manually is tedious enough to postpone. One rebrand means re-cropping, re-padding and re-exporting the whole ladder by hand.

Autocropper collapses that to a single step: drop in the logo, and it detects the mark's bounding box, removes uniform or transparent background, squares the crop with consistent padding, and resamples 16, 32, 48, 64, 128, 256 and 512 px directly from the source crop — each size derived from the original, never from another output. It runs entirely in your browser, so an unreleased brand mark never gets uploaded anywhere.

[Generate every icon size from one logo](/#hero-tool) and download the whole set as a ZIP.

For the underlying mechanics of one-source-to-many-sizes, see [how to crop one image into multiple sizes](/blog/crop-one-image-into-multiple-sizes). For the padding and masking rules in more depth, see [resizing your logo to every size](/blog/resize-logo-to-every-size).

## A checklist before you ship

- The 16 px version is still **recognisable**, not a grey smudge. If not, use a simplified mark for the favicon.
- Nothing important sits in the **outer 8%** of the square.
- The apple-touch-icon and store icons are **opaque**.
- No **pre-applied rounded corners** on app store icons.
- Checked **on a white background** for edge halos, and on a dark one for the reverse.
- All sizes derive from the **same source crop**, so they look like the same icon.

## FAQ

### What icon sizes do I actually need in 2026?

For the web: 16, 32 and 48 px favicons, a 180 px apple-touch-icon, and 192 and 512 px manifest icons. For mobile apps: a single 1024 px master for iOS and 512 px for the Play Store listing. Everything else is generated by the toolchain.

### Is favicon.ico still required?

Not required, but still worth shipping. Browsers request `/favicon.ico` regardless of what you declare in your markup, so having one avoids unnecessary 404s. The PNG icons are what most users actually see.

### What size should a profile picture be?

A square at 512 px or larger, with the mark kept inside the inscribed circle. Platforms downscale server-side, so a larger square is always safer than trying to match a specific display size.

### Why does my app icon look wrong on Android but fine on iOS?

Android launchers apply different masks — circle, squircle, rounded square — depending on the device, and they crop more aggressively than iOS. Artwork that reaches the edges survives iOS and gets clipped by some Android launchers. Respect the 72 dp safe zone.

### Should app store icons have rounded corners?

No. Supply a full square. Both platforms apply their own corner mask, and baked-in corners show up as a visible double-rounded edge.

### Can I generate all these sizes without uploading my logo?

Yes. Autocropper does the cropping, background removal and resampling locally with the Canvas API, so the file never leaves your browser.
