"use client";

import { track } from "@/lib/analytics";

interface Props {
  href: string;
  label: string;
  location: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Plain anchor (no `next/link`) that fires `external_link_click` on click.
 * Use for `mailto:`, `https://…`, etc.
 */
export function ExternalTrackedLink({
  href,
  label,
  location,
  className,
  children,
}: Props) {
  return (
    <a
      href={href}
      onClick={() => {
        track("outbound_link_clicked", { href, label, location });
        track("external_link_click", { url: href, label, location });
      }}
      className={
        className ?? "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
      }
    >
      {children ?? label}
    </a>
  );
}
