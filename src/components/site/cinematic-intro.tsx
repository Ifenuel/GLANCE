"use client";

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isLightDevice } from "@/lib/intro-gate";

/** The real 3D building (three.js) is one extra chunk that only ever loads
 * while the welcome film is actually playing on the homepage. */
const IntroBuildingScene = lazy(
  () =>
    import("./intro-building-3d").then((m) => ({ default: m.IntroBuildingScene })),
);

/** "Already welcomed this document load" — a plain module flag: it resets
 * every time the page itself loads, so the film greets the visitor on EVERY
 * fresh visit to the homepage, while moving around inside the same session
 * (home → events → back home) never replays it mid-session. */
let welcomedThisVisit = false;

/**
 * The site's opening film, starring the GLANCE House:
 *
 *   1. One short invitation — "Are you ready to be part of a change?"
 *   2. The House rises and turns, face after face presenting what GLANCE
 *      offers. The visitor can grab it and spin it 360° by hand.
 *   3. Enter releases the film into the site.
 *
 * The film plays on every visit to the homepage (or on any page when forced
 * with ?intro=1) over a full-viewport navy stage, then releases itself — or
 * immediately via the Enter button. Nothing autoplays sound. Visitors who
 * prefer reduced motion, and light devices that the film would weigh down,
 * go straight into the site. The page waits behind the film through the same
 * `intro-waiting` gate the pre-paint script in the root layout sets.
 */
