"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const INTRO_STORAGE_KEY = "glance:intro-seen";

/** "Already welcomed on this visit" — an in-memory flag, deliberately not
 *  a storage write. sessionStorage survives reloads inside the same tab, so
 *  a visitor who opened the site once stopped seeing the welcome banner on
 *  every reload until they closed the tab; the banner is an opening moment,
 *  and it should greet each fresh visit. The flag survives in-page
 *  navigation (returning to the homepage never replays it mid-session) but
 *  resets on every full load: new tab, new session, plain refresh — each is
 *  met by the banner again. */
let welcomedThisVisit = false;

function alreadyWelcomed() {
  return welcomedThisVisit;
}

function markWelcomed() {
  welcomedThisVisit = true;
}

/** No timer: the banner is the site's front door now — it stays up until
 *  the visitor presses Enter. */

/**
 * The site's opening moment — the banner is a real gate, not a flash: on the
 * homepage's first visit (or forced with ?intro=1) a full-viewport navy card
 * says "Welcome to GLANCE" and stays exactly where it is until the visitor
 * presses the Enter button (or their keyboard's Enter/Space while it has
 * focus). Nothing autoplays and nothing is scored, so the first sound the
 * visitor hears is only what they choose to play. The page waits behind the
 * banner via the same `intro-waiting` gate the pre-paint script in the root
 * layout sets.
 */
export function CinematicIntro() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);

  /** Signal "user has entered": the flag is written here — at dismissal —
   *  and never when the banner merely starts playing. Writing it at start
   *  made the banner self-annulling: with React StrictMode's double effect
   *  (and any re-run of this effect while the banner is up) the second run
   *  saw "seen" and returned before the banner could mount, so visitors
   *  stopped seeing the welcome screen altogether. */
  const dismiss = useCallback(() => {
    markWelcomed();
    setLeaving(true);
    document.documentElement.classList.remove("intro-waiting");
    document.body.style.overflow = "";
    const timer = window.setTimeout(() => {
      setActive(false);
      setLeaving(false);
    }, 480);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.has("intro");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = alreadyWelcomed();

    const shouldPlay = !reduced && (forced || (!seen && pathname === "/"));
    if (!shouldPlay) return;
  // No storage write here: the flag is set on dismissal (see dismiss),
    // because writing it while the banner is up lets a second effect run
    // cancel it out before it is ever seen.
    /** The pre-paint gate in the root layout already hides the stage
     *  synchronously, so one thread-detracked callback keeps this effect
     *  free of a synchronous setState cascade. */
    const show = window.setTimeout(() => {
      setActive(true);
      document.documentElement.classList.add("intro-waiting");
      document.body.style.overflow = "hidden";
    }, 32);
    // Enter button renders once the copy has risen; focus it so keyboard
    // visitors can press Enter/Space without hunting for it.
    const focusEnter = window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(".welcome__enter")?.focus();
    }, 1100);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(focusEnter);
    };
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] grid place-items-center overflow-hidden bg-navy-950 [transition:opacity_450ms_ease] ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={leaving}
    >
      <style>{WELCOME_CSS}</style>
      {/* No click-anywhere dismissal any more: the banner is the front door,
          and the only way in is the Enter button below. */}
      <div className="absolute inset-0" aria-hidden="true" />

      {/* Ambient gold breath + faint grid so the banner carries the brand */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[440px] w-[860px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.12)_0%,transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(120%_90%_at_50%_40%,black,transparent_75%)]"
      />

      <div className="welcome relative px-6 text-center">
        <p className="welcome__kicker text-[11px] font-bold tracking-[0.34em] text-gold-400 uppercase">
          Governance · Leadership · National Civic Engagement
        </p>
        <h1 className="welcome__title mt-6 font-extrabold tracking-[-0.02em] text-white">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
            GLANCE
          </span>
        </h1>
        <div
          className="welcome__rule mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
          aria-hidden="true"
        />
        <p className="welcome__copy mx-auto mt-5 max-w-[420px] text-[14.5px] leading-[1.75] text-white/70">
          Young people. Real solutions. A stronger nation.
        </p>

        {/* pointer-events-auto lifts the Enter call to action above the
            full-surface dismiss button behind it. */}
        <span className="relative inline-block">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Enter the GLANCE website"
            className="welcome__enter pointer-events-auto mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-gold-400 px-10 text-[14px] font-extrabold tracking-[0.08em] text-navy-950 uppercase shadow-[0_18px_40px_-16px_rgba(251,202,75,0.8)] transition-transform hover:scale-[1.05] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
          >
            Enter
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 1.5 13.5 8 8 14.5 6.4 13 10.4 9H2V7h8.4L6.4 3z" />
            </svg>
          </button>
        </span>
      </div>
    </div>
  );
}

const WELCOME_CSS = `
.welcome { text-align: center; }
.welcome__kicker, .welcome__rule, .welcome__copy, .welcome__enter {
  opacity: 0;
  animation: welcomeRise .7s cubic-bezier(.22,.9,.3,1) forwards;
}
.welcome__title { opacity: 0; animation: welcomeTitle .8s cubic-bezier(.22,.9,.3,1) .12s forwards; }
.welcome__rule { animation-delay: .38s; }
.welcome__copy { animation-delay: .52s; }
.welcome__enter { animation-delay: .66s; }
.welcome__title { font-size: clamp(40px, 8.5vw, 96px); line-height: 1.04; font-weight: 800; }
@media (prefers-reduced-motion: reduce) {
  .welcome__kicker, .welcome__title, .welcome__rule, .welcome__copy, .welcome__enter {
    animation: none !important; opacity: 1 !important;
  }
}
@keyframes welcomeRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes welcomeTitle { from { opacity: 0; transform: translateY(26px) scale(.985); } to { opacity: 1; transform: none; } }
`;
