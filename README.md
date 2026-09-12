# Autocropper

The website behind [autocropper.org](https://www.autocropper.org) — a browser-based tool
that turns one logo image into a complete square icon set (16, 32, 48, 64, 128, 256 and
512 px PNGs) in seconds, entirely on the client. Drop in a PNG/JPG/WebP and it finds the
logo, removes the background, crops the dead space, centres the mark on a transparent
square, downscales each size with Lanczos resampling, and hands you the files
individually or as a ZIP. No account, no upload — the image never leaves the browser.

## Features

- Client-side image processing: background removal, cropping, centring and multi-size
  export, all in the browser tab (no server round-trip).
- HEIC/PSD/TIFF support via `heic-to`, `ag-psd` and `utif2`; ZIP download via `jszip`.
- A markdown-driven blog (`content/blog/`) with build-time rendering, RSS feed, sitemap
  and SEO metadata.
- Optional analytics integrations (Google Analytics 4, PostHog, Vercel Analytics) that
  no-op when their environment variables are absent.

## Tech

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- Tailwind CSS v4
- Framer Motion for animation
- Vitest for tests (including quality/contact-sheet checks)

Requires Node.js >= 20.9.

## Getting started

```bash
pnpm install   # or npm install
pnpm dev       # start the dev server at http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, and `pnpm test` (Vitest).

## Environment variables

Copy `.env.example` to `.env.local`. All are optional — each integration no-ops when its
variable is absent.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absolute site origin, used for canonicals, sitemap and RSS. Defaults to `https://www.autocropper.org`. |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID. |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key. Without it PostHog never initialises. |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host, e.g. `https://eu.i.posthog.com`. |

## Blog

Posts are markdown files in `content/blog/`, read at build time by `lib/blog.ts`. The
`seoIndex` frontmatter flag is the single switch for search visibility — see
[`docs/blog-post-prompt.md`](docs/blog-post-prompt.md) for the schema and indexing rules,
and [`docs/product-brief.md`](docs/product-brief.md) for the product context document
(what the tool does, what it deliberately doesn't, and the claims that are off-limits).
