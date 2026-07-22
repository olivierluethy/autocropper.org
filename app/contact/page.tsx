import type { Metadata } from "next";
import { ContactForm } from "@easycontact/react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Autocropper team — questions, feedback, partnerships or anything you need from us.",
  alternates: {
    canonical: "/contact",
    types: { "application/rss+xml": "/feed.xml" },
  },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 pt-16 pb-10 sm:pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Contact
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Talk to us.
          </h1>
          <p className="mt-4 text-pretty text-[var(--color-fg-muted)]">
            Questions, bug reports, feature requests or anything else — drop us
            a line and we&apos;ll get back to you.
          </p>
        </section>
        <section className="mx-auto max-w-2xl px-5 pb-24">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 sm:p-8">
            <ContactForm projectId="caad65e66821d442b78b50a9" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
