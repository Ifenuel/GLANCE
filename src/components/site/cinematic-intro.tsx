"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export const INTRO_STORAGE_KEY = "glance:intro-seen";

/** "Already welcomed this visit" — sessionStorage, so the film greets a
 * visitor exactly once per tab session: the first time the site is loaded.
 * Reloads, link clicks back to the homepage and tab switches never replay
 * it, because the marker outlives all of those inside the tab. Closing the
 * tab clears the marker, so a fresh session is met by the film again. */
let welcomedThisVisit = false;

function alreadyWelcomed() {
  if (welcomedThisVisit) return true;
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    // Storage can throw in private modes with data disabled; fall back to
    // the in-memory marker alone.
    return false;
  }
}

function markWelcomed() {
  welcomedThisVisit = true;
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    // Same as above — the in-memory still covers this page load.
  }
}

/**
 * The GLANCE House. A hexagonal building whose six faces are, literally, the
 * six things GLANCE opens for you. The house turns on its own like a slow
 * carousel and the visitor can take hold of it and walk it around a full
 * 360° — every side shows its offer in gold on deep-navy glass.
 */
const OFFERS = [
  { title: "Scholarships", note: "Study support that reaches real students" },
  { title: "Mentorship", note: "National leaders backing your next step" },
  { title: "Leadership", note: "The chance to run something that matters" },
  { title: "Civic education", note: "Know your rights, your vote, your nation" },
  { title: "Career growth", note: "A pathway from campus into purpose" },
  { title: "Community impact", note: "Projects that land where you live" },
];

const HEX = 6;
const FACE_STEP = 360 / HEX;

/**
 * The site's opening film, starring the GLANCE House:
 *
 *   1. One short invitation — "Are you ready to be part of a change?"
 *   2. The House rises and turns, face after face presenting what GLANCE
 *      offers. The visitor can grab it and spin it 360° by hand.
 *   3. Enter releases the film into the site.
 *
 * On the homepage's first visit (or forced with ?intro=1) the film plays
 * over a full-viewport navy stage, then releases itself — or immediately via
 * the Enter button. Nothing autoplays sound. Visitors who prefer reduced
 * motion, or who have already seen the film this session, go straight into
 * the site. The page waits behind the film through the same `intro-waiting`
 * gate the pre-paint script in the root layout sets.
 */
