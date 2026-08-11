# Autocropper.org — Technical SEO Audit (2026-08-11)

Scope inspected: live site (`https://www.autocropper.org`), `app/`, `components/`,
`lib/blog.ts`, all 27 posts in `content/blog/`, sitemap/robots/feed routes, and the
competitor **autocropper.io**.

## Executive summary

The foundations are genuinely good: the `seoIndex` mechanism in `lib/blog.ts` is
correctly built and correctly applied (20 indexed, 7 thin philosophy posts noindexed),
tag archives are `noindex,follow`, Article + Breadcrumb JSON-LD is emitted only on
indexed posts, and the internal cross-linking graph is dense. So this is a
tuning job, not a rebuild.

Three things are holding it back:

1. **Every canonical, sitemap URL, `og:url` and JSON-LD `@id` points to the wrong
   host.** The site serves on `www.` but the code declares the apex, and the apex
   307-redirects to `www.`. That's the single highest-leverage fix and it's one env var.
2. **The informational favicon/icon posts that get impressions-but-no-clicks are
   ranking but not converting** — they need intent/CTA surgery, not deletion.
3. **Structured data is half-wired** — `SoftwareApplication` exists but has no `offers`;
   the on-page FAQ and How-it-works blocks emit no schema at all.

Competitive note: **autocropper.io is a scanned-photo digitizer** ("Auto-crop images &
split scans into separate photos") with *zero* logo/favicon/app-icon content. It is not
your rival on any tool-intent query — those SERPs are wide open. It only collides with
you on the bare **"autocropper"** brand term via the .io TLD. Your defense there is a
clean canonical/brand signal (fix #1) and owning the tool-intent long-tail it ignores.

---

## Fix now (high impact, low effort)

**1. `.env` (`NEXT_PUBLIC_SITE_URL`) — canonical/host mismatch across the entire site — change the value from `https://autocropper.org` to `https://www.autocropper.org`, redeploy — consolidates all ranking signals onto one URL; stops Google from ignoring self-referencing canonicals that resolve to a redirect.**
Live evidence: `https://autocropper.org` returns `307 → https://www.autocropper.org/`,
yet the homepage emits `<link rel="canonical" href="https://autocropper.org"/>` and the
sitemap lists `<loc>https://autocropper.org/…</loc>` for every URL. `SITE_URL` in
`lib/blog.ts:25`, `app/robots.ts:3` and `app/layout.tsx:21` all read this one env var, so
one change fixes canonicals, `metadataBase`, `og:url`, `sitemap.xml`, `feed.xml`, the
`robots.txt` host line and the WebSite/Organization `@id`s simultaneously. Do **not**
hardcode — just flip the env value in the production environment.

**2. Vercel domain config (not in repo) — apex→www redirect is a 307 (temporary) — change it to a 308/301 permanent redirect and set `www` as the primary domain — lets Google permanently consolidate link equity from the apex instead of treating the move as temporary.**
Verify after fix #1 so the sitemap you submit contains only 200-status `www` URLs (a
sitemap full of redirecting URLs is a known crawl-quality flag).

**3. `content/blog/how-to-generate-perfect-app-icons.md` — thin indexed page (197 words) competing with your own pillar — set `seoIndex: false` and 301/link its topic into `icon-size-guide-2026.md`, OR expand it past ~700 words with a step list + tool CTA — removes a thin-content signal and concentrates authority on the pillar.**
It's `seoIndex: true` today (`content/blog/how-to-generate-perfect-app-icons.md:9`) and is
inbound-linked from `apple-touch-icon-size` and `pwa-icon-sizes`, so if you de-index,
repoint those links to `icon-size-guide-2026`.

**4. `content/blog/why-your-icons-look-blurry.md` — thin (257 words) but is a heavily-linked hub target — expand to ~700+ words (add "how to fix blurry icons" steps + `/#hero-tool` CTA) rather than de-index — it already collects internal links from 6 posts; make the page worth the equity.**

**5. `app/page.tsx:40-54` — `SoftwareApplication` schema has no `offers`, so it's ineligible for price/free rich results — add an `offers` array (Free + 5 CHF/mo Pro) — unlocks "Free" and price annotations in the SERP for the money page.**
Concrete addition inside the `SoftwareApplication` node:
```
offers: [
  { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
  { "@type": "Offer", price: "5", priceCurrency: "CHF", name: "Pro" }
]
```
Do **not** add `aggregateRating` unless you have real, displayable reviews — fabricated
ratings are a manual-action risk.

**6. `components/faq.tsx` + `app/page.tsx` — on-page FAQ (5 Q&As) emits no `FAQPage` schema — export the `items` array from `faq.tsx` and render a `FAQPage` JSON-LD `<script>` on the homepage from it — makes the homepage eligible for FAQ rich snippets, expanding SERP real estate on the brand query.**
The Q&A copy in `faq.tsx:7-33` is already ideal schema source (question + plain-text answer).

**7. `app/blog/[slug]/page.tsx` (footer CTA, line 214-221) — the only guaranteed tool link on every post uses the generic anchor "Open Autocropper" — make the anchor descriptive and keyword-matched per post (e.g. "Turn your logo into a favicon set") — descriptive anchor text passes topical relevance to the home/tool target instead of a brand-only signal.**
Pass a per-post `ctaLabel` (frontmatter or derived from primary tag) into the CTA.

---

## Do next (high impact, higher effort)

**8. Informational posts with impressions/no-clicks — rewrite for tool intent, do NOT de-index — they already rank (impressions = position), so convert them. Add a first-screen tool CTA + reframe title/H1/intro from "what is X" to "make X".** Per the brief these are the favicon/ico/icon-sizes queries:

| File | Current intent | Change |
|---|---|---|
| `content/blog/2026-07-25-favicon-ico-vs-png.md` | pure info ("ico vs png") | Keep the comparison but add an above-the-fold "Generate both .ico + PNG from your logo →" CTA linking `/#hero-tool`; retitle H1 to include "…and how to make both". |
| `content/blog/favicon-all-sizes.md` | info ("favicon sizes") | Already has a `/#hero-tool` link — move it above the fold; add a one-drag "Generate every favicon size" button after the first `<h2>`. |
| `content/blog/icon-size-guide-2026.md` | reference guide | Add a sticky/early "Generate this whole set in one pass →" CTA; it's the pillar, so make conversion the primary job. |
| `content/blog/2026-07-21-apple-touch-icon-size.md` | "what size is it" | Lead with "Make a 180×180 Apple touch icon from your logo" CTA before the explanation. |
| `content/blog/2026-07-24-android-app-icon-sizes.md` | ranks for info "android icon sizes" despite tool-framed title | Add first-screen CTA; the title is fine, the body buries the tool. |

**9. Newer tool-intent posts (the `2026-07-*` batch) — they cross-link to other posts but have NO in-body contextual link to the tool with descriptive anchor — add one contextual `/#hero-tool` link in the first two paragraphs of each — puts a relevant, descriptive internal link to the money page early where it passes the most equity and catches the most clicks.**
Verified: only 4 posts (`crop-one-image-into-multiple-sizes`, `favicon-all-sizes`,
`icon-size-guide-2026`, `resize-logo-to-every-size`) contain an in-body `/#hero-tool`
link. The other 16 indexed posts rely solely on the footer CTA.

**10. Indexed posts linking to noindex posts — leaks equity to de-indexed pages — repoint these links to indexed equivalents:**
- `content/blog/2026-07-23-resize-images-without-uploading.md` and
  `2026-07-26-online-image-tools-privacy.md` link `/blog/why-we-built-autocropper` (noindex) → repoint to `crop-one-image-into-multiple-sizes` or `online-image-tools-privacy`.
- `content/blog/2026-07-24-auto-trim-whitespace-logo.md` links
  `/blog/why-perfect-cropping-feels-surprisingly-important` (noindex) → repoint to `transparent-background-icon-from-logo`.
Effect: internal PageRank stays inside the indexable set instead of dead-ending on noindex pages.

**11. `app/page.tsx` (home) — the tool's step section has no `HowTo` schema — emit a `HowTo` JSON-LD from the `components/how-it-works.tsx` `steps` array (Upload → Process → Download) — eligibility for HowTo-style rich presentation and stronger "how to make an icon from a logo" relevance.** The three steps in `how-it-works.tsx:6-25` are already schema-ready.

**12. Add `HowTo` JSON-LD to the step-based tool posts** (`crop-one-image-into-multiple-sizes`, `logo-to-favicon-set`, `resize-logo-to-every-size`, the platform-icon posts) — each already contains an ordered "how to" list — reinforces tool intent and can win the step-by-step SERP feature the informational competitors don't have.

**13. Core Web Vitals — homepage LCP element is animation-hidden — `components/hero.tsx:75-94` wraps the `<h1>` (the LCP text) in a framer-motion block with `initial={{ opacity: 0, y: 12 }}`, so the largest element renders at opacity 0 until hydration runs the entry animation — remove the entry animation from the H1/subhead (or gate it behind `prefers-reduced-motion`/CSS that keeps it visible pre-hydration) — measurably improves mobile LCP, a ranking factor.** I could not pull live PSI numbers (no API key in this environment); instrument via PostHog web-vitals autocapture or run PageSpeed on `www.autocropper.org/` to confirm the delta.

---

## Later / optional

**14. `lib/blog.ts` image renderer (line 257-259) — blog markdown `<img>` tags render with no width/height — add intrinsic dimensions or an `aspect-ratio` wrapper — prevents CLS on image-heavy posts.** Low urgency (few posts embed images today) but bakes correctness in before they do.

**15. `app/layout.tsx:78-88` — three analytics libraries load (Vercel Analytics always, PostHog always, GA when keyed) — since PostHog is the analytics of record, drop `@vercel/analytics` (and leave GA unconfigured) — cuts client JS / Total Blocking Time on every page.** Cross-check with whoever owns dashboards before removing.

**16. `app/robots.ts:9` — the `host` field is non-standard (Yandex-only, ignored by Google) — harmless, but after fix #1 make sure it reads the `www` origin so the one crawler that honors it agrees.**

**17. `content/blog/2026-05-fastest-autocropper-for-logos.md` — slug promises "fastest autocropper for logos" (a valuable tool query) but the post is a noindexed automation essay titled "Why Modern Image Workflows Need True Automation" — either repurpose the slug for a real tool-intent post and index it, or leave it. The slug is currently wasted on de-indexed content.**

**18. Consider one dedicated, indexable comparison page — "Autocropper vs. \[manual workflow\] for logo icons"** — you already own the `ComparisonTable` component; a standalone page captures "best logo to icon tool"-style commercial-investigation queries. (Per the brief's constraint: this is *one* consolidation page, not mass production.)

---

## Keyword & competitor gap

**Competitive position.** autocropper.io targets scanned-photo digitization and mentions
no logos/favicons/app-icons at all — it does **not** outrank you on any tool-intent query
because it doesn't compete for them. The only overlap is the head term **"autocropper"**,
where the .io TLD creates brand confusion. Wins there come from (a) the canonical/host fix
consolidating your brand signal, (b) FAQ/SoftwareApplication rich results making your
result physically larger on the brand SERP, and (c) owning the long-tail below, which the
competitor ignores entirely.

**25 transactional, tool-intent long-tails to target** (mirroring what already converts —
"crop one image into multiple sizes", "resize logo to every size" — i.e. *make/resize/convert
X from a logo*). Each maps to an existing or lightly-adjusted post:

1. logo to favicon generator — `logo-to-favicon-set`
2. resize logo to all icon sizes — `resize-logo-to-every-size`
3. crop one image into multiple sizes — `crop-one-image-into-multiple-sizes`
4. make favicon from logo online — `logo-to-favicon-set`
5. generate all favicon sizes from one image — `favicon-all-sizes`
6. logo to app icon generator — `how-to-generate-perfect-app-icons` (after expansion)
7. logo to android app icon generator — `2026-07-24-android-app-icon-sizes`
8. create PWA icons from logo — `2026-07-22-pwa-icon-sizes`
9. make chrome extension icons from logo — `2026-07-22-chrome-extension-icon-sizes`
10. logo to apple touch icon — `2026-07-21-apple-touch-icon-size`
11. convert logo to ico and png — `2026-07-25-favicon-ico-vs-png`
12. transparent icon from logo maker — `2026-07-27-transparent-background-icon-from-logo`
13. remove white halo from transparent png — `2026-07-23-white-halo-transparent-png`
14. auto trim whitespace around logo — `2026-07-24-auto-trim-whitespace-logo`
15. make discord server icon from logo — `2026-07-26-discord-server-icon-size`
16. github org avatar from logo — `2026-07-27-github-org-repo-icon`
17. add favicon to next.js from logo — `2026-07-25-nextjs-favicon-from-logo`
18. resize image to multiple sizes in browser — `crop-one-image-into-multiple-sizes`
19. resize logo without losing quality — `resize-logo-to-every-size` / `why-your-icons-look-blurry`
20. batch resize logo to icon sizes — `crop-one-image-into-multiple-sizes`
21. make 512x512 icon from logo — `icon-size-guide-2026`
22. logo resizer for app store icons — `how-to-generate-perfect-app-icons`
23. resize png to 16x16 32x32 48x48 — `favicon-all-sizes`
24. offline / no-upload favicon generator — `2026-07-26-online-image-tools-privacy` + `resize-images-without-uploading`
25. square icon from logo generator — `2026-07-27-transparent-background-icon-from-logo`

Gaps with no strong page yet (candidates for *targeted* additions, not volume):
"logo to iOS icon set", "logo to Slack workspace icon", "logo to email signature size",
"OG image from logo (1200×630)".
