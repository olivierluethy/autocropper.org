import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPostsByTag, listTags, SITE_URL } from "@/lib/blog";
import { TrackedLink } from "@/components/tracked-link";
import { ScrollTracker } from "@/components/scroll-tracker";

export function generateStaticParams() {
  return listTags().map(({ tag }) => ({ tag }));
}

/**
 * Tag archives are navigation, not content: they're `noindex, follow` and stay
 * out of the sitemap. Indexing near-duplicate listing pages dilutes the crawl
 * budget we just concentrated by de-indexing the weak posts.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `Posts tagged “${tag}”`,
    description: `Autocropper articles tagged ${tag}.`,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `${SITE_URL}/blog/tag/${tag}`,
      types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (!posts.length) notFound();

  return (
    <>
      <SiteHeader />
      <ScrollTracker pageType="blog_index" />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 sm:pt-24">
          <TrackedLink
            href="/blog"
            event="blog_back_click"
            params={{ from_tag: tag }}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </TrackedLink>
          <h1 className="mt-8 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Tagged “{tag}”
          </h1>
          <p className="mt-4 text-[var(--color-fg-muted)]">
            {posts.length} {posts.length === 1 ? "post" : "posts"}.
          </p>
        </section>
        <section className="mx-auto max-w-3xl px-5 pb-24">
          <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            {posts.map((p, i) => (
              <li key={p.slug}>
                <TrackedLink
                  href={`/blog/${p.slug}`}
                  event="blog_post_click"
                  params={{ slug: p.slug, position: i, location: "tag_index", tag }}
                  className="group flex flex-col gap-2 px-6 py-6 transition-colors hover:bg-[var(--color-bg-soft)]"
                >
                  <div className="flex items-center gap-3 text-xs text-[var(--color-fg-subtle)]">
                    <time dateTime={p.date}>
                      {new Date(p.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <span aria-hidden>·</span>
                    <span>{p.readingMinutes} min read</span>
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">{p.title}</h2>
                  <p className="text-sm text-[var(--color-fg-muted)]">{p.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]">
                    Read post
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </TrackedLink>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
