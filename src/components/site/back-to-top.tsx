"use client";

import { useEffect, useState } from "react";

/**
 * Floating back-to-top affordance for long pages (chapters, news, about,
 * gallery). It stays out of the way — appears only after the first viewport,
 * honours reduced-motion by jumping instead of gliding, and seats itself
 * above the consent tray on mobile.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(window.scrollY > window.innerHeight);
    show();
    window.addEventListener("scroll", show, { passive: true });
    return () => window.removeEventListener("scroll", show);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="back-to-top fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-navy-950/85 text-gold-400 shadow-lg backdrop-blur transition-colors hover:bg-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:bottom-8 sm:right-8"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
