"use client";

import { useEffect, useState } from "react";
import { GlanceLogo } from "@/components/glance-logo";

export const INTRO_STORAGE_KEY = "glance:intro-seen";

/** Matches the zipper animation timeline in globals.css. */
const INTRO_DURATION_MS = 8000;

/**
 * One column of metal teeth. The column is a single SVG strip repeated down
 * the tape on a 17px pitch (globals.css); the right column is offset half a
 * pitch so its teeth fall between the left column's — that alternation is
 * what makes the two rows read as one closed zip. Closed columns sit on the
 * centre line below the slider; open columns sit on the parted fabric edge
 * above it. Which one shows is driven by the clip on the parent set, which
 * tracks the slider through the `--zip-open` custom property.
 */
function TeethColumn({ side }: { side: "left" | "right" }) {
  return <div className={`zip__teeth zip__teeth--${side}`} aria-hidden="true" />;
}

/**
 * The metal slider: crown, body with the closed teeth feeding into the
 * mouth, and a hanging pull tab. Drawn as one SVG so the metal highlight
 * stays crisp at any size.
 */
function ZipSlider() {
  return (
    <svg
      className="zip__slider-svg"
      viewBox="0 0 64 104"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="zip-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6d8" />
          <stop offset="0.32" stopColor="#f6c445" />
          <stop offset="0.62" stopColor="#d9a221" />
          <stop offset="1" stopColor="#9a6c07" />
        </linearGradient>
        <linearGradient id="zip-metal-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0a92b" />
          <stop offset="1" stopColor="#6b4a05" />
        </linearGradient>
      </defs>

      {/* Pull tab */}
      <rect x="22" y="62" width="20" height="38" rx="10" fill="url(#zip-metal)" />
      <rect
        x="22"
        y="62"
        width="20"
        height="38"
        rx="10"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
      />
      <rect x="28" y="72" width="8" height="16" rx="4" fill="#241802" opacity="0.85" />

      {/* Slider body */}
      <path
        d="M14 26 L22 8 Q23 4 27 4 H37 Q41 4 42 8 L50 26 L44 58 Q43 62 39 62 H25 Q21 62 20 58 Z"
        fill="url(#zip-metal)"
      />
      <path
        d="M14 26 L22 8 Q23 4 27 4 H37 Q41 4 42 8 L50 26 L44 58 Q43 62 39 62 H25 Q21 62 20 58 Z"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
      />

      {/* The dark mouth where the closed tape feeds in */}
      <rect x="26" y="8" width="12" height="7" rx="2.5" fill="#241802" />
      <rect x="27.5" y="9.5" width="9" height="2" rx="1" fill="#6b4a05" opacity="0.7" />

      {/* Crown sheen */}
      <path
        d="M22 12 Q32 8 42 12"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Body facets */}
      <path
        d="M20 30 H44"
        stroke="url(#zip-metal-dark)"
        strokeWidth="1.5"
        opacity="0.55"
        strokeLinecap="round"
      />
      <path
        d="M22 40 H42"
        stroke="url(#zip-metal-dark)"
        strokeWidth="1.5"
        opacity="0.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * First-visit brand moment: the site opens behind a real metal zipper. The
 * slider starts at the top of a closed zip, a gold label shows the brand, then
 * the slider pulls down and the fabric parts behind it to reveal the page.
 * `?intro=1` forces a replay, `?intro=hold` freezes the closed zip for review.
 */
export function SiteIntro() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.has("intro");
    const hold = params.get("intro") === "hold";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = window.__glanceIntroStartedAt ?? performance.now();
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, INTRO_DURATION_MS - elapsed);

    if (hold) document.documentElement.setAttribute("data-intro-hold", "true");

    // While the zipper plays, the page stage stays hidden so the intro reads
    // on solid fabric: zip first, page after (see .site-stage in globals).
    const stageGate = document.documentElement.classList;

    // The cinematic intro plays once per browser (localStorage). Reloads,
    // new tabs and repeat visits skip straight to the page; `?intro=1` forces
    // a replay and `?intro=hold` freezes it for review.
    let seenBefore = false;
    try {
      seenBefore = window.localStorage.getItem(INTRO_STORAGE_KEY) === "1";
      if (!seenBefore || forced) window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // If storage is blocked, fall through and play the intro.
    }

    const stageShouldGate = !seenBefore || forced;
    if (stageShouldGate) stageGate.add("intro-waiting");

    if (seenBefore && !forced) {
      if (stageShouldGate) stageGate.remove("intro-waiting");
      const cleanup = window.setTimeout(() => setMounted(false), 0);
      return () => window.clearTimeout(cleanup);
    }

    const previousOverflow = document.body.style.overflow;
    if (!reduced && !hold && remaining > 0) document.body.style.overflow = "hidden";

    const finishGate = () => {
      stageGate.remove("intro-waiting");
      document.body.style.overflow = previousOverflow;
    };

    const timer = window.setTimeout(
      () => {
        if (!hold) setMounted(false);
        finishGate();
      },
      hold ? 600000 : reduced ? 0 : remaining,
    );

    return () => {
      window.clearTimeout(timer);
      finishGate();
      document.documentElement.removeAttribute("data-intro-hold");
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="site-intro" aria-hidden="true">
      <div className="zip__panel zip__panel--left">
        <div className="zip__set zip__set--closed">
          <span className="zip__tape zip__tape--left" />
          <TeethColumn side="left" />
          <span className="zip__seam" />
        </div>
        <div className="zip__set zip__set--open">
          <span className="zip__tape zip__tape--left zip__tape--parted" />
          <TeethColumn side="left" />
        </div>
      </div>

      <div className="zip__panel zip__panel--right">
        <div className="zip__set zip__set--closed">
          <span className="zip__tape zip__tape--right" />
          <TeethColumn side="right" />
        </div>
        <div className="zip__set zip__set--open">
          <span className="zip__tape zip__tape--right zip__tape--parted" />
          <TeethColumn side="right" />
        </div>
      </div>

      <div className="zip__slider">
        <ZipSlider />
      </div>

      <div className="zip__brand">
        <GlanceLogo variant="light" withTagline={false} className="scale-110" />
        <span className="zip__brand-rule" />
        <span className="zip__brand-tagline">
          Governance · Leadership · National Civic Engagement
        </span>
        <span className="zip__brand-name">A student leadership initiative</span>
      </div>
    </div>
  );
}
