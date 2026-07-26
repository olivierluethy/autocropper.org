---
title: "Add a Favicon to a Next.js Site From Your Logo"
slug: "nextjs-favicon-from-logo"
description: "Next.js has a clean file convention for favicons: drop your icons into the app directory and it generates the tags. Here's the full setup, from your logo to shipped."
date: "2026-07-25"
readTime: "6 min"
seoIndex: "yes"
---

# Add a Favicon to a Next.js Site From Your Logo

Next.js makes favicons easier than most frameworks — you usually don't write a single `<link>` tag. In the App Router, you drop icon files into the `app` directory with specific names, and Next generates the correct head tags for you, reading the size and type straight from the file.

The part it doesn't do is turn your logo into those icon files in the first place. Here's the whole path: make the icons from your logo, then wire them in the Next.js way.

*(The conventions below are the App Router's, current as of recent Next.js versions. If you're on an older release or the Pages Router, see the section at the end.)*

## Step 1 — Make the icons from your logo

Drop your logo into the tool at the top of this page. It removes the flat background, cleans the edges (no white halo on a dark tab), crops to the mark, centres it on a transparent square, and gives you PNGs at 16, 32, 48 and up — all in your browser, nothing uploaded.

For a Next.js site you'll want:

- **16×16 and 32×32** — the browser favicon (both are free preset sizes).
- **180×180** — the Apple touch icon, for iOS home screens (a custom size on Pro, or scale the 256 export; make this one opaque, since iOS shows transparency as black).
- **192×192 and 512×512** — if you're shipping a web app manifest (512 is a preset; 192 is a custom size or scaled from 256).

Download the set and drop the files into your project.

## Step 2 — Wire them in with the App Router file convention

The simplest approach: place specially named files in your `app` directory and let Next.js do the rest.

```
app/
  favicon.ico       → Next serves it and adds the icon link automatically
  icon.png          → <link rel="icon"> with size and type inferred from the file
  apple-icon.png    → <link rel="apple-touch-icon"> (use your 180, opaque)
```

Next.js reads the image's dimensions and MIME type and writes the correct `<link>` tags into `<head>` for you. Drop a crisp `icon.png` (your 32) in there and the browser tab is handled; add `apple-icon.png` and iOS is handled too. You can provide multiple icon files if you want to serve several sizes.

## Alternative — the metadata API

If you'd rather keep the files in `public/` and be explicit, define them in the `metadata` export of your root layout:

```tsx
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};
```

Both approaches produce the same head tags; pick whichever fits how your project is organised.

## Optional — the web app manifest

If your site is a PWA, add a manifest with the 192 and 512 icons. In the App Router you can generate it in code:

```ts
// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Your App",
    short_name: "App",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

## If you're on the Pages Router

Put the icon files in `public/` and add the tags manually in `pages/_document.tsx`:

```tsx
<Head>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
</Head>
```

## A note on PNG vs .ico

Older setups insist on a `favicon.ico`. Next.js is happy with either, and PNG favicons are sharper than a low-colour `.ico`. Autocropper outputs PNGs, so you can either use those as your `icon.png`, or keep the default `app/favicon.ico` Next scaffolds — both work in every modern browser.

## Do it now

Got your logo open? Drop it in, grab the 16/32 (and a 512 if you need the manifest), and drop them into `app/`. Next.js writes the tags; you ship. Everything happens on your device — no upload.

[Make your Next.js favicons →](https://autocropper.org/)

## Bottom line

In the Next.js App Router, favicons are a file-convention job: put `icon.png`, `apple-icon.png` and optionally `favicon.ico` in `app/`, and Next generates the tags. The one thing it won't do is cut those icons from your logo — do that first, in one drag, locally.

## FAQ

**Where does the favicon go in Next.js?**
In the App Router, in the `app` directory: `favicon.ico`, `icon.png`, and `apple-icon.png`. Next.js generates the `<link>` tags automatically. In the Pages Router, put them in `public/` and link them in `_document.tsx`.

**Do I need to add link tags myself?**
Not with the App Router file convention — Next writes them for you. The metadata API and Pages Router approaches use explicit tags.

**Does Next.js support PNG favicons?**
Yes. Drop an `icon.png` in `app/` and Next infers the size and type. PNGs are sharper than `.ico`.

**What sizes do I need?**
16 and 32 for the browser favicon, 180 for the Apple touch icon (opaque), and 192 + 512 if you ship a manifest.

**Is my logo uploaded to make the icons?**
No. Background removal, cropping and resizing run entirely in your browser tab.

## Related

- [Logo to favicon: turn your logo into a complete favicon set](/blog/logo-to-favicon-set)
- [Apple touch icon: what size it is and how to make one](/blog/apple-touch-icon-size)
- [PWA icon sizes and the web app manifest (192 & 512)](/blog/pwa-icon-sizes)
- [Favicon sizes: the complete list](/blog/favicon-all-sizes)