"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav";
import { track } from "@/lib/analytics";

/**
 * Burger button + full-screen navigation panel for viewports below `md`,
 * where the header nav is hidden. Opens in place rather than routing to a
 * separate menu page.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  function toggle(next: boolean) {
    setOpen(next);
    track("mobile_menu_toggle", { open: next });
  }

  // Close on Escape, and keep the page behind the panel from scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Move focus into the panel when it opens, and back to the button on close.
  useEffect(() => {
    if (open) panelRef.current?.focus();
    else buttonRef.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => toggle(!open)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Portalled to <body>: the header is a sticky, z-indexed stacking
          context, so a fixed child of it can't paint above the page. The
          portal renders nothing in place, so there's no hydration mismatch. */}
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  id="mobile-nav"
                  ref={panelRef}
                  tabIndex={-1}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Site navigation"
                  initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-x-0 top-14 bottom-0 z-50 overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-bg)] px-5 pb-8 outline-none md:hidden"
                >
                  <nav aria-label="Primary">
                    <ul className="divide-y divide-[var(--color-border)]">
                      {NAV_LINKS.map((l) => (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            onClick={() => {
                              track("nav_click", {
                                link: l.href,
                                label: l.label,
                                location: "mobile_menu",
                              });
                              setOpen(false);
                            }}
                            className="block py-4 text-lg font-medium tracking-tight transition-colors hover:text-[var(--color-accent)]"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <a
                    href="#hero-tool"
                    onClick={() => {
                      track("cta_click", {
                        cta: "try_free",
                        location: "mobile_menu",
                        destination: "#hero-tool",
                      });
                      setOpen(false);
                    }}
                    className="mt-8 flex w-full items-center justify-center rounded-full bg-[var(--color-fg)] px-4 py-3 text-sm font-medium text-[var(--color-bg)] transition-opacity hover:opacity-90"
                  >
                    Try free
                  </a>
                  <p className="mt-4 text-center text-xs text-[var(--color-fg-subtle)]">
                    Runs in your browser. Nothing is uploaded.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
