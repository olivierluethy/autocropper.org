---
title: "Logo to Slack Workspace Icon: Make a 512×512 in One Drag"
slug: "logo-to-slack-workspace-icon"
description: "Turn your logo into a 512×512 Slack workspace icon in seconds — squares only, on-device, nothing uploaded. The exact size Slack wants, and how to make it."
date: "2026-08-11"
readTime: "4 min"
seoIndex: "yes"
---

# Logo to Slack Workspace Icon: Make a 512×512 in One Drag

You've got a logo file open and Slack is asking for a workspace icon. The spec is short: a **square PNG, at least 512×512 pixels**. That's the whole requirement — Slack rounds the corners itself and scales the display size down wherever the icon appears.

Autocropper makes exactly that from your logo, in your browser, with nothing uploaded to a server. Drag your logo in, take the 512px square, done.

**[Drop your logo into the tool at the top of this page →](/#hero-tool)**

## What Slack needs

| Requirement | Value |
|---|---|
| Shape | Square (1:1) |
| Minimum size | 512×512 px |
| Format | PNG (or JPG) |
| How it's shown | Rounded square in the sidebar and workspace switcher |

Upload a full square — don't pre-round the corners, Slack applies the mask. Anything square and 512px or larger is fine; 512 is just the reliable floor.

## Make it from your logo in three steps

1. **Drop your logo in.** The tool finds the mark and trims the dead space around it, so a logo with lots of padding still fills the square instead of sitting tiny in the middle.
2. **Take the 512px size.** Pick the 512 square from the size ladder. Each size is downscaled with Lanczos-4 resampling, so the edges stay clean rather than turning to mush the way a plain browser resize does.
3. **Download.** Grab the single 512px PNG, or the ZIP if you also want favicon and app-icon sizes from the same logo in one pass.

## The transparency catch

Autocropper outputs a **transparent** PNG. That's the right default for most icons, but Slack shows your workspace icon on a **colored sidebar** — so a transparent icon lets that background show through and can look see-through or washed out.

Before you upload to Slack, flatten your icon onto a **solid background** — your brand color, or a clean white or dark square. Any image editor does this in a few seconds, or start from a version of your logo that already sits on a solid square. (A one-tap background fill is on our list; it isn't in the tool yet, so this is a manual step for now.)

Two other honest limits worth knowing: the tool works on logos and graphic marks on flat backgrounds, not photographs, and it produces **squares only** — which is exactly what Slack wants here, but not what you'd use for a banner or header.

## Do it now

Drag your logo into the tool at the top of this page and take the 512px PNG. The **free tier** handles 5 logos a day with every preset size and a ZIP export — plenty for a one-off Slack icon. If you're setting up icons across a batch of brands, or you need a size that isn't in the preset ladder, **Pro (5 CHF/month)** drops the daily limit and adds custom sizes.

## Bottom line

Slack wants a 512×512 square. Autocropper turns your logo into that in one drag, on-device, with clean edges. Flatten it onto a solid background so it reads on the sidebar, and drop it into your workspace settings.

## FAQ

**What size is a Slack workspace icon?**
512×512 pixels, square, PNG. Larger square images work too — 512 is the minimum Slack asks for.

**Can a Slack icon be transparent?**
It can, but it's a bad idea: Slack shows it on a colored sidebar, so a transparent icon shows the background through it. Flatten your logo onto a solid background first.

**Does Slack accept icons larger than 512×512?**
Yes, as long as they're square. Slack scales the display down, so a 512px (or larger) square covers every place the icon appears.

**Do I need to round the corners myself?**
No. Upload a full square — Slack applies the rounded-square mask for you.

## Related

- [Icon size guide 2026: every icon size in one place](/blog/icon-size-guide-2026)
- [Make a Discord server icon from your logo (512×512)](/blog/discord-server-icon-size)
- [How to generate perfect app icons from a logo](/blog/how-to-generate-perfect-app-icons)
- [Why your icons look blurry (and how to fix it)](/blog/why-your-icons-look-blurry)