# Reusable prompt: generate a new blog post

Read [`product-brief.md`](product-brief.md) first — it's the source of truth for what
the tool does, its limitations, and the claims that must never appear in a post.

Fill the two placeholders and run in Claude Code from the repo root.

```
Write a new blog post for autocropper.org (in-browser tool that crops one logo
into a full square icon ladder — 16/32/48/64/128/256/512 px — with logo-aware
cropping, background removal and Lanczos resampling, all client-side).

TARGET KEYWORD: <<primary keyword / search query>>
ANGLE / CLUSTER: <<e.g. logo-aware, icon sizes, bulk, format utility>>

Requirements:
- Create content/blog/<kebab-slug-of-keyword>.md with the standard frontmatter
  (title, slug, description ≤155 chars, date = today, updated = today,
  author "Autocropper", tags, seoIndex: true, canonical: "").
- The frontmatter `title` is rendered as the H1 and `description` as the lead
  paragraph, so the body starts at the intro — do NOT repeat them as headings.
- Title contains the target keyword naturally; the body's first two sentences
  answer the search query directly.
- 900–1400 words, scannable H2s, a 3–5 question FAQ block using H3 questions
  that mirror likely People-Also-Ask queries.
- Exactly one contextual CTA linking to /#hero-tool with a keyword-rich anchor,
  plus 1–2 internal links to related existing posts.
- Only claim what the tool actually does: square icon sizes from one source
  image, in the browser, no upload. It does not do arbitrary non-square social
  banner dimensions or many-images-to-one-size batch processing.
- No fluff, no keyword stuffing, no invented statistics.
- Markdown only — Article JSON-LD, canonical, robots and OG tags are emitted
  automatically by app/blog/[slug]/page.tsx from the frontmatter.
- Commit as: feat(blog): add post "<title>"
Then tell me the slug and the meta description you used.
```

## How `seoIndex` works

Set in each post's frontmatter. It is the single switch controlling search visibility:

| | `seoIndex: true` | `seoIndex: false` |
|---|---|---|
| Meta robots | `index, follow` | `noindex, follow` |
| `sitemap.xml` | included | excluded |
| Blog index listing | listed | hidden |
| RSS (`/feed.xml`) | included | excluded |
| Article JSON-LD | emitted | skipped |
| Direct URL | resolves | resolves (no 404, keeps link equity) |

**Never add a `noindex` post to `robots.txt` `Disallow`.** Google has to crawl a page to see its `noindex` tag; blocking it freezes the page in the index instead of removing it.

Tag archives (`/blog/tag/<tag>`) are `noindex, follow` and stay out of the sitemap on purpose — they're navigation, and indexing near-duplicate listing pages dilutes the crawl budget concentrated by de-indexing the weak posts.

`lib/blog.test.ts` pins this contract. Run `npm test` after touching `lib/blog.ts`, the sitemap or the feed.

## Social cards

Every page gets a generated 1200×630 card from `app/opengraph-image.tsx`; posts get their title rendered by `app/blog/[slug]/opengraph-image.tsx`. Both are prerendered — an image route in a dynamic segment needs its own `generateStaticParams`, and the `twitter-image.tsx` re-export must forward it too, or the route falls back to rendering on demand.

Setting `coverImage` in frontmatter overrides the generated card for that post.

## Publishing cadence

One to two genuinely useful posts a week, each owning one long-tail query. Publish as `seoIndex: true`; if a post has no impressions in Search Console after 6–8 weeks, flip it to `false` and fold its angle into a stronger post.

Priority queue (thinnest competition first — the logo/icon cluster is where the tool is most differentiated):

1. Resize a logo to all sizes for a website
2. All app icon sizes for iOS & Android in one go
3. Favicon in every size you need (16 to 512)
4. Crop an image to an exact pixel size online
5. Crop an image to a perfect square
6. Crop PNG without losing quality
7. Auto-trim whitespace around an image
