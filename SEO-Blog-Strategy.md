# Autocropper — Blog Content Strategy & Writer's Brief

**Version 1.0 — 22 July 2026**
This document is self-contained. Anyone (a human writer, ChatGPT, Claude, or any other model) should be able to read it and produce a blog post that fits our site, our strategy, and our format — without further instructions. If you are an AI, read the whole document before writing anything, and follow the self-reflection instruction in the final section.

It is the sibling of the WhatsApp Web Customizer strategy, adapted to a very different product and a very different conversion model. Two things are not the same and drive most of the differences below: **the tool lives on the same page as the answer** (there is nothing to install), and **the blog has essentially no organic traction yet** (see the data in Part 1). Read Part 1 and Part 7 before you get excited about the calendar.

---

## PART 1 — WHY WE BLOG (the goal behind every post)

We make **Autocropper** (autocropper.org): a browser tool that turns **one logo image into a complete square icon set** — 16, 32, 48, 64, 128, 256 and 512 px transparent PNGs — in about five seconds, **entirely inside the browser tab, with nothing uploaded to any server.** It finds the mark, removes a flat background, crops away dead space, centres the mark on a transparent square, and downscales each size with Lanczos-4 resampling. Free tier: 5 logos/day, all preset sizes, ZIP export. Pro: 5 CHF/month for unlimited logos and custom sizes.

The blog exists for **one primary goal: acquire people who are mid-task with a logo file open and get them to finish that task in our tool** — and, over time, convert the heaviest users (agencies, people doing volume, people who need custom sizes) to Pro.

### The conversion model is different from an extension — and it's better

The WhatsApp Customizer blog has to move a reader from a post to the Chrome Web Store, through an install, into first use. Three steps, three chances to lose them.

**Autocropper has none of that.** The answer to the search query and the tool that performs it are the same URL. A reader who lands on "how to make a favicon from your logo" can drag their logo into the widget above the article and have the files in seconds, in the same session, without leaving. This is the single biggest structural advantage we have, and every post should be built to exploit it: **answer the query in the first screenful, then let them do it right there.**

The corollary is that our conversion event is not "install". It is **"processed a logo / downloaded the ZIP"**, and further down, **"upgraded to Pro"**. Pageviews are a vanity metric. A post that gets 2,000 impressions from people who then bounce is worth less than one that gets 300 impressions from people who drop a logo in. See measurement in Part 7.

### The data that drives this — and a reality check (as of 22 July 2026)

Read this honestly. From Google Search Console (last 3 months):

- **Nearly all our traffic is branded.** "autocropper" — 48 clicks / 1,092 impressions. The next queries with any clicks are just misspellings of the brand ("auto croper" 3, "auto cropper" 1). Total organic clicks across all queries are in the low fifties, and almost every one is someone typing our name.
- **The blog currently drives ~0 clicks.** Individual posts (`the-future-of-image-editing-is-less-editing`, `2026-05-fastest-autocropper-for-logos`) show a handful of *impressions* and **zero clicks**. Our existing 12 posts are not yet ranking for anything that earns a click.
- **But the non-branded intent already touches the domain.** In impressions-only (0 clicks so far) we see: `auto crop` (24), `icon cropper` (7), `autocrop` (7), `auto crop images` (6), `image autocropper` (4), `auto image cropper` (3). These are low volume, but they are exactly the icon/crop intent our content should own. We show up for them and don't yet earn the click — that gap is the opportunity.

**What this means:** unlike the WhatsApp blog (which drives ~60 visits/day from posts), **the Autocropper blog is a cold start.** Do not expect two-posts-a-day to "galvanise" traffic in days. On a young, low-authority domain, first meaningful blog clicks are a matter of weeks-to-months. The good news is that when they do come, they convert harder than the WhatsApp equivalent, because the tool is on the page. Build for that payoff, not for an overnight one.

### The differentiators, in the order worth writing about

1. **Nothing is uploaded.** No upload endpoint exists; it's verifiable in the network tab. Hardest-to-copy advantage; the whole answer to every "without uploading / offline / privacy" query.
2. **One input → the whole size ladder.** Competitors give one output size per run; we produce the full set in one pass.
3. **Logo-aware cropping.** A multi-component union bounding box keeps a wordmark + detached symbol + the dot on an "i" together as one logo, instead of cropping to the biggest blob.
4. **Edge quality.** Colour decontamination (kills the white halo) + Lanczos-4 downscale (keeps 16 px legible), not `drawImage` at a smaller size.
5. **Zero friction.** No signup, no API key, no watermark, no queue.

