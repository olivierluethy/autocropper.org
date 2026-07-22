---
title: "Apple Touch Icon: What Size It Is and How to Make One"
slug: "apple-touch-icon-size"
description: "The Apple touch icon is 180×180 px. Here's what it's for, why it should be opaque, and how to make one from your logo in seconds — no upload, no blurry edges."
date: "2026-07-21"
readTime: "5 min"
seoIndex: true
---

# Apple Touch Icon: What Size It Is and How to Make One

The short answer: **make your Apple touch icon 180×180 pixels, a square PNG, with a solid (non-transparent) background.** That single file covers modern iPhones and iPads — iOS scales it down for smaller contexts, so you don't need the long list of sizes older guides still recommend.

Below is what the Apple touch icon actually is, why the format details matter, and how to get a clean one out of your logo without uploading it anywhere.

## What the Apple touch icon is for

When someone taps "Add to Home Screen" on your site in Safari, iOS needs an icon to put on the home screen. That icon is the **Apple touch icon**, declared in your HTML like this:

```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

iOS will also auto-detect a file named `apple-touch-icon.png` in your site root even without the link tag, but declaring it explicitly is the reliable approach.

## The size and format rules that actually matter

**Size: 180×180.** This is the resolution for current Retina iPhones and iPads. You can technically ship several sizes (152, 167, 120…), but Apple scales a single 180×180 down cleanly, and one file is simpler to maintain. Provide the one unless you have a specific reason not to.

**Format: PNG.**

**Make it opaque.** This is the detail most favicon generators get wrong. iOS applies a rounded-corner mask to your icon, but it does **not** add a background behind it — so any transparent areas render as **black** on the home screen. An Apple touch icon should be a full square filled edge to edge, usually with your brand colour or white behind the mark, not a transparent PNG.

**Don't pre-round the corners, and don't add the old gloss.** iOS rounds the corners itself. Ship a square, full-bleed image; if you round it yourself you'll get a double-rounded, clipped look. (The glossy highlight iOS used to add was dropped years ago — a flat icon is correct now.)

**Leave a little breathing room.** Because iOS clips the corners, keep the important part of your mark slightly in from the edges so nothing critical gets cut.

## How to make one from your logo

Autocropper's core job is turning a logo into a clean, cropped, centred, transparent square in one drag — no account, no upload, everything in your browser tab. That gets you 90% of the way to an Apple touch icon and the *whole* way to your browser favicons.

The honest part: because Autocropper outputs a **transparent** square (which is exactly what you want for favicons and PWA manifest icons), the last step for the Apple touch icon specifically is putting that clean mark on a **solid background**, since iOS wants an opaque icon. Two straightforward paths:

- **If your logo already sits on a solid tile** (a brand-colour square, for example), it's already Apple-touch-ready in shape — you just need it cropped, squared and sized correctly.
- **If your logo is a bare mark,** run it through Autocropper to get the clean transparent square, then drop that onto a solid brand-colour or white background at 180×180 in any editor. One quick composite and you're done.

On sizes: Autocropper's free preset ladder is 16, 32, 48, 64, 128, 256 and 512 px. The exact **180×180** Apple touch size is available as a **custom size on Pro** (5 CHF/month). If you'd rather stay on the free tier, the 256 px export scales down to 180 cleanly in the browser — not pixel-perfect, but fine for most sites.

While you're there, the same run gives you your full browser favicon set as transparent PNGs. See [logo to favicon: turn your logo into a complete favicon set](/blog/logo-to-favicon-set) for wiring those in.

## Why the edges stay clean

The reason a hand-exported icon often looks rough at small sizes is two-fold, and Autocropper handles both: it un-mixes the leftover background colour from semi-transparent edge pixels (so there's no pale halo around the mark), and it downscales with Lanczos-4 resampling rather than a crude shrink, which keeps thin strokes and curves legible instead of aliased. It's deterministic image processing, not an AI guess — the same input gives the same clean output every time.

## Do it now

Got your logo open? Drop it into the tool at the top of the page, check the before/after preview, and grab the square. If you need the pixel-exact 180 and the rest of your favicon set in one go, that's what it's built for — and nothing leaves your device.

[Turn your logo into an icon set →](https://autocropper.org/)

## Bottom line

Apple touch icon: **180×180, PNG, opaque, square, corners left un-rounded.** One file covers modern iOS. Get a clean, cropped square of your mark from your logo in seconds, put it on a solid background for iOS, and reference it with a single `apple-touch-icon` link tag.

## FAQ

**What size should an Apple touch icon be?**
180×180 pixels. It's a square PNG, and iOS scales that single file down for smaller contexts, so you generally don't need the older list of multiple sizes.

**Can the Apple touch icon be transparent?**
Best not to. iOS doesn't add a background behind it, so transparent areas can show up black on the home screen. Use a solid background — your brand colour or white.

**Do I need to round the corners myself?**
No. iOS applies its own rounded-corner mask. Ship a square, full-bleed image, or you'll get a clipped, double-rounded result.

**Where do I put the file?**
In your site root as `apple-touch-icon.png`, and declare it with `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`.

**Can Autocropper make the exact 180×180 size?**
The free preset sizes are 16/32/48/64/128/256/512. The exact 180 is a custom size on Pro; on the free tier the 256 export scales down to 180 cleanly for most uses.

## Related

- [Logo to favicon: turn your logo into a complete favicon set](/blog/logo-to-favicon-set)
- [Favicon sizes: the complete list](/blog/favicon-all-sizes)
- [The 2026 icon size guide](/blog/icon-size-guide-2026)
- [How to generate perfect app icons](/blog/how-to-generate-perfect-app-icons)