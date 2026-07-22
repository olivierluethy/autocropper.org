import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  canonicalUrl,
  getAllPosts,
  getPost,
  renderMarkdown,
  type Post,
  SITE_URL,
} from "@/lib/blog";
import { TrackedLink } from "@/components/tracked-link";
import { ScrollTracker } from "@/components/scroll-tracker";
import { BlogPostAnalytics } from "@/components/blog-analytics";

/**
 * Every post gets a route, including `seoIndex: false` ones — a de-indexed
 * post must still resolve so inbound links don't 404 and Google can crawl it
 * to see the `noindex` tag.
 */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = canonicalUrl(post);
  const images = post.coverImage ? [post.coverImage] : undefined;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    // `follow` either way: de-indexed posts should still pass link equity.
    robots: { index: post.seoIndex, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      siteName: "Autocropper",
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author],
      tags: post.tags,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images,
    },
  };
}

/** Article structured data. Only emitted for posts we actually want indexed. */
function articleJsonLd(post: Post) {
  const url = canonicalUrl(post);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    author: { "@type": "Organization", name: post.author, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Autocropper",
      url: SITE_URL,
    },
    ...(post.coverImage ? { image: [`${SITE_URL}${post.coverImage}`] } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.body);

  return (
    <>
      <SiteHeader />
      <ScrollTracker pageType="blog_post" />
      <BlogPostAnalytics
        slug={post.slug}
        seoIndex={post.seoIndex}
        tags={post.tags}
      />
      {post.seoIndex ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd(post)).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-5 pt-12 pb-24 sm:pt-20">
          <TrackedLink
            href="/blog"
            event="blog_back_click"
            params={{ from_slug: slug }}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </TrackedLink>
          <header className="mt-8">
            <div className="flex items-center gap-3 text-xs text-[var(--color-fg-subtle)]">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span aria-hidden>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-pretty text-lg text-[var(--color-fg-muted)]">
              {post.description}
            </p>
          </header>
          <div
            className="prose-content mt-10"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div className="mt-16 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6">
            <h3 className="text-lg font-semibold tracking-tight">
              Try it on your own logo.
            </h3>
            <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
              Drop a logo into Autocropper and see the difference in seconds.
            </p>
            <TrackedLink
              href="/#hero-tool"
              event="blog_cta_clicked"
              params={{ slug, cta_label: "Open Autocropper" }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] hover:opacity-90"
            >
              Open Autocropper
            </TrackedLink>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
