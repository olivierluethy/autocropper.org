"use client";

import { useState } from "react";
// lucide v1 no longer ships brand icons, so the network buttons are text.
import { Check, Link2, Share2 } from "lucide-react";
import { track } from "@/lib/analytics";

interface Props {
  slug: string;
  title: string;
  url: string;
}

/** Share row under a post. Fires `blog_share_click` with the destination. */
export function PostShare({ slug, title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const targets = [
    {
      id: "x",
      label: "X",
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("blog_share_click", { slug, destination: "copy_link" });
    } catch {
      // Clipboard can be blocked (insecure context, denied permission) —
      // failing silently is better than throwing at the user.
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-fg-muted)] hover:text-[var(--color-fg)]";

  return (
    <div className="mt-12 flex flex-wrap items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-subtle)]">
        <Share2 className="h-3.5 w-3.5" />
        Share
      </span>
      {targets.map(({ id, label, href }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className={btn}
          onClick={() => {
            track("blog_share_click", { slug, destination: id });
            track("outbound_link_clicked", { href, slug, location: "share" });
          }}
        >
          {label}
        </a>
      ))}
      <button type="button" onClick={copyLink} className={btn}>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