export function CinematicIntro() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<{ revert: () => void } | null>(null);

  /** Signal "user has entered": the flag is written here — at dismissal —
   * and never when the film merely starts playing. Writing it at start made
   * the gate self-annulling under React StrictMode's double effect: the
   * second run saw "seen" and cancelled the film before it could mount.
   * Teardown is deferred with requestAnimationFrame: reverting gsap.context
   * from inside the timeline's own onComplete would run mid-render tick. */
  const dismiss = useCallback(() => {
    requestAnimationFrame(() => ctxRef.current?.revert());
    ctxRef.current = null;
    markWelcomed();
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
    const seen = alreadyWelcomed();

    const shouldPlay = !reduced && (forced || (!seen && pathname === "/"));
    if (!shouldPlay) {
      // Defensive release: the pre-paint gate in the root layout only hides
      // the stage for unwelcomed home visits, but if the class ever got set
      // without the film playing, it must never leave the stage stuck.
      document.documentElement.classList.remove("intro-waiting");
      document.body.style.overflow = "";
      return;
    }
    // No storage write here: the flag is set on dismissal (see dismiss),
    // because writing it while the film is up lets a StrictMode second run
    // cancel it out before the film is ever seen.
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
        const house = stage.querySelector<HTMLElement>("[data-house]");
        const faces = Array.from(
          stage.querySelectorAll<HTMLElement>("[data-face]"),
        );
        const reducedHere = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => dismiss(),
        });

        // ── Scene 1: the invitation ────────────────────────────────────
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
              duration: 0.9,
              stagger: 0.14,
              ease: "power4.out",
              transformOrigin: "50% 100%",
            },
            0.3,
          ).to(invite, { opacity: 0, y: -24, duration: 0.6, ease: "power2.in" }, 2.8);
        }

        // ── Scene 2: the House ─────────────────────────────────────────
        if (house) {
          tl.set("[data-house-scene]", { visibility: "visible" }, 3.2)
            .fromTo(
              "[data-house-scene]",
              { opacity: 0 },
              { opacity: 1, duration: 0.4 },
              3.2,
            )
            .set(house, { visibility: "visible" }, 3.4)
            .fromTo(
              house,
              { opacity: 0, y: 180, scale: 0.6 },
              { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: "power4.out" },
              3.4,
            );
        }

        faces.forEach((face, i) => {
          const inner = face.querySelector<HTMLElement>("[data-face-inner]");
          if (!inner) return;
          const at = 3.9 + i * 0.45;
          tl.set(face, { visibility: "visible" }, at)
            .fromTo(
              inner,
              { opacity: 0, y: 26 },
              { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
              at,
            );
        });          if (house && !reducedHere) {
          // The house turns on its own, visibly, until the visitor takes the
          // wheel — then it yields and turns by hand with momentum.
          let spin = gsap.to(house, {
            rotateY: "+=360",
            duration: 30,
            repeat: -1,
            ease: "none",
          });
          cleanups.push({ kill: () => spin.kill() });

          let dragging = false;
          let lastX = 0;
          let lastMoveTime = 0;
          let velocity = 0;

          const onDown = (event: PointerEvent) => {
            if ((event.target as HTMLElement).closest("button")) return;
            dragging = true;
            velocity = 0;
            lastX = event.clientX;
            lastMoveTime = performance.now();
            spin.pause();
            gsap.set(house, { cursor: "grabbing" });
          };
          const onMove = (event: PointerEvent) => {
            if (!dragging) return;
            // Touch: without this the browser starts a scroll and cancels
            // the pointer sequence before a single degree is turned.
            event.preventDefault();
            const now = performance.now();
            const dx = event.clientX - lastX;
            const dt = Math.max(now - lastMoveTime, 1);
            if (dx !== 0) {
              const delta = dx * 0.35;
              velocity = (delta / dt) * 16.7; // per-frame target
              gsap.set(house, { rotateY: `+=${delta}` });
              lastX = event.clientX;
              lastMoveTime = now;
            }
          };
          const onUp = () => {
            if (!dragging) return;
            dragging = false;
            gsap.set(house, { cursor: "grab" });
            // Hand momentum back to the carousel: glide with what the visitor
            // left behind, then settle back into the everlasting turn. One
            // spin tween at a time — the paused one is retired first.
            spin.kill();
            spin = gsap.fromTo(
              house,
              { rotateY: `+=${velocity * 0.9}` },
              {
                rotateY: "+=360",
                duration: Math.max(10, 30 - Math.min(Math.abs(velocity) * 2, 24)),
                repeat: -1,
                ease: "none",
              },
            );
          };

          const grabSurface = stage.querySelector<HTMLElement>("[data-grab]");
          if (grabSurface) {
            grabSurface.addEventListener("pointerdown", onDown);
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
            cleanups.push({
              kill: () => {
                grabSurface.removeEventListener("pointerdown", onDown);
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);
              },
            });
          }
        }

        const hint = stage.querySelector<HTMLElement>("[data-hint]");
        if (hint) {
          tl.fromTo(
            hint,
            { opacity: 0 },
            { opacity: 1, duration: 0.6 },
            5.2,
          ).fromTo(
            hint,
            { opacity: 1 },
            { opacity: 0.55, duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut" },
            6,
          );
        }

        // Enter rises above the House and stays until dismissed — nobody is
        // ever trapped on the stage.
        tl.fromTo(
          stage.querySelector<HTMLElement>("[data-enter]"),
          { opacity: 0, y: 26, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.6)" },
          5.6,
        )
          .fromTo(
            stage.querySelector<HTMLElement>("[data-footer]"),
            { opacity: 0 },
            { opacity: 1, duration: 0.8 },
            5.9,
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

  // A hexagon whose circumradius keeps the projected building inside a
  // readable column on every viewport (GSAP rotates in transforms; the
  // vertical anchor lives in `top`, which GSAP never touches).
  const radius = streetWidth(190) / 2 / Math.tan(Math.PI / HEX);

  return (
    <div
      className={`fixed inset-0 z-[9998] overflow-hidden bg-navy-950 [transition:opacity_500ms_ease] ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={leaving}
    >
      <style>{STAGE_CSS}</style>
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
            className="pointer-events-none absolute bottom-[16%] left-1/2 h-[46vh] w-[120vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(234,174,20,0.16)_0%,transparent_60%)] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.08)_0%,transparent_70%)] blur-3xl"
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

          {/* The House itself, in one shared 3D perspective. The visitor can
              grab it anywhere on the stone apron and walk it round 360°. */}
          <div
            data-grab
            className="absolute inset-x-0 bottom-[17vh] top-[24vh] cursor-grab touch-none select-none"
          >
            {/* A screen-space wrapper: the whole scene scales down on small
                viewports so the building never floods the screen. */}
            <div data-house-wrap className="absolute inset-0">
            {/* The institution's rooftop billboard: outside the 3D scene, so
                "GLANCE" is always crisp and readable no matter how the
                building turns. It is anchored with the same height formula as
                the house, so it always hangs on the roof's edge. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[calc(50%_-_min(62vw,400px)_*_0.54_-_14px)] z-[2] flex -translate-y-full -translate-x-1/2 items-center whitespace-nowrap rounded-md border border-gold-400/45 bg-navy-950/90 px-4 py-1.5 shadow-[0_14px_34px_-20px_rgba(234,174,20,0.7)] sm:px-5"
            >
              <span className="text-[13px] font-extrabold tracking-[0.3em] text-gold-400 uppercase sm:text-[15px] sm:tracking-[0.4em]">
                GLANCE
              </span>
              <span
                aria-hidden="true"
                className="mx-2 hidden h-3.5 w-px bg-gold-400/50 sm:mx-3 sm:block"
              />
              <span className="hidden text-[10px] font-bold tracking-[0.26em] text-white/60 uppercase sm:block">
                House of the movement
              </span>
            </div>

            <div className="absolute inset-0" style={{ perspective: "1300px", perspectiveOrigin: "50% 44%" }}>
              <div
                data-house
                className="absolute left-1/2 top-[calc(50%_-_min(62vw,400px)_*_0.54)] h-[min(62vw,400px)] w-[min(54vw,340px)] -translate-x-1/2"
                style={{
                  transformStyle: "preserve-3d",
                  visibility: "hidden",
                  touchAction: "none",
                }}
              >
                {/* Stone apron under the building — it turns with the house
                    so the floor sense of a real round trip remains */}
                <div
                  aria-hidden="true"
                  data-face-inner
                  className="absolute left-1/2 top-full h-[110px] w-[125%] -translate-x-1/2 rounded-[50%] border border-gold-400/10 bg-[radial-gradient(ellipse_at_center,rgba(10,37,80,0.9)_0%,rgba(10,37,80,0.3)_55%,transparent_75%)]"
                  style={{ transform: "translateX(-50%) rotateX(86deg) translateZ(-40px)" }}
                />

                <div
                  className="absolute inset-x-0 top-0 bottom-0"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Hexagonal roof slab: a real plate above the walls, its
                      top surface caught by a slight forward tilt. */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 top-0"
                    style={{
                      width: `${Math.round(radius * 2 + 16)}px`,
                      height: `${Math.round(radius * 0.95)}px`,
                      clipPath:
                        "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                      background:
                        "linear-gradient(160deg, rgba(30,55,96,0.98) 0%, rgba(10,26,48,0.98) 60%, rgba(8,20,38,0.98) 100%)",
                      borderBottom: "1px solid rgba(234,174,20,0.35)",
                      transform: `translateX(-50%) translateY(${Math.round(-radius * 0.18)}px) rotateX(77deg)`,
                      transformStyle: "preserve-3d",
                      filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))",
                    }}
                  />

                  {/* Six glass faces, one offer each, presented round */}
                  {OFFERS.map((offer, i) => {
                    const faceAngle = FACE_STEP * i;
                    // Faces are square for a hexagon: side = 2R tan(π/6).
                    const faceWidth = Math.round(Math.tan(Math.PI / HEX) * 2 * radius);
                    return (
                      <Face
                        key={offer.title}
                        angle={faceAngle}
                        width={faceWidth}
                        radius={radius}
                        offer={offer}
                        dataFaceIndex={i}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Enter: rises after the house settles and stays until dismissed.
            The drag hint lives in the same column so the two never collide. */}
        <div className="absolute inset-x-0 bottom-[2.5vh] flex flex-col items-center gap-2.5">
          <p
            data-hint
            className="text-[10.5px] font-bold tracking-[0.28em] text-white/45 uppercase"
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

/** Hexagon apothem helper: side length for a given circumradius. Derived at
 * render so shrinkage is a function of viewport, not a fixed pixel guess. */
function streetWidth(circumradius: number) {
  return circumradius;
}

/** One hexagonal face of the GLANCE House. `angle` is its position round the
 * building; the face content lifts in as the house settles. */
function Face({
  angle,
  width,
  radius,
  offer,
  dataFaceIndex,
}: {
  angle: number;
  width: number;
  radius: number;
  offer: { title: string; note: string };
  dataFaceIndex: number;
}) {
  return (
    <div
      data-face
      className="absolute left-1/2 top-0"
      style={{
        width: `${width}px`,
        height: "100%",
        marginLeft: `${-width / 2}px`,
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
        transformStyle: "preserve-3d",
        visibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      <div
        data-face-inner
        className="fx-glass relative flex h-full w-full flex-col items-center justify-center gap-2 px-4 pb-14 pt-10 text-center will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Facade architecture: cornice, corner pilasters, mullioned glazing
            above a solid plinth — reads as a real building from every side. */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-2.5 border-b border-gold-400/25 bg-gradient-to-b from-gold-400/20 to-transparent" />
        <span aria-hidden="true" className="absolute inset-y-0 left-2 w-px bg-gold-400/25" />
        <span aria-hidden="true" className="absolute inset-y-0 right-2 w-px bg-gold-400/25" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 top-4 bottom-[46%] opacity-35"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.09) 0 2px, transparent 2px 24px)",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[38%] border-t border-gold-400/15 bg-gradient-to-b from-navy-950/30 to-navy-950/60"
        />

        <span className="font-data text-[10px] font-bold tracking-[0.3em] text-gold-300/70 uppercase">
          {String(dataFaceIndex + 1).padStart(2, "0")}
        </span>
        <p className="text-[15px] font-extrabold tracking-[0.06em] text-white uppercase sm:text-[17px]">
          {offer.title}
        </p>
        <p className="hidden max-w-[10rem] text-[11px] leading-[1.55] text-white/55 sm:block">
          {offer.note}
        </p>
        <span className="mt-1 h-px w-8 bg-gold-400/40" />

        {/* The entrance every face of the house carries */}
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-1/2 h-8 w-9 -translate-x-1/2 rounded-t-[4px] border border-gold-400/30 bg-navy-950/80"
        >
          <span
            aria-hidden="true"
            className="absolute top-1/2 right-1 h-1 w-1 -translate-y-1/2 rounded-full bg-gold-400/70"
          />
        </span>
      </div>
    </div>
  );
}

const STAGE_CSS = `
.fx-glass {
  border-radius: 14px;
  border: 1px solid rgba(234, 174, 20, 0.28);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 55%, rgba(234, 174, 20, 0.06) 100%),
    rgba(10, 24, 46, 0.72);
  box-shadow:
    inset 0 0 28px rgba(234, 174, 20, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(3px);
}
@media (prefers-reduced-motion: reduce) {
  .fx-glass { animation: none !important; }
}
[data-house-wrap] { transform-origin: 50% 58%; }
@media (min-width: 1100px) {
  [data-house-wrap] { transform: scale(1.12); }
}
@media (max-width: 1000px) {
  [data-house-wrap] { transform: scale(0.82); }
}
`;
