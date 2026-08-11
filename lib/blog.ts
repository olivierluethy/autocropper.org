/**
 * Markdown-backed blog.
 *
 * Posts live in `content/blog/*.md` as frontmatter + markdown and are read at
 * build time, so the marketing pages stay fully prerenderable with no CMS.
 *
 * The `seoIndex` flag in the frontmatter is the single switch that decides
 * whether a post is visible to search engines:
 *
 *   seoIndex: true   → `index, follow`, in the sitemap, in the blog index,
 *                      in the RSS feed, emits Article JSON-LD.
 *   seoIndex: false  → `noindex, follow`, out of the sitemap / index / RSS,
 *                      no JSON-LD. The URL still resolves so inbound links
 *                      don't 404 and link equity keeps flowing.
 *
 * Never disallow noindex posts in robots.txt — Google has to crawl a page to
 * see its noindex tag. See `app/robots.ts`.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked, type Tokens } from "marked";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.autocropper.org";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export interface Post {
  slug: string;
  title: string;
  description: string;
  /** Publish date, `YYYY-MM-DD`. */
  date: string;
  /** Last meaningful edit; falls back to `date`. Drives sitemap lastmod. */
  updated: string;
  author: string;
  tags: string[];
  coverImage?: string;
  seoIndex: boolean;
  /** Explicit canonical override; empty means self-referencing. */
  canonical: string;
  readingMinutes: number;
  body: string;
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asTags(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
}

/** ~200 words per minute, floor of 1. */
function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function parsePost(file: string): Post {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const slug = asString(data.slug) || file.replace(/\.md$/, "");
  const date = asString(data.date);
  if (!date) throw new Error(`content/blog/${file}: missing "date" frontmatter`);
  if (typeof data.seoIndex !== "boolean") {
    throw new Error(`content/blog/${file}: "seoIndex" must be true or false`);
  }
  return {
    slug,
    title: asString(data.title),
    description: asString(data.description),
    date,
    updated: asString(data.updated) || date,
    author: asString(data.author, "Autocropper"),
    tags: asTags(data.tags),
    coverImage: asString(data.coverImage) || undefined,
    seoIndex: data.seoIndex,
    canonical: asString(data.canonical),
    readingMinutes: readingMinutes(content),
    body: content,
  };
}

function loadPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(parsePost)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Read once per build. Every consumer is a server component or a metadata
// route, so there's no client-bundle cost.
const POSTS: Post[] = loadPosts();

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Every post, indexed or not, newest first. Use for route generation. */
export function getAllPosts(): Post[] {
  return POSTS;
}

/**
 * Only posts we want in search results, newest first. This is what the blog
 * index, the sitemap and the RSS feed iterate.
 */
export function listPosts(): Post[] {
  return POSTS.filter((p) => p.seoIndex);
}

