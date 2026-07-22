import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  getAllPosts,
  getPost,
  getPostsByTag,
  listPosts,
  listTags,
  relatedPosts,
  renderMarkdown,
  SITE_URL,
} from "./blog";

/**
 * These guard the seoIndex contract, which is load-bearing but invisible:
 * the sitemap, the blog index and the RSS feed must only ever see indexed
 * posts, while route generation must see all of them. Swapping one call for
 * the other silently re-exposes de-indexed posts to search engines.
 */
describe("seoIndex contract", () => {
  it("listPosts returns only indexed posts", () => {
    expect(listPosts().length).toBeGreaterThan(0);
    expect(listPosts().every((p) => p.seoIndex)).toBe(true);
  });

  it("getAllPosts includes de-indexed posts so their URLs still resolve", () => {
    const all = getAllPosts();
    expect(all.length).toBeGreaterThan(listPosts().length);
    expect(all.some((p) => !p.seoIndex)).toBe(true);
  });

  it("getPost resolves a de-indexed post", () => {
    const hidden = getAllPosts().find((p) => !p.seoIndex)!;
    expect(getPost(hidden.slug)).toBeDefined();
  });

  it("sorts newest first", () => {
    const dates = listPosts().map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe("frontmatter", () => {
  it("every post has the fields the SEO head depends on", () => {
    for (const p of getAllPosts()) {
      expect(p.title, p.slug).toBeTruthy();
      expect(p.description, p.slug).toBeTruthy();
      expect(p.date, p.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.updated, p.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof p.seoIndex, p.slug).toBe("boolean");
    }
  });

  it("keeps meta descriptions within the 155-character budget", () => {
    for (const p of listPosts()) {
      expect(p.description.length, p.slug).toBeLessThanOrEqual(155);
    }
  });

  it("defaults the canonical to a self-referencing URL", () => {
    const p = listPosts()[0];
    expect(canonicalUrl(p)).toBe(`${SITE_URL}/blog/${p.slug}`);
  });
});

describe("tags", () => {
  it("counts only indexed posts", () => {
    for (const { tag, count } of listTags()) {
      expect(getPostsByTag(tag).length).toBe(count);
      expect(getPostsByTag(tag).every((p) => p.seoIndex)).toBe(true);
    }
  });

  it("never suggests a de-indexed post as related", () => {
    for (const p of listPosts()) {
      expect(relatedPosts(p).every((r) => r.seoIndex && r.slug !== p.slug)).toBe(true);
    }
  });
});

describe("markdown rendering", () => {
  it("escapes fenced code so examples can't inject markup", () => {
    const html = renderMarkdown('```html\n<script>alert(1)</script>\n```');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("tags links so click tracking can tell internal from external", () => {
    const html = renderMarkdown("[tool](/#hero-tool) and [x](https://example.com)");
    expect(html).toContain('data-post-link="internal"');
    expect(html).toContain('data-post-link="external"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
