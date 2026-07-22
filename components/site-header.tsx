"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { track } from "@/lib/analytics";
import Image from "next/image"

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#compare", label: "Compare" },
  { href: "#calculator", label: "Savings" },
  { href: "#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          onClick={() => track("logo_click", { location: "header" })}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-fg)] text-[var(--color-bg)]">
            <Image
      src="/icon" // or "/icon.png" depending on your route setup
      alt="Autocropper logo"
      width={28}
      height={28}
    />

          </span>
          Autocropper
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-sm text-[var(--color-fg-muted)] md:flex"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() =>
                track("nav_click", {
                  link: l.href,
                  label: l.label,
                  location: "header",
                })
              }
              className="transition-colors hover:text-[var(--color-fg)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#hero-tool"
            onClick={() =>
              track("cta_click", {
                cta: "try_free",
                location: "header",
                destination: "#hero-tool",
              })
            }
            className="hidden rounded-full bg-[var(--color-fg)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-bg)] transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Try free
          </a>
        </div>
      </div>
    </header>
  );
}
