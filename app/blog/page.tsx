import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listPosts, SITE_URL } from "@/lib/blog";
import { TrackedLink } from "@/components/tracked-link";
import { ScrollTracker } from "@/components/scroll-tracker";
import { BlogIndexAnalytics } from "@/components/blog-analytics";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Field notes on icons, image processing and the workflows that ship them — from the Autocropper team.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

/** Only `seoIndex: true` posts are listed — `listPosts()` filters them. */
export default function BlogIndex() {
  const posts = listPosts();
  return (
    <>
      <SiteHeader />
      <ScrollTracker pageType="blog_index" />
      <BlogIndexAnalytics numPostsShown={posts.length} />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 sm:pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Blog
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Field notes on icons, pixels and shipping fast.
          </h1>
          <p className="mt-4 text-pretty text-[var(--color-fg-muted)]">
            Practical writing on image processing, build pipelines and the
            small details that separate a polished icon from a fuzzy one.
          </p>
        </section>
        <section className="mx-auto max-w-3xl px-5 pb-24">
          <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            {posts.map((p, i) => (
              <li key={p.slug}>
                <TrackedLink
                  href={`/blog/${p.slug}`}
                  event="blog_post_click"
                  params={{
                    slug: p.slug,
                    position: i,
                    location: "blog_index",
                  }}
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
                  <h2 className="text-xl font-semibold tracking-tight">
                    {p.title}
                  </h2>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {p.description}
                  </p>
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
