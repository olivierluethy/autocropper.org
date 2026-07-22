---
title: "Logo to Favicon: Turn Your Logo Into a Complete Favicon Set"
slug: "logo-to-favicon-set"
description: "Turn your logo into a complete favicon set — 16, 32, 48px and up — in one drag, right in your browser. No upload, no blur, no white halo. Here's the how and the sizes."
date: "2026-07-21"
readTime: "6 min"
seoIndex: true
---

# Logo to Favicon: Turn Your Logo Into a Complete Favicon Set

You have a logo PNG. You need a favicon — the little icon in the browser tab — and ideally the handful of larger sizes that go with it, so your site looks right in a bookmark, on a phone home screen, and in a PWA install prompt.

The usual way to get there is annoying: open an image editor, crop the whitespace by eye, square it up, export at 16 px, watch it turn into mush, try again. Or paste your logo into an online favicon generator and hand your brand asset to a server you don't control.

Here's the shorter version. Drop your logo into the tool at the top of this page and you get the full set of transparent, square PNGs back in about five seconds — cropped to the mark, centred, and downscaled properly so the 16 px version is still legible. Nothing gets uploaded; the whole thing runs in your browser tab. Below is what sizes you actually need and how to wire them into your site.

## The favicon sizes you actually need

You don't need dozens of files. In 2026, a solid favicon set is small:

- **16×16 and 32×32** — the classic favicon, shown in the browser tab and bookmarks.
- **48×48** — used by some browsers and Android's search/results surfaces.
- **180×180** — the Apple touch icon, used when someone adds your site to an iOS home screen.
- **192×192 and 512×512** — referenced in your web app manifest for Android and PWA installs.

For the full breakdown of where each size shows up, see our [favicon sizes guide](/blog/favicon-all-sizes). This post is about getting them *out of your logo* without the quality falling apart.

Autocropper's preset ladder is **16, 32, 48, 64, 128, 256 and 512 px**, so it produces the classic favicon sizes (16/32/48) and the 512 manifest icon exactly. If you want the pixel-exact Apple touch (180) and Android (192) sizes as well, those are available as **custom sizes on Pro** — for many sites the standard ladder plus the 512 is enough, and every modern browser will scale a slightly larger PNG down cleanly.

## Why hand-made favicons look bad (and how this avoids it)

Two things wreck small icons, and they're worth understanding because they're the reason a naive export looks rough:

**The white halo.** If your logo sat on a white background and you removed it, the semi-transparent pixels along the edge still carry a fraction of that white. Shrink the image and those pixels smear into a pale fringe around the mark. Autocropper un-mixes that background contribution from every edge pixel before scaling, so the edge stays clean on any tab colour — light or dark.

**The 16 px collapse.** Scaling an image down is not just "throw away pixels". A crude downscale (the browser's default `drawImage` at a smaller size) aliases hard edges into jagged noise, which at 16 px is most of the icon. Autocropper uses Lanczos-4 resampling — the same approach OpenCV uses — which weighs neighbouring pixels properly and keeps thin strokes and rounded corners readable at tiny sizes.

It's also worth saying what this *isn't*: there's no AI model guessing at your logo. It's deterministic image processing — corner-sampling to find the background, a connected-component pass to keep every part of the mark together (a wordmark plus a detached symbol plus the dot on an "i" stay as one logo, instead of cropping to the biggest shape), then crop, centre, and scale. Same input, same output, every time.

## How to turn your logo into the full set

1. **Drop your logo in.** Drag a PNG, JPG, or WebP onto the tool above, use the file picker, or paste from your clipboard. Flat or near-flat backgrounds work best — white, light grey, a brand colour, a soft gradient.
2. **Let it crop and clean up.** It finds the mark, removes the background, trims the dead space, and centres the logo on a transparent square. You'll see a before/after preview with a 2× zoom so you can check the edges at 16, 48, and 128 px.
3. **Download.** Grab any single size, or the whole set plus your source as `autocropper-icons.zip`.

No account, no email, no watermark. On the free tier you can process 5 logos a day; Pro (5 CHF/month) removes the limit and unlocks custom sizes.

## Wiring the favicons into your site

Once you have the PNGs, drop them in your site's root (or `public/` folder) and add this to your `<head>`:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

And reference the larger icons in your web app manifest:

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

A note on `.ico`: you'll see older guides insist on a `favicon.ico` file. Modern browsers all accept PNG favicons declared with `<link rel="icon" type="image/png">`, and PNGs are sharper than a low-colour `.ico`. Autocropper outputs PNGs, not a bundled `.ico` — which is what almost every current setup wants anyway.

## Do it now

If you've got a logo open, this is a 30-second job: drop it into the tool at the top of the page, check the preview, download the ZIP. Everything happens on your device — open your browser's network tab and you'll see there's no upload.

[Turn your logo into a favicon set →](https://autocropper.org/)

## Bottom line

A favicon set is small — a couple of true favicon sizes, an Apple touch icon, and the manifest icons. The hard part was never the sizes; it was getting a clean, centred, halo-free version of your logo at each one without a Figma round-trip or uploading your brand asset to a stranger's server. Drop the logo in, get the set, wire in four lines of HTML.

## FAQ

**Do I still need a favicon.ico file?**
Not for modern browsers. They accept PNG favicons via `<link rel="icon" type="image/png">`, and PNGs look sharper. Autocropper outputs PNGs rather than a multi-resolution `.ico`.

**What image formats can I upload?**
PNG, JPG/JPEG, WebP, BMP, or GIF, up to 10 MB, one image at a time. SVG isn't accepted — the tool works on raster images.

**My logo is on a white background. Will there be a white box around it?**
No. It detects the flat background, removes it, and un-mixes the leftover background colour from the edge pixels, so you get a clean transparent square with no halo. Busy or photographic backgrounds aren't the target — for those, remove the background first and feed the result back in.

**Can I get the exact 180×180 and 192×192 sizes?**
The free preset ladder covers 16/32/48/64/128/256/512. The pixel-exact Apple touch (180) and Android (192) sizes are available as custom sizes on Pro. For most sites the standard sizes plus the 512 manifest icon are enough.

**Does my logo get uploaded anywhere?**
No. The entire pipeline runs in your browser tab — decoding, cropping, background removal, and resizing all happen on your device. Nothing is sent to a server.

## Related

- [Favicon sizes: the complete list](/blog/favicon-all-sizes)
- [The 2026 icon size guide](/blog/icon-size-guide-2026)
- [Why your icons look blurry — and how to fix it](/blog/why-your-icons-look-blurry)
- [Resize a logo to every size you need](/blog/resize-logo-to-every-size)