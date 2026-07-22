---
title: "How to Get Rid of the White Halo Around a Transparent PNG Logo"
slug: "white-halo-transparent-png"
description: "The white fringe around your transparent PNG logo is background colour trapped in the edge pixels. Here's why it happens and how to remove it cleanly, no upload."
date: "2026-07-23"
readTime: "6 min"
seoIndex: true
---

# How to Get Rid of the White Halo Around a Transparent PNG Logo

You removed the background from your logo, saved it as a transparent PNG, and dropped it onto a dark header — and now there's a faint white fringe tracing every edge. It looked fine on the white canvas where you made it. On anything darker, it's a halo.

That halo isn't a mistake in your export settings. It's leftover background colour trapped in the edges of the image, and there's a clean way to remove it. Here's what's actually happening and how to fix it.

## What the halo actually is

Look closely at the edge of any logo and it isn't a hard line — it's anti-aliased. The pixels along the boundary are partly the logo and partly whatever was behind it, blended together so the edge looks smooth instead of jagged. A pixel might be 60% logo colour and 40% background.

When a background remover cuts the logo out, it sets those edge pixels to be partly transparent (lower alpha) — but it often **leaves their colour alone.** So a pixel that's 40% white background keeps its whitish colour and just gets made semi-transparent. On a white page you never notice. Put it on a dark background and every one of those partly-white, partly-transparent edge pixels lights up as a pale fringe.

That's the halo: **the old background colour, still living in the anti-aliased edge, showing through the transparency.**

## Why it's worse on dark backgrounds

The contamination is almost always a light colour (most logos are cut from white or light backgrounds), so it hides against light pages and screams against dark ones. If your halo appears when you switch to a dark header, a dark app theme, or a coloured tile, this is why — the pixels didn't change, the contrast did.

## The proper fix: decontaminate the edges

Patching it by hand — erasing the fringe, contracting the selection, adding a stroke — either eats into the logo or leaves a hard, un-anti-aliased edge that looks worse. The correct fix is **edge decontamination** (sometimes called defringe or matte removal): for each semi-transparent edge pixel, take out the fraction of background colour that's mixed in, leaving only the true logo colour.

Because you know three things about each edge pixel — its current colour, its transparency, and the background colour it was cut from — you can recover the real colour with a bit of arithmetic: strip out the background's contribution, weighted by how transparent the pixel is, and keep what's left. Roughly, `true colour = (pixel − background × (1 − alpha)) / alpha`. Do that across the whole edge and the white vanishes, while the smooth anti-aliasing stays intact.

The catch: this only works when the tool **knows the original background colour.** That's why the reliable fix is to re-cut from the original image, not to patch the already-broken PNG.

## How to fix it (the fast way)

If you still have the **original logo on its background** (the white or light-grey version before you cut it out), this is a one-drag job:

1. Drop that original into the tool at the top of this page.
2. It detects the flat background, removes it, and — crucially — un-mixes that background colour out of every edge pixel in the same pass. No fringe survives to become a halo.
3. Check the 2× preview against a dark backdrop to confirm the edges are clean, then download.

The whole thing runs in your browser tab — nothing is uploaded — and it's deterministic classical image processing, not an AI guess, so the edges come out the same every time. It works on flat or near-flat backgrounds (white, light grey, a brand colour, a soft gradient); busy photographic backgrounds aren't the target.

**If you only have the haloed PNG** and not the original, there's no background colour left to sample, so a tool can't know the fringe was white. Your options there are an editor's white-matte defringe (Photoshop's *Layer → Matting → Remove White Matte*, or an equivalent), or — better — going back to the source logo and re-cutting it cleanly. Re-cutting from the original almost always beats trying to rescue a bad cutout.

## Do it now

Got the original logo open? Drop it in, switch the preview to a dark background, and watch the halo not appear. You'll also get the full square icon set out of the same run.

[Remove the halo from your logo →](https://autocropper.org/)

## Bottom line

The white halo is background colour trapped in your logo's anti-aliased edges, invisible on white and obvious on dark. The fix is to decontaminate those edges — un-mix the background colour out — which works cleanly when you re-cut from the original image rather than patching the exported PNG. One drag, done, nothing uploaded.

## FAQ

**Why does my transparent PNG have a white outline?**
The anti-aliased edge pixels are part background colour. When the background was removed, those pixels were made transparent but kept their whitish colour, so they show as a fringe on darker backgrounds.

**Why does the halo only show up on dark backgrounds?**
The trapped colour is light, so it blends into light pages and stands out against dark ones. The pixels are the same; only the contrast changed.

**Can I fix the halo without the original image?**
Partly — an editor's white-matte defringe can help — but the clean fix needs the original background colour, which a tool can only get from the original image. Re-cutting from the source gives the best result.

**Does Autocropper remove the halo automatically?**
Yes, when it does the background removal itself: it un-mixes the detected background colour out of the edge pixels in the same pass, so no fringe is left behind. It works on flat or near-flat backgrounds.

**Is my image uploaded to do this?**
No. Decoding, background removal and edge decontamination all run in your browser tab. Nothing is sent to a server.

## Related

- [Why your icons look blurry — and how to fix it](/blog/why-your-icons-look-blurry)
- [Logo to favicon: turn your logo into a complete favicon set](/blog/logo-to-favicon-set)
- [The 2026 icon size guide](/blog/icon-size-guide-2026)
- [Resize a logo to every size you need](/blog/resize-logo-to-every-size)