export function CinematicIntro() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Giant blurred glows composited over a live WebGL canvas force iOS Safari
  // to re-blur the whole screen every frame — the single biggest source of
  // the lag visitors feel on iPhones. Touch devices keep the glow gradients
  // but lose the blur; desktop keeps the full cinematic look.
  const [coarse] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches === true,
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<{ revert: () => void } | null>(null);

  /** Signal "user has entered": the flag is written here — at dismissal —
   * and never when the film merely starts playing, so a StrictMode second
   * effect run cannot cancel the film before it could mount.
   * Teardown is deferred with requestAnimationFrame: reverting gsap.context
   * from inside the timeline's own onComplete would run mid-render tick. */
  const dismiss = useCallback(() => {
    requestAnimationFrame(() => ctxRef.current?.revert());
    ctxRef.current = null;
    welcomedThisVisit = true;
    setLeaving(true);
    document.documentElement.classList.remove("intro-waiting");
    document.body.style.overflow = "";
    window.setTimeout(() => {
      setActive(false);
      setLeaving(false);
    }, 520);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.has("intro");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Performance gate: the rules live in `isLightDevice` (src/lib/intro-gate)
    // so the iPhone behaviour is pinned by unit tests — WebKit lies about
    // cores on iOS, so the check must never trust them there.
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const lightDevice = isLightDevice({
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      saveData: nav.connection?.saveData,
      effectiveType: nav.connection?.effectiveType,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    });

    const shouldPlay =
      !welcomedThisVisit &&
      !reduced &&
      (forced || (!lightDevice && pathname === "/"));
    if (!shouldPlay) {
      // Defensive release: the pre-paint gate in the root layout only hides
      // the stage for unwelcomed home visits, but if the class ever got set
      // without the film playing, it must never leave the stage stuck.
      document.documentElement.classList.remove("intro-waiting");
      document.body.style.overflow = "";
      return;
    }
    const show = window.setTimeout(() => {
      setActive(true);
      document.documentElement.classList.add("intro-waiting");
      document.body.style.overflow = "hidden";
    }, 40);
    return () => {
      window.clearTimeout(show);
    };
  }, [pathname]);

  /** Drives the film once the stage exists. Everything GSAP creates is made
   * inside one gsap.context whose owner element is the stage, so teardown is
   * a single ctx.revert() — killing tweens by hand (some already completed,
   * some detached from their owner timeline) corrupts GSAP's internal graph
   * and throws "Cannot read properties of undefined". */
  useEffect(() => {
    if (!active) return;

    let killed = false;
    let ctx: { revert: () => void } | null = null;
    let cleanups: Array<{ kill: () => void }> = [];

    void import("gsap").then((mod) => {
      if (killed) return;
      const stage = stageRef.current;
      if (!stage) return;
      const gsap = mod.default;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => dismiss(),
        });

        // ── Scene 1: the invitation ────────────────────────────────────
        // Timings are kept tight on purpose: on phones every idle second in
        // front of the film feels like lag, so Enter is reachable in under
        // five seconds while the House still gets its entrance.
        const invite = stage.querySelector<HTMLElement>("[data-invite]");
        if (invite) {
          const lines = invite.querySelectorAll<HTMLElement>("[data-line]");
          tl.fromTo(
            lines,
            { opacity: 0, yPercent: 120, rotateX: -50 },
            {
              opacity: 1,
              yPercent: 0,
              rotateX: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power4.out",
              transformOrigin: "50% 100%",
            },
            0.2,
          ).to(invite, { opacity: 0, y: -24, duration: 0.45, ease: "power2.in" }, 2.0);
        }

        // ── Scene 2: the GLANCE House rises as one veil — the building
        // itself is a real-time 3D scene that turns and answers the hand.
        tl.set("[data-house-scene]", { visibility: "visible" }, 2.3).fromTo(
          "[data-house-scene]",
          { opacity: 0 },
          { opacity: 1, duration: 0.4 },
          2.3,
        );

        const hint = stage.querySelector<HTMLElement>("[data-hint]");
        if (hint) {
          tl.fromTo(
            hint,
            { opacity: 0 },
            { opacity: 1, duration: 0.45 },
            3.8,
          ).fromTo(
            hint,
            { opacity: 1 },
            { opacity: 0.55, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut" },
            4.4,
          );
        }

        // Enter rises above the House and stays until dismissed — nobody is
        // ever trapped on the stage.
        tl.fromTo(
          stage.querySelector<HTMLElement>("[data-enter]"),
          { opacity: 0, y: 26, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.6)" },
          4.1,
        )
          .fromTo(
            stage.querySelector<HTMLElement>("[data-footer]"),
            { opacity: 0 },
            { opacity: 1, duration: 0.6 },
            4.4,
          )
          .call(() => {
            stage.querySelector<HTMLButtonElement>("[data-enter]")?.focus();
          });
      }, stage);

      // Keep the teardown handle for dismiss(), which may fire long after
      // this effect's cleanup has already run.
      ctxRef.current = ctx;
    });

    return () => {
      killed = true;
      cleanups.forEach(({ kill }) => kill());
      cleanups = [];
      requestAnimationFrame(() => ctx?.revert());
      ctx = null;
    };
  }, [active, dismiss]);

  if (!active) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] overflow-hidden bg-navy-950 [transition:opacity_500ms_ease] ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={leaving}
    >
      <div ref={stageRef} className="absolute inset-0">
        {/* ── Scene 1: the invitation ─────────────────────────────────── */}
        <div
          data-invite
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <h1
            className="fx-3d max-w-[820px] text-[clamp(28px,6vw,64px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-white"
            style={{ transformStyle: "preserve-3d" }}
          >
            <span className="fx-line block overflow-hidden">
              <span data-line className="inline-block will-change-transform">
                Are you ready
              </span>
            </span>
            <span className="fx-line block overflow-hidden">
              <span data-line className="inline-block will-change-transform">
                to be part of
              </span>
            </span>
            <span className="fx-line block overflow-hidden [perspective:700px]">
              <span
                data-line
                className="inline-block bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent will-change-transform"
              >
                a change?
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-[460px] text-[14px] leading-[1.8] text-white/65">
            Real impact in your community — right from your campus.
          </p>
        </div>

        {/* ── Scene 2: the GLANCE House ───────────────────────────────── */}
        <div data-house-scene style={{ visibility: "hidden" }} className="absolute inset-0">
          {/* Standing light pooling under the building */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-[16%] left-1/2 h-[46vh] w-[120vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(234,174,20,0.16)_0%,transparent_60%)] ${coarse ? "" : "blur-lg sm:blur-2xl"}`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.08)_0%,transparent_70%)] ${coarse ? "" : "blur-xl sm:blur-3xl"}`}
          />
          {/* Far skyline for the building to belong to */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            className="pointer-events-none absolute bottom-0 h-[14vh] w-full opacity-[0.16]"
          >
            <path
              d="M0 160V116h96l18-24h104l16 24h64V48l52-30h8v142h84V98h128V72h10v88h92l20-40h140l20 40h72V40l48-28h12v148h104l26-50h118l24 50h70V72h46v88h84V22l64-22h12l4 160Z"
              fill="rgba(255,255,255,0.6)"
            />
          </svg>

          {/* Kicker + heading above the house */}
          <div className="absolute inset-x-0 top-[5vh] flex flex-col items-center px-6 text-center">
            <p
              data-extra
              className="text-[11px] font-bold tracking-[0.36em] text-gold-400 uppercase"
            >
              What GLANCE opens for you
            </p>
            <h1 className="fx-3d mt-3 max-w-[820px] text-[clamp(24px,4.4vw,46px)] leading-[1.08] font-extrabold tracking-[-0.03em] text-white">
              <span
                data-face-copy
                className="bg-gradient-to-r from-white via-white to-gold-200 bg-clip-text text-transparent"
              >
                Six doors. One look around, and you know GLANCE.
              </span>
            </h1>
          </div>

          {/* The House of the movement, rebuilt as a real 3D building. The
              canvas owns the pointer: drag anywhere on it and the walk-around
              follows the hand, momentum included, turning on its own between
              visits. */}
          <div
            data-grab
            className="absolute inset-x-0 bottom-[17vh] top-[24vh] cursor-grab touch-none select-none"
          >
            <Suspense fallback={null}>
              <IntroBuildingScene />
            </Suspense>
          </div>
        </div>

        {/* Enter: rises after the house settles and stays until dismissed.
            The drag hint lives in the same column so the two never collide. */}
        <div className="absolute inset-x-0 bottom-[2.5vh] flex flex-col items-center gap-2.5">
          <p
            data-hint
            className="text-[10.5px] font-bold tracking-[0.28em] text-white/65 uppercase"
            style={{ opacity: 0 }}
          >
            Drag the building · turn it full circle
          </p>
          <button
            type="button"
            onClick={dismiss}
            data-enter
            aria-label="Enter the GLANCE website"
            className="pointer-events-auto inline-flex h-12 items-center gap-2.5 rounded-full bg-gold-400 px-10 text-[14px] font-extrabold tracking-[0.08em] text-navy-950 uppercase shadow-[0_18px_40px_-16px_rgba(251,202,75,0.8)] transition-transform hover:scale-[1.05] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
            style={{ opacity: 0 }}
          >
            Enter
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 1.5 13.5 8 8 14.5 6.4 13 10.4 9H2V7h8.4L6.4 3z" />
            </svg>
          </button>
          <p
            data-footer
            className="text-[10.5px] font-bold tracking-[0.22em] text-white/40 uppercase"
            style={{ opacity: 0 }}
          >
            The GLANCE movement · students of Nigeria
          </p>
        </div>
      </div>
    </div>
  );
}
