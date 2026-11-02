"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type UpcomingEventBanner = {
  id: string;
  title: string;
  startsAt: string; // ISO string
  location: string;
  registrationUrl: string | null;
};

const DISMISS_KEY = "glance:event-banner-dismissed-until";

/** The event advertisement. Whenever GLANCE has an upcoming event, it pops
 * up like the ad banner one expects from a site with something to say: a
 * scrolling marquee headline, a live countdown to the day, and a Register
 * button. GSAP decides the entrance (drop + settle) and drives the marquee;
 * the countdown ticks on a plain interval.
 *
 * Shown once per tab session (a dismissal is remembered for six hours so a
 * visitor who closed it is not nagged, but a fresh session tomorrow sees it
 * again as asked). Reduced-motion visitors get the same banner, only without
 * the flying entrance. */
export function EventCountdownBanner({ event }: { event: UpcomingEventBanner }) {
  const [visible, setVisible] = useState(false);
  const [dropped, setDropped] = useState(false);
  const [closing, setClosing] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Countdown state, re-ticked every second.
  function parts(target: number) {
    const ms = Math.max(0, target - Date.now());
    return {
      d: Math.floor(ms / 86_400_000),
      h: Math.floor(ms / 3_600_000) % 24,
      m: Math.floor(ms / 60_000) % 60,
      s: Math.floor(ms / 1_000) % 60,
      live: ms <= 0,
    };
  }
  const targetTime = new Date(event.startsAt).getTime();
  const [t, setT] = useState(() => parts(targetTime));

  useEffect(() => {
    // "Show on visiting the website" is the requirement, but a dismissal is
    // honoured inside the same session for six hours.
    let blocked = false;
    try {
      const until = sessionStorage.getItem(DISMISS_KEY);
      if (until && Date.now() < Number(until)) blocked = true;
    } catch {
      // Private mode without storage: show the banner, nobody is harmed.
    }
    if (blocked) return;

    const show = window.setTimeout(() => {
      setVisible(true);
      window.setTimeout(() => setDropped(true), 30);
    }, 2200);
    const tick = window.setInterval(
      () => setT(parts(new Date(event.startsAt).getTime())),
      1000,
    );
    return () => {
      window.clearTimeout(show);
      window.clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  // The marquee always scrolls left; two copies side by side make the loop
  // seamless. GSAP owns the motion so it survives re-parenting.
  useEffect(() => {
    if (!visible) return;
    let killed = false;
    let ctx: { revert: () => void } | null = null;
    void import("gsap").then((mod) => {
      if (killed) return;
      const track = marqueeRef.current;
      if (!track) return;
      const gsap = mod.default;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      ctx = gsap.context(() => {
        gsap.to(track, {
          xPercent: -50,
          duration: 16,
          repeat: -1,
          ease: "none",
        });
      }, track);
    });
    return () => {
      killed = true;
      requestAnimationFrame(() => ctx?.revert());
      ctx = null;
    };
  }, [visible]);

  function close() {
    setClosing(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, String(Date.now() + 6 * 60 * 60 * 1000));
    } catch {
      // ignore
    }
    window.setTimeout(() => setVisible(false), 500);
  }

  if (!visible) return null;

  const target = new Date(event.startsAt);

  return (
    <aside
      aria-label={`Upcoming event: ${event.title}`}
      className={`relative z-[70] w-full overflow-hidden border-b border-gold-400/25 [transition:max-height_540ms_cubic-bezier(0.22,1,0.36,1)] ${
        !closing && dropped ? "max-h-[112px]" : "max-h-0"
      }`}
    >
      {/* A slim masthead ribbon in the page's own flow, right above the
          header. It expands smoothly (no content jump) at the very top of
          the site, and simply scrolls away with the page instead of
          floating over anything. */}
      <div
        className="w-full bg-navy-950"
        style={{
          transform: dropped ? "translateY(0)" : "translateY(-30%)",
          opacity: dropped ? 1 : 0,
          transition:
            "transform 640ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease",
        }}
      >
        <div className="flex h-6 items-center overflow-hidden border-b border-white/10 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
          <div ref={marqueeRef} className="flex w-max shrink-0 items-center gap-10 pr-10 pl-10 whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="flex items-center gap-10" aria-hidden={i === 1}>
                <span className="text-[9px] font-extrabold tracking-[0.3em] text-navy-950 uppercase">
                  GLANCE event · coming up
                </span>
                <span className="text-[9px] font-extrabold tracking-[0.3em] text-navy-950/70 uppercase">
                  ★
                </span>
                <span className="text-[9px] font-extrabold tracking-[0.3em] text-navy-950 uppercase">
                  Be there · tell a friend
                </span>
                <span className="text-[9px] font-extrabold tracking-[0.3em] text-navy-950/70 uppercase">
                  ★
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* One slim line: event, live countdown, action, dismiss */}
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2 sm:flex-nowrap sm:px-6">
          <div className="min-w-0 flex-1">
            <Link
              href="/events"
              className="flex min-w-0 items-baseline gap-2 truncate text-[13px] font-extrabold text-white hover:text-gold-200"
            >
              <span className="shrink-0 text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">
                {target.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
              </span>
              <span className="truncate">{event.title}</span>
            </Link>
          </div>

          {/* Live countdown, one compact chip */}
          <div
            className="flex shrink-0 items-center gap-1 font-mono text-[11.5px] font-bold text-white tabular-nums"
            role="timer"
            aria-live="off"
          >
            {([
              ...(t.d > 0 ? [[t.d, "d"] as const] : []),
              [t.h, "h"] as const,
              [t.m, "m"] as const,
              [t.s, "s"] as const,
            ])
              .map(([value, unit]) => (
                <span key={unit} className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5">
                  {String(value).padStart(2, "0")}
                  <span className="ml-0.5 text-[8px] font-bold text-white/45">{unit}</span>
                </span>
              ))}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {event.registrationUrl ? (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1.5 rounded-full bg-gold-400 px-3.5 text-[10.5px] font-extrabold tracking-[0.06em] text-navy-950 uppercase transition-transform hover:scale-[1.04]"
              >
                Register
                <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
                  <path d="M8 1.5 13.5 8 8 14.5 6.4 13 10.4 9H2V7h8.4L6.4 3z" />
                </svg>
              </a>
            ) : (
              <Link
                href="/events"
                className="inline-flex h-7 items-center gap-1.5 rounded-full bg-gold-400 px-3.5 text-[10.5px] font-extrabold tracking-[0.06em] text-navy-950 uppercase transition-transform hover:scale-[1.04]"
              >
                View details
                <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
                  <path d="M8 1.5 13.5 8 8 14.5 6.4 13 10.4 9H2V7h8.4L6.4 3z" />
                </svg>
              </Link>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Dismiss the event announcement"
              className="grid h-7 w-7 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                <path d="M3.7 5.1 5.1 3.7 8 6.6l2.9-2.9 1.4 1.4L9.4 8l2.9 2.9-1.4 1.4L8 9.4l-2.9 2.9-1.4-1.4L6.6 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

const BANNER_CSS = `
.glance-ad::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(120% 90% at 85% 0%, rgba(234,174,20,0.16), transparent 55%);
  pointer-events: none;
}
.glance-ad { position: relative; }
`;
