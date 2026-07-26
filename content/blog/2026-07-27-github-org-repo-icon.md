---
title: "GitHub Organization & Repo Icon: Make One From Your Logo"
slug: "github-org-repo-icon"
description: "A GitHub org avatar should be a square PNG, at least 500px. For a repo README logo, use a transparent PNG so it works in dark mode. Here's how to make both from your logo."
date: "2026-07-27"
readTime: "5 min"
seoIndex: true
---

# GitHub Organization & Repo Icon: Make One From Your Logo

There are two "icons" people mean on GitHub: the **organization avatar** (the square image next to your org name) and the **logo at the top of a repo's README**. Both come from the same source — your logo — but they have different requirements, and one detail trips up almost everyone: dark mode.

Here's how to make both, cleanly, from your logo.

## The organization avatar

Your GitHub org avatar should be a **square PNG, at least 500×500 pixels, under 1 MB.** GitHub resizes it down for the various places it appears, so give it a decent resolution to start with — a **512×512** export is ideal: square, above the minimum, and a tiny file.

GitHub displays org avatars with **rounded corners**, so keep your mark centred with a little margin. Anything jammed into the corners risks being clipped by the rounding. A compact symbol or monogram usually reads better here than a wide wordmark, since the avatar is small in most of the places it shows up.

## The README logo — and the dark-mode trap

Putting your logo at the top of a repo's README is a nice touch, but there's a catch: **GitHub has light and dark themes.** A logo saved with a white background looks fine on the light theme and sits in an ugly white box on the dark one.

The fix is a **transparent-background PNG.** With no background, your mark sits cleanly on whatever theme the reader is using. This is exactly what Autocropper produces, so it's a direct fit.

Embed it in your README with a bit of HTML so you can control the size and centre it:

```html
<p align="center">
  <img src="logo.png" width="120" alt="Your project logo">
</p>
```

If your logo is a solid dark colour that would vanish on the dark theme (or vice versa), GitHub also supports theme-specific images with the `<picture>` element:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo-dark.png">
  <img src="logo-light.png" width="120" alt="Your project logo">
</picture>
```

But for most logos, a single transparent PNG is all you need.

## What about a "repo icon"?

Repositories don't have their own square icon field — the owner's avatar (your org or user avatar) represents them in listings. The other thing sometimes called a repo icon is the **social preview image**, which appears when someone shares a repo link. That one is a **wide banner (1280×640), not a square**, so it's a different job — Autocropper produces square icons, not banners, so you'd make the social preview elsewhere.

## How to make it from your logo

1. Drop your logo into the tool at the top of this page.
2. It removes the flat background, cleans the edges (no white halo — which matters on a dark README), crops to the mark, and centres it on a transparent square.
3. Download the **512** for your org avatar, or any size for your README logo. Everything runs in your browser; nothing is uploaded.

## Do it now

Setting up an org or dressing up a README? Drop your logo in, grab the transparent 512, and it'll look right on both GitHub themes.

[Make your GitHub icon →](https://autocropper.org/)

## Bottom line

GitHub org avatar: **square PNG, at least 500px** (512 is ideal), mark centred for the rounded corners. README logo: a **transparent PNG** so it works on both light and dark themes. Both come from your logo in one drag, with clean edges and nothing uploaded. The wide repo social-preview banner is a separate, non-square job.

## FAQ

**What size should a GitHub organization avatar be?**
Square, at least 500×500 pixels, under 1 MB. A 512×512 PNG is ideal — GitHub resizes it for the places it appears.

**Why does my logo have a white box on GitHub dark mode?**
Because the logo has a white background. Use a transparent-background PNG and it sits cleanly on both the light and dark themes.

**How do I add a logo to my README?**
Embed it with an `<img>` tag (you can set the width and centre it). For logos that need different colours per theme, use the `<picture>` element with `prefers-color-scheme`.

**Can Autocropper make a repo social preview image?**
No — that's a wide 1280×640 banner, and Autocropper produces square icons. Use it for the org avatar and README logo; make the banner elsewhere.

**Is my logo uploaded?**
No. Background removal, cropping and resizing run in your browser tab.

## Related

- [Make a Discord server icon from your logo (512×512)](/blog/discord-server-icon-size)
- [How to make a transparent-background icon from a logo](/blog/transparent-background-icon-from-logo)
- [Logo to favicon: turn your logo into a complete favicon set](/blog/logo-to-favicon-set)
- [The 2026 icon size guide](/blog/icon-size-guide-2026)