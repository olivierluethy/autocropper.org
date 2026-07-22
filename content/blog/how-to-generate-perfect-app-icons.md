---
title: "How to Generate Perfect App Icons"
slug: "how-to-generate-perfect-app-icons"
description: "A practical checklist for icons that look right on the web, on iOS, on Android — and on the App Store screenshot."
date: "2026-03-30"
updated: "2026-03-30"
author: "Autocropper"
tags: ["app-icon", "icons", "logo"]
seoIndex: true
canonical: ""
---
## Start with a square master

Always start from a square master at the largest size you'll ever need — 1024×1024 is the safe ceiling. Every smaller size is a downsample of that master. Never resize a small icon to a large one.

## Pad like the platforms expect

iOS clips icons to a rounded rectangle and applies a glossy mask. Android Adaptive Icons crop a square to a circle, square or rounded square depending on the launcher. **Always leave 6–10% safe-area padding** around the visual mark so the system mask doesn't bite into it.

## Check the halo on white

The most embarrassing icon bug is a near-invisible halo on white screens. Always preview your final icon **on a pure white background** before shipping. If you see a faint color outline, your background removal didn't decontaminate the edge.

## Generate every size, ship the ones you need

It's cheap to generate every preset size at once. It's expensive to discover three weeks later that your favicon is a stretched 16×16 favicon.ico instead of a clean 32×32 PNG.

Autocropper outputs 16, 32, 48, 64, 128, 256 and 512 by default. Drag and drop, hit "Download all", done.
