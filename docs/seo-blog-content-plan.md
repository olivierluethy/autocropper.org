# Autocropper — SEO Blog Content Plan
**Created:** 2026-08-11 · **Horizon:** ~2 weeks (11–22 Aug) · **Source:** 2026-08-11 technical SEO audit

## The strategy in one paragraph

This is not a mass-publishing plan, and on purpose. You already have 27 posts (20 indexed). The
audit showed the real losses are (a) posts that **rank but don't convert** — big impressions, ~0
clicks — and (b) a few technical leaks. So the highest-ROI blog work is *surgery on posts that
already rank*, plus a small number of new posts that are **actually in scope for the tool** (square
icons, 16–512px, transparent PNG). Publishing more generic favicon articles would only add more
zero-click impressions and raise the scaled-content risk on a young domain. Traffic follows
conversion here, not volume.

**Hard dependency:** the canonical/host fix (audit Fix #1/#2) must be deployed *before* new posts go
live, so they're indexed on `www.autocropper.org` from birth instead of the redirecting apex. Rewrites
of existing posts can start immediately.

---

## Scope check — the audit's four "gap" topics vs. what the tool does

The tool makes **square** icons, **16–512px**, **transparent** PNG, on-device. Checking each gap
topic against that constraint:

| Gap topic | Native size / shape | Fit | Verdict |
|---|---|---|---|
| **Slack workspace icon** | 512×512, square, PNG | ✅ Clean — 512 square is exactly your ceiling | **Write now** |
| **iOS icon set** | App Store icon 1024×1024, **opaque** (Xcode downscales from one 1024 master) | ⚠️ Partial — you cap at 512 and output transparent; only the ≤180px in-app sizes are servable | **Hold**, or write honestly for in-app sizes only |
| **Email signature logo** | ~200–300px, usually **horizontal / non-square** | ❌ Off-target — non-square | **Hold** until background-fill / custom-size ships |
| **OG image (1200×630)** | 1200×630, non-square, composed w/ text | ❌ Off-target — non-square and past 512 | **Hold** until background-fill / custom-size ships |

**Product note (recurring):** three of these (iOS App Store, email signature, OG image) become clean
fits the moment the tool gains a **background-fill + safe-zone toggle** and a **size ceiling above
512 (≥1024)**. That feature is the thing gating your new-content ceiling — worth prioritizing if you
want this topic space.

**Cleaner in-scope alternatives** (square, ≤512, same converting pattern as your winners) if you want
more new posts than just Slack: *logo to Notion workspace icon*, *logo to Microsoft Teams icon*,
*logo to Twitch profile picture*. Pick from these instead of the two off-target topics.

---

## Calendar (from today)

| Date | Content action | Type |
|---|---|---|
| Tue 11 Aug | *(Canonical/host fix deploys — dependency, not content)* | Fix |
| Thu 13 Aug | Rewrite batch 1: `favicon-ico-vs-png`, `favicon-all-sizes`, `icon-size-guide-2026` | Convert |
| Fri 14 Aug | Rewrite batch 2: `apple-touch-icon-size`, `android-app-icon-sizes` + repoint internal links + expand `why-your-icons-look-blurry` | Convert |
| Mon 18 Aug | **New:** `logo-to-slack-workspace-icon` *(only after canonical fix confirmed live)* | New |
| Wed 20 Aug | **New:** one in-scope square topic (Notion / Teams / Twitch — your pick) *or* iOS-honest | New |
| Backlog (gated) | email signature, OG image, iOS App Store — when background-fill + ≥1024 ships | Hold |

Net: **5 rewrites + 2 new posts** over two weeks, fully in scope, with a clearly-flagged backlog. That
respects your "content most days" cadence without the 38-post spam footprint.

---

## Part A — Rewrite the ranking-but-not-converting posts (do first, highest ROI)

These already rank (impressions = position). The job is to convert, not to rewrite from scratch. For
**each**: move a tool CTA **above the fold**, reframe title/H1/intro from "what is X" → "make X", keep
the reference content below. `seoIndex` stays `true`.

| Post | Target keyword (tool intent) | The change |
|---|---|---|
| `2026-07-25-favicon-ico-vs-png` | convert logo to ico and png | Keep the comparison; add above-fold CTA "Generate both .ico + PNG from your logo →" (`/#hero-tool`); H1 gains "…and how to make both". |
| `favicon-all-sizes` | generate all favicon sizes from one image | It already links `/#hero-tool` — move that above the fold; add a "Generate every favicon size" button after the first `<h2>`. |
| `icon-size-guide-2026` (pillar) | make 512×512 icon from logo | Add an early/sticky "Generate this whole set in one pass →" CTA; conversion is this page's primary job. |
| `2026-07-21-apple-touch-icon-size` | logo to apple touch icon | Lead with "Make a 180×180 Apple touch icon from your logo" CTA before the explanation. |
| `2026-07-24-android-app-icon-sizes` | logo to android app icon generator | Title's fine; add a first-screen CTA — the body currently buries the tool. |

**Same day as batch 2**, close the internal-link leaks (audit #9/#10): add one in-body `/#hero-tool`
link in the first two paragraphs of the 16 posts missing it, and repoint the links that currently dead-end
on noindex posts (`why-we-built-autocropper`, `why-perfect-cropping-feels-surprisingly-important`) to
indexed equivalents. And expand `why-your-icons-look-blurry` (257 words) to ~700 with "how to fix
blurry icons" steps + CTA — it's linked from 6 posts, so make the page worth that equity.

---

## Part B — New post spec (write now): Slack workspace icon

Full frontmatter + outline, ready to draft. Slug is date-free on purpose — your best performers
(`resize-logo-to-every-size`, `favicon-all-sizes`) use clean keyword slugs; steer new posts to that
convention to start resolving the slug inconsistency the audit flagged.

```yaml
---
title: "Logo to Slack Workspace Icon: Make a 512×512 Icon in One Drag"
slug: "logo-to-slack-workspace-icon"
description: "Turn your logo into a 512×512 Slack workspace icon in seconds — on-device, no upload. Get the exact size Slack wants, ready to drop in."
date: "2026-08-18"
readTime: "4 min"
seoIndex: true
---
```

**Answer-first intro (first screen):** Slack wants a **square icon, at least 512×512, PNG**. Drop your
logo into Autocropper, grab the 512px square, done. → **CTA button: "Make my Slack icon →"** (`/#hero-tool`),
above the fold.

**Body outline:**
1. The exact spec Slack expects (square, ≥512, PNG) — one short table.
2. How to make it from a logo in three steps (upload → 512px chip → download).
3. **Honest caveat:** Autocropper outputs a *transparent* PNG. Slack shows workspace icons on a colored
   sidebar, so flatten onto your brand color / a solid background first (or it'll look see-through). This
   is the honest framing — don't hide it.
4. Quick fixes: logo too small in the frame (trim whitespace), blurry at 512 (start from a larger master).

**FAQ block (→ FAQPage schema):**
- What size is a Slack workspace icon? (512×512, square, PNG)
- Can a Slack icon be transparent? (It can, but flatten to a solid background so it reads on the sidebar)
- Does Slack accept larger than 512? (Yes, square; 512 is the reliable minimum)

**Internal links:** in-body → `/#hero-tool` (first paragraph) and → `2026-07-26-discord-server-icon-size`
(sibling "platform icon" post) and → `icon-size-guide-2026` (pillar). Add this post to the pillar's
platform-icon list.

---

## Part C — Second new post (Wed 20 Aug): pick one

Use the **same template as Part B**. Choose one clean-fit topic:

- **`logo-to-notion-workspace-icon`** — Notion page/workspace icons are square, display small; 512
  master is plenty. Keyword: "logo to Notion icon". Same transparent-→-flatten caveat.
- **`logo-to-microsoft-teams-icon`** — Teams team icons are square. Keyword: "make Teams icon from logo".
- **`logo-to-twitch-profile-picture`** — square, 256+ min; 512 covers it. Keyword: "logo to Twitch profile
  picture".
- **iOS-honest** (only if you want it): target the **in-app** icon sizes (≤180px) explicitly, and state
  up front that the **1024 App Store icon needs a larger, opaque export the tool doesn't produce yet.**
  Converts worse than the platform topics above; I'd hold it until the size ceiling is raised.

---

## Backlog — gated on the background-fill + ≥1024 feature

Don't write these until the tool can output a filled background and sizes above 512, or they'll pull
traffic it can't serve:

- `og-image-from-logo` — "make OG image from logo", 1200×630
- `logo-size-for-email-signature` — non-square wordmark territory
- `logo-to-ios-app-icon-set` — full App Store flow (1024, opaque)

When that feature ships, these three plus a proper iOS post are your next content wave — and they open
meaningfully bigger query space than anything left in the square-icon niche.