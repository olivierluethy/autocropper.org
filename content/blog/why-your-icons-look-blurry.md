---
title: "Why Your Icons Look Blurry (and How to Fix Them)"
slug: "why-your-icons-look-blurry"
description: "Most blurry icons aren't a Retina problem — they're a downscaling problem. Here's what actually fixes them."
date: "2026-04-12"
updated: "2026-04-12"
author: "Autocropper"
tags: ["icons", "quality", "favicon"]
seoIndex: true
canonical: ""
---
## The myth of "Retina makes everything sharp"

If your 32×32 icon looks fuzzy on a 4K display, the culprit is almost never the screen — it's the source asset. Browsers and operating systems don't perform high-quality resampling at runtime. They use bilinear filtering at best, which is fast but soft.

## The two failure modes

Blurry icons usually fall into one of two buckets:

1. **The asset was upscaled at runtime.** A 16×16 favicon is being shown at 64 logical pixels. The browser fills in the gaps with linear interpolation and the result looks like watercolor.
2. **The asset was downscaled in a single jump.** A 1024×1024 export was scaled to 32×32 once, and the resampler didn't have enough information to preserve thin strokes.

## The fix: ship the right size, downsample multi-step

Generate your icons at every size you need, and produce each size with **multi-step downscaling** — halve, halve, halve, then a final adjustment to the target. That's what Autocropper does internally. Each halving step preserves more high-frequency detail than a single jump from 1024 → 32 ever will.

## Bonus: kill the halo

The other "blurry" effect that isn't actually blur — a faint colored halo around the icon — is decontamination drift. When you cut out a non-white background, the edge pixels still mix the foreground with the original background color. Solving `C = α·F + (1−α)·BG` for `F` recovers the true foreground color and your icon stops glowing.

This is exactly the math Autocropper runs on every pixel along the edge.