### The relevance principle (the core lesson, borrowed and re-pointed)

The WhatsApp lesson was "write about customization, not troubleshooting." Ours is narrower and harder-edged because **the tool physically only does one thing: square icons and favicons from a logo or graphic mark on a flat background.** It does not crop photos, it does not do banners or non-square sizes, it does not batch many source images, and it rejects SVG.

So every new post must pass this test before it's written:

> **"Does the person searching this query have a logo or graphic mark and need square icons, favicons, or app icons — something Autocropper can finish on this page?"**
> If yes → strong candidate. If they want to crop a photo, produce a non-square/banner/OG image, batch a folder of images, or upload an SVG → **weak candidate; the tool can't serve them and they'll bounce. Skip it.**

Chasing generic "crop image online" head terms is our version of the WhatsApp troubleshooting trap: high impressions, wrong audience, they leave. We are de-prioritising them on purpose (see Part 2).

---

## PART 2 — THE CONTENT STRATEGY (what to write)

The cluster where we are most differentiated and competition is thinnest is **logo → icon set.** Prioritise it over generic "crop image" head terms, which are owned by Canva, Adobe Express and iLoveIMG and which we serve badly (squares only).

### Tier 1 — Task-completion posts (our flagship format)

A post that answers a "how do I turn my logo into X" query and then lets the reader **do it in the tool on the same page.** These are the highest-value format because answer and tool are colocated — this is the WhatsApp "theme download" moment, except we don't need to ship any files first; the tool is intrinsic to the how-to.

Examples: "Logo to favicon set", "Logo to Chrome-extension icons (16/32/48/128)", "Logo to Discord server icon (512)", "Add a favicon to a Next.js site from your logo", "Auto-trim the whitespace around a logo". Each targets one specific, high-intent long-tail and ends with a drag-your-logo-in CTA.

Why this format wins: it matches a searcher who is mid-task, it demonstrates the product instead of describing it, and it's the shortest path from impression to a processed logo.

### Tier 2 — Reference posts (evergreen authority)

"What size is X" / "all the sizes for Y" posts: Apple Touch icon size, Android adaptive-icon / mipmap sizes, PWA manifest icon sizes, "favicon.ico vs PNG in 2026". These earn steady evergreen traffic and backlinks, build the domain authority that lifts Tier 1, and carry a natural CTA ("…and here's how to generate every one of these in a few seconds, on this page"). Keep the reference genuinely accurate — a wrong size table gets called out and loses trust.

### Tier 3 — Quality / problem-solving posts

Someone with a specific defect: "white halo around my transparent PNG logo", "PNG loses quality when I resize it", "how do I make a transparent-background icon". We have a **real technical answer** to these (decontamination, Lanczos-4), which is exactly the unhyped, explain-the-mechanism voice this brand wants. High intent, differentiated, and the fix *is* the tool.

### Tier 4 — Privacy / local-processing posts

"Resize images without uploading", "offline image/icon resizer", "the privacy problem with online image tools", "can agencies legally paste client logos into a SaaS uploader". The no-upload architecture is the entire answer. This is also our closest thing to a monetization runway: the people who care most about not uploading — agencies, privacy-sensitive teams, anyone processing volume — are the ones most likely to hit the free limit and want Pro. Write these honestly (see limitations); do not imply we do things we don't.

### Supporting / top-of-funnel (use sparingly)

Softer workflow posts ("icon generator vs exporting by hand") that link *down* into Tiers 1–4. **Caution:** we have already published several manual-vs-automated pieces ("stop doing things manually", "the hidden cost of manual image processing", "why speed matters more than features"). Do not write another one — that cluster is saturated. Only add a top-of-funnel post if it targets a genuinely new query and links to newer Tier 1 posts.

### What we are NOT writing (unless a specific reason exists)

