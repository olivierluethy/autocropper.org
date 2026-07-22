import { ImageResponse } from "next/og";
import { getAllPosts, getPost } from "@/lib/blog";

export const alt = "Autocropper blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Without this the image route renders on demand per request; every post's
// card is known at build time, so prerender them all.
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

/** Per-post social card: the post title on the site's dark palette. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.title ?? "Autocropper";
  const date = post
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050507",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 30,
            color: "#a3a3a3",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "#818cf8",
            }}
          />
          autocropper.org / blog
        </div>
        <div
          style={{
            display: "flex",
            // Long titles need to shrink; 60 chars is roughly three lines here.
            fontSize: title.length > 60 ? 60 : 72,
            lineHeight: 1.15,
            color: "#fafafa",
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", height: 8, width: 120, borderRadius: 4, background: "#818cf8" }} />
          {/* Satori needs a single child here, or an explicit display value. */}
          <div style={{ fontSize: 28, color: "#737373" }}>
            {post ? `${date} · ${post.readingMinutes} min read` : date}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