/** Resolves any post by slug, including `seoIndex: false` ones. */
export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Every tag used by an indexed post, with how many posts carry it. */
export function listTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of listPosts()) {
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Indexed posts carrying a tag, newest first. */
export function getPostsByTag(tag: string): Post[] {
  return listPosts().filter((p) => p.tags.includes(tag));
}

/**
 * Indexed posts sharing the most tags with `post`, newest first as the
 * tie-breaker. Powers the related-posts block; de-indexed posts are never
 * suggested, so we don't funnel readers into content we've told Google to
 * ignore.
 */
export function relatedPosts(post: Post, limit = 3): Post[] {
  return listPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, shared: p.tags.filter((t) => post.tags.includes(t)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.p);
}

export function postUrl(post: Post): string {
  return `${SITE_URL}/blog/${post.slug}`;
}

/** Explicit canonical if set, otherwise self-referencing. */
export function canonicalUrl(post: Post): string {
  return post.canonical || postUrl(post);
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

/** Escapes text that bypasses marked's own escaping (fenced code blocks). */
function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/**
 * Tailwind classes are baked into the rendered HTML rather than living in a
 * stylesheet, so post markup stays consistent with the rest of the site and
 * needs no `prose` plugin.
 */
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    heading({ tokens, depth }: Tokens.Heading) {
      const text = this.parser.parseInline(tokens);
      if (depth <= 2) {
        return `<h2 class="mt-10 text-2xl font-semibold tracking-tight">${text}</h2>\n`;
      }
      if (depth === 3) {
        return `<h3 class="mt-8 text-lg font-semibold tracking-tight">${text}</h3>\n`;
      }
      return `<h4 class="mt-6 font-semibold tracking-tight">${text}</h4>\n`;
    },
    paragraph({ tokens }: Tokens.Paragraph) {
      const text = this.parser.parseInline(tokens);
      return `<p class="mt-4 leading-7 text-[var(--color-fg-muted)]">${text}</p>\n`;
    },
    list(token: Tokens.List) {
      const items = token.items.map((i) => this.listitem(i)).join("");
      return token.ordered
        ? `<ol class="mt-4 list-decimal space-y-2 pl-5 text-[var(--color-fg-muted)]">${items}</ol>\n`
        : `<ul class="mt-4 list-disc space-y-2 pl-5 text-[var(--color-fg-muted)]">${items}</ul>\n`;
    },
    listitem(item: Tokens.ListItem) {
      return `<li class="leading-7">${this.parser.parseInline(item.tokens)}</li>`;
    },
    strong({ tokens }: Tokens.Strong) {
      return `<strong class="font-semibold text-[var(--color-fg)]">${this.parser.parseInline(tokens)}</strong>`;
    },
    code({ text, lang }: Tokens.Code) {
      return `<pre class="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 text-sm leading-6"${
        lang ? ` data-lang="${escapeHtml(lang)}"` : ""
      }><code class="font-mono text-[var(--color-fg-muted)]">${escapeHtml(text)}</code></pre>\n`;
    },
    codespan({ text }: Tokens.Codespan) {
      return `<code class="rounded bg-[var(--color-bg-soft)] px-1 py-0.5 text-[0.85em]">${text}</code>`;
    },
    blockquote({ tokens }: Tokens.Blockquote) {
      return `<blockquote class="mt-6 border-l-2 border-[var(--color-accent)] pl-4 text-[var(--color-fg-muted)] italic">${this.parser.parse(tokens)}</blockquote>\n`;
    },
    hr() {
      return `<hr class="my-10 border-[var(--color-border)]" />\n`;
    },
    table(token: Tokens.Table) {
      const head = token.header
        .map((c) => `<th class="px-3 py-2 text-left font-semibold">${this.parser.parseInline(c.tokens)}</th>`)
        .join("");
      const rows = token.rows
        .map(
          (row) =>
            `<tr class="border-t border-[var(--color-border)]">${row
              .map((c) => `<td class="px-3 py-2 align-top">${this.parser.parseInline(c.tokens)}</td>`)
              .join("")}</tr>`,
        )
        .join("");
      return `<div class="mt-6 overflow-x-auto rounded-xl border border-[var(--color-border)]"><table class="w-full text-sm text-[var(--color-fg-muted)]"><thead class="bg-[var(--color-bg-soft)] text-[var(--color-fg)]"><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
    },
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href) && !href.startsWith(SITE_URL);
      const attrs = [
        `href="${href}"`,
        title ? `title="${title}"` : "",
        `class="font-medium text-[var(--color-accent)] underline underline-offset-4 hover:opacity-80"`,
        `data-post-link="${external ? "external" : "internal"}"`,
        external ? `target="_blank" rel="noopener noreferrer"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<a ${attrs}>${text}</a>`;
    },
    image({ href, title, text }: Tokens.Image) {
      return `<img src="${href}" alt="${text}"${title ? ` title="${title}"` : ""} class="mt-6 w-full rounded-xl border border-[var(--color-border)]" loading="lazy" />`;
    },
  },
});

export function renderMarkdown(src: string): string {
  return marked.parse(src.trim(), { async: false });
}