- **Generic "crop image online" / "photo crop" head terms.** Wrong audience, we serve squares-and-marks only, they bounce. (This is the relevance-principle trap.)
- **Non-square / banner / OG-image / social-cover sizing posts.** The tool physically cannot produce these. Drawing that traffic just fails it.
- **Batch-many-images posts.** We do one-image-to-many-*sizes*, not many-images-to-one-size. "Bulk" means the ZIP of sizes, never a folder of logos.
- **Anything implying we accept SVG.** The upload validator rejects SVG. (The site's `how-it-works` copy currently implies otherwise — that copy is wrong; do not propagate it.) An "SVG vs PNG for favicons" post is allowed *only* if it never implies you can upload an SVG to us.
- **Photo / people / product cutout posts.** That's remove.bg's lane; we do marks on flat backgrounds.
- **Duplicate / cannibalising posts.** Check every topic against the already-published list below. If an existing post owns that intent, **improve it, don't duplicate it.**
- **Fabricated anything.** Never invent user counts, benchmarks, testimonials, or study results. "~150× faster" and "10–15 minutes manually" are existing marketing *framings*, not measured data — use them as framing, never as cited statistics. And **never call the tool AI or ML** — it's deterministic classical image processing, and that fact is part of the pitch.

### Already published (do not cannibalise — extend and link instead)

`content/blog/` currently covers: icon size guide 2026, resize logo to every size, how to generate perfect app icons, favicon all sizes, crop one image into multiple sizes, why your icons look blurry, the hidden cost of manual image processing, why speed matters more than features, why perfect cropping feels surprisingly important, the future of image editing is less editing, stop doing things manually, why we built autocropper.

Note the live overlaps to route around: new favicon posts must link to — not re-do — **favicon all sizes**; new platform-specific icon posts must link up to **icon size guide 2026** and **how to generate perfect app icons**; new quality posts must stay distinct from **why your icons look blurry**; and workflow posts are effectively closed (see Supporting tier).

---

## PART 3 — HOW TO RESEARCH (so the post is accurate and ranks)

Before writing, do this:

1. **Confirm the tool can actually do it.** Only describe what exists: PNG/JPG/JPEG/WebP/BMP/GIF in (max 10 MB, one image), square transparent PNG out at 16/32/48/64/128/256/512, single-size or ZIP download, before/after preview with 2× zoom, no account, no upload. Flat/near-flat backgrounds only. If the post's promise needs a feature we don't have (SVG, non-square, batch, .ico bundling), stop — pick a different angle.
2. **Verify size tables and platform facts against current sources.** Favicon, Apple Touch, Android adaptive-icon, and PWA manifest conventions change. For any reference post or framework post (Next.js/Vite/WordPress etc.), check the current official docs before publishing — do not rely on memory. Our stack is Next.js 16 / React 19; framework wiring guidance ages fast.
3. **Check for cannibalisation** against the published list by *intent*, not keyword. If it overlaps, narrow the angle or improve the existing post.
4. **Identify the real search intent** and deliver it in the first screenful, then go deeper. The person has a logo open and a deadline; the first two sentences must answer the query.
5. **Have a real worked example ready.** The strongest posts show one real logo run through the tool — a genuine before/after (halo removed, whitespace trimmed, 16 px still legible). Never fabricate a benchmark; a screenshot of the actual output is worth more than a made-up number.

---

## PART 4 — HOW TO WRITE (voice, structure, rules)

### Voice & principles

- **Direct, technical, unhyped.** The audience is developers and designers who can smell filler. Short sentences.
- **Explain the mechanism, not just the benefit.** "Lanczos-4 resampling keeps the 16 px version legible" beats "amazing quality". Specificity is what ranks and what earns trust.
- **Honest over hype.** State the limitations plainly (squares only, flat backgrounds, no SVG, no .ico). Acknowledging what we *don't* do is a conversion asset here, not a liability — it tells the right reader they're in the right place and the wrong reader to leave before they bounce on us.
- **Answer first, product second — but the product is on the page.** Lead with the answer to the query. The tool CTA is contextual and light, placed where the reader is ready to act (usually right after the how-to steps), never a banner. Because the widget is literally above the article, "try it right here with your own logo" is the natural, non-salesy CTA.
- **One CTA, contextual.** Not three. Not a popup.

### Standard post structure

1. **Hook (2–3 short paragraphs):** name the reader's exact situation ("You've got a logo PNG and you need a favicon that isn't a blurry mess"), promise the payoff.
2. **Quick answer / "what you'll need" block** for how-to posts — the sizes, the steps, in the first screenful.
3. **Body:** the substance — the size table, the steps, the mechanism, the before/after. `##`/`###` headings, short paragraphs, lists where they genuinely help.
4. **Do it now (product bridge):** the drag-your-logo-in CTA, framed as the natural next action, honest about the free limit (5 logos/day) and what Pro adds (unlimited, custom sizes).
5. **Bottom line:** short summary + soft CTA.
6. **FAQ block:** 3–5 real questions people ask about this exact task (good for featured snippets and People-Also-Ask). Answer them straight.
7. **Internal links:** 3–4 links to related existing posts (and inline where natural). This is important for SEO and for keeping readers in our cluster.

### The CTA (use consistently)

The tool is the site: the CTA is **"drop your logo into the tool at the top of this page"** / a link to `https://autocropper.org/`. There is no external store or app to send people to. When mentioning limits, be accurate: **Free — 5 logos/day, all preset sizes, ZIP export; Pro — 5 CHF/month, unlimited logos and custom sizes.** Do not promise unlimited on free, and do not imply Pro unlocks features that don't exist.

---

## PART 5 — THE EXACT OUTPUT FORMAT

**Authoritative source:** the real authoring contract (exact frontmatter field names, `seoIndex` behaviour, word-count target, FAQ schema, CTA and internal-link rules) lives in **`docs/blog-post-prompt.md`** in the repo. Read it before writing and follow it where it differs from the template below. This section reproduces the shape as we understand it so a writer without repo access can still produce a near-correct file; reconcile field names against `blog-post-prompt.md` before committing.

Autocropper posts are **Markdown files with frontmatter** in `content/blog/`, not TypeScript objects. Proposed shape:

```markdown
---
title: "The Full Post Title (Human-Readable, With Year If Relevant)"
slug: "url-safe-slug-lowercase-hyphenated-keywords"
description: "150–160 char meta description: what the post delivers + the primary keyword, written to earn the click. Not a copy of the title."
date: "2026-07-21"
readTime: "6 min"
seoIndex: "yes"
---

# The Post Title (H1, matches title)

Markdown body...

## FAQ

**Question?**
Answer.

## Related
- [Existing post title](/blog/existing-slug)
- ...
```

### Field rules

- **`title`** — human-readable, primary keyword near the front, year only if the topic is time-sensitive. Aim under ~60 characters for SERP display.
- **`slug`** — lowercase, hyphenated, URL-safe, built from the 3–6 keyword tokens a person would actually search, in natural order; year appended only if time-sensitive. It should read like the query. **Standardise on a clean keyword slug with no date prefix** (see Technical SEO notes in Part 7 — our current blog URLs are inconsistent). Never change the slug of an already-published post; it breaks the URL.
- **`description`** — 150–160 characters, written to earn the click, includes the primary keyword, never duplicates the title.
- **`date`** — `YYYY-MM-DD`, the intended publish date. Stagger publish dates; don't dump many on one date (see Part 7).
- **`readTime`** — honest estimate, `"X min"` (≈ word count ÷ 220).
- **`seoIndex`** — `"yes"` for real content we want ranking (the default). `"no"` only to deliberately keep a post out of the sitemap.
- **Body** — starts with a single `# H1` matching the title, `##`/`###` for sections, ends with FAQ + Related links. Escape any stray backticks in code/hex so the file parses.

**Target length:** 700–1,400 words for task/quality posts; reference posts can run longer if the size tables justify it. Long enough to be complete, short enough that the answer is in the first screenful.

---

## PART 6 — THE CALENDAR (two posts/day, starting 21 July 2026)

Per the two-per-day decision. Part 7 argues this cadence is aggressive for a cold-start domain and recommends **writing** two/day but **publishing** on a staggered schedule — but the plan below follows the two-per-day request. Every post is strategy-aligned (Tiers 1–4) and checked against the published list for cannibalisation. `⚠` marks posts that need a current-version check or a real worked-example asset before publishing.

Each entry: **primary query → tier → why we can win / how it stays distinct from published.**

**Tue 21 Jul**
1. **Logo to Favicon: Turn Your Logo Into a Complete Favicon Set** — "logo to favicon" → Tier 1. From-logo *task* (distinct from published "favicon all sizes", which is the sizes reference — link to it, don't redo it). Tool finishes it on the page.
2. **Apple Touch Icon: What Size It Is and How to Make One** ⚠ — "apple touch icon size" → Tier 2 + Tier 1 tail. Fresh, evergreen reference; verify the current 180×180 convention. Routes to the tool for the square.

**Wed 22 Jul**
3. **Logo to Chrome Extension Icons (16, 32, 48, 128)** — "chrome extension icon sizes" / "logo to extension icon" → Tier 1. Niche, dev-aligned, matches the `icon cropper` impressions we already get; uncovered by anyone well.
4. **PWA Icon Sizes and the Web App Manifest (192 & 512)** ⚠ — "pwa icon sizes" → Tier 2. Evergreen reference; verify current manifest guidance. Tool generates the 192/512 squares.

**Thu 23 Jul**
5. **How to Get Rid of the White Halo Around a Transparent PNG Logo** ⚠ — "white halo transparent png" / "white edges around logo" → Tier 3. Our decontamination step *is* the answer — strongest differentiator. Distinct from published "why your icons look blurry" (halo ≠ blur). Needs a real before/after.
6. **How to Resize Images Without Uploading Them to a Server** — "resize image without uploading" → Tier 4. The no-upload architecture is the whole answer; hardest-to-copy advantage.

**Fri 24 Jul**
7. **Logo to Android App Icon: Adaptive Icon & mipmap Sizes** ⚠ — "android app icon sizes" / "logo to android icon" → Tier 1/2. Android-specific + adaptive icons; distinct from generic published "how to generate perfect app icons" (link up to it). Verify current mipmap densities.
8. **How to Auto-Trim the Whitespace Around a Logo** — "auto trim whitespace around image" / "crop image to content" → Tier 1/3. Direct match for the bounding-box step; not covered by any published post.

**Sat 25 Jul**
9. **Add a Favicon to a Next.js Site From Your Logo** ⚠ — "next.js favicon" → Tier 1. Framework-specific, high dev intent; the tool makes the PNGs, the post shows the `app/`/`public/` wiring. Verify against current Next.js 16 conventions before publishing.
10. **favicon.ico vs PNG Favicon: Which to Use in 2026** — "favicon ico vs png" → Tier 2/3. Turns our honest limitation (no `.ico` bundling) into a genuinely useful explainer that still routes to the tool (modern browsers accept PNG favicons).

**Sun 26 Jul**
11. **Make a Discord Server Icon From Your Logo (512×512)** ⚠ — "discord server icon size" / "make discord icon" → Tier 1. Square output is a perfect fit; niche and uncovered. Verify current Discord minimum.
12. **The Privacy Problem With Online Image Tools (And the Local Alternative)** — "are online image tools safe" / "image resizer privacy" → Tier 4, top-of-funnel. Warms the agency / privacy-sensitive audience; light Pro runway. Keep it honest, not fear-mongering; not legal advice.

**Mon 27 Jul**
13. **How to Make a Transparent-Background Icon From a Logo** — "make png transparent background icon" → Tier 1/3. Matches the background-removal + transparent-square pipeline. Keep distinct from #5 (this is how-to-make-transparent, not halo-defect-fix) and cross-link them.
14. **GitHub Organization & Repo Icon: Make One From Your Logo** ⚠ — "github org icon" / "github organization avatar size" → Tier 1. Dev audience, square, uncovered. Verify current GitHub minimum.

**Cannibalisation watch (internal):** three favicon-adjacent posts land this week (#1, #9, #10) plus the published "favicon all sizes"; two transparency-adjacent posts (#5, #13); two privacy posts (#6, #12). They're distinct by *intent*, but they **must cross-link and each own one intent** — build-the-set vs framework-wiring vs format-choice; defect-fix vs how-to-make; task vs essay. If two of them start competing for the same query in Search Console, merge them.

**Beyond 27 Jul — the ready pool (pick two/day, same discipline):** Slack app icon from a logo; Notion / workspace icon; Android adaptive icon *background+foreground* deep-dive; how to centre a logo on a square canvas; "favicon vs app icon vs Apple Touch icon — what's the difference"; offline icon resizer (browser-only) explainer; how to make an app-store icon from a logo (careful: verify current store sizes); "why 16 px favicons look bad and how Lanczos fixes it" (mechanism post, distinct from published blurry post); can agencies legally use online background removers on client assets.

**No blocking file dependency** (unlike the WhatsApp theme JSONs) — the tool is on the page. The only gate is the `⚠` items: a current-version check for platform sizes / framework wiring, and a real before/after asset for the quality posts. Those can be prepared in parallel and are not a reason to delay non-`⚠` posts.

---

## PART 7 — SELF-REFLECTION (required reading; the writer must engage with this)

**If you are an AI or a writer using this strategy, do not follow it blindly. You are explicitly asked to push back where you genuinely disagree.** Here are the honest tensions in this document — engage with them, and raise new ones if you see them.

1. **The premise "leverage our traction" is optimistic — this is a cold start.** The GSC data is blunt: the blog drives ~0 clicks today and nearly all our ~50 organic clicks over three months are people typing our brand name. We are not leveraging existing blog traction the way the WhatsApp blog (60 visits/day) is; we are trying to *create* it. That's fine and worth doing — but set expectations accordingly. First meaningful blog clicks on a young domain are weeks-to-months out, not days. Anyone promising the calendar will "galvanise" traffic quickly is overselling it.

2. **Two-per-day is even riskier here than for WhatsApp.** Same crawl-budget / content-farm concern, amplified because our domain authority is near zero — a burst of thin posts can *slow* the few things starting to surface. **Writing fast and publishing fast are different levers.** Strong recommendation: write two/day, publish on a staggered schedule (e.g. 3–4 of the best per week, front-loading the highest-intent Tier 1/Tier 2 posts), and hold the rest. If the client insists on publishing two/day, at least front-load quality and watch for ranking regressions on the posts already getting impressions.

3. **Fix the www / non-www split before writing more — it's silently halving every post's value.** Search Console shows `https://autocropper.org/` (36 clicks) and `https://www.autocropper.org/` (28 clicks) as **two separate pages splitting our clicks and our link equity.** Every post we publish is building authority for two competing hostnames instead of one. Pick a canonical host, 301-redirect the other, set the canonical tag, and update Search Console. This one technical fix is probably higher-ROI right now than any single blog post, and it costs an afternoon.

4. **Standardise the blog URL convention.** Existing posts mix styles — `/blog/the-future-of-image-editing-is-less-editing` vs `/blog/2026-05-fastest-autocropper-for-logos` (date-prefixed). Inconsistent slugs hurt nothing catastrophically but look unprofessional and complicate internal linking. Standardise on a clean keyword slug with **no date prefix** (dates live in frontmatter, not the URL) for all new posts. Don't rewrite old slugs — that breaks URLs; just be consistent going forward.

5. **Our addressable query space is genuinely narrow — respect it.** Squares only, flat backgrounds only, marks not photos, no SVG, no batch. That rules out most of the high-volume "crop image" world. Discipline here matters *more* than for WhatsApp: every off-target post we write draws a visitor the tool can't serve, and high bounce on those pages is an engagement signal that can drag down the pages that *do* convert. When in doubt, skip it.

6. **The free limit (5 logos/day) is both the conversion mechanic and a quit point.** Blog visitors who hit the limit mid-task are the Pro opportunity — but only if the posts set expectations honestly. Overpromising "unlimited free" and then hitting a wall converts worse than being upfront. State the limit plainly where relevant.

7. **Cannibalisation is a constant risk** because the whole cluster orbits logo/icon/favicon/size. Check every new post against the published list and against the other posts in the calendar by *intent*, not keyword. When two posts start competing for one query, merge them; when an existing post is decaying, **refresh and re-date it** rather than writing a near-duplicate — the calendar should include refresh slots, not only new-post slots.

8. **Measure the right thing.** Pageviews are vanity. Wire an event for **logo processed** and **ZIP downloaded**, segment by blog referrer (which post sent them), and — once there's volume — **Pro upgrade by blog referrer.** That tells us which posts produce tool usage, which is the real KPI. Until that's in place, we're flying on impressions, which for this product barely correlate with value.

**Instruction to the writer:** when you're handed this strategy and asked to write a specific post, first spend one short paragraph stating whether the requested topic is genuinely strategy-aligned and non-duplicative (does the tool actually do it? does it cannibalise a published post?) — and if you have a real objection, voice it before writing. Then write the post in the Part 5 format. Being agreeable is not the job; being right is.

---

*End of strategy. To request a post: give the topic (or take the next one off the Part 6 calendar). The writer applies Parts 1–5, sanity-checks against Part 2's "not writing" list and Part 7's self-reflection, and returns a single Markdown file in the Part 5 format.*