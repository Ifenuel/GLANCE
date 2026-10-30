"use client";

import { useEffect, useRef, useState } from "react";
import { mission, vision } from "@/lib/glance";

/**
 * Mission and vision, typed out as the reader scrolls into them.
 *
 * The text is server-rendered underneath the animation, so it is present for
 * search engines and for reduced-motion visitors before any script runs;
 * the typing effect only ever *reveals* what is already in the DOM. When the
 * block enters the viewport the caret walks the mission first, pauses, then
 * the vision one thought at a time, the way a speaker would deliver it.
 */
export function MissionVision() {
  return (
    <section
      id="mission"
      className="navy-wash relative overflow-hidden py-16 lg:py-24"
    >
      {/* Soft gold bloom behind the text so the navy never reads flat. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-40 h-[420px] w-[420px] rounded-full bg-navy-500/25 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[880px] px-5 sm:px-6">
        <p className="text-[11.5px] font-bold tracking-[0.2em] text-gold-400 uppercase">
          Why we exist
        </p>

        <TypedBlock
          label="Our mission"
          text={mission}
          startDelayMs={250}
          className="mt-10"
        />
        <TypedBlock
          label="Our vision"
          text={vision}
          // Starts once the mission has finished typing.
          startDelayMs={250 + mission.length * 14 + 500}
          className="mt-14"
        />
      </div>
    </section>
  );
}

function TypedBlock({
  label,
  text,
  startDelayMs,
  className,
}: {
  label: string;
  text: string;
  startDelayMs: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Default to fully revealed: with JS disabled, reduced motion, or before
  // the observer attaches, the copy is complete and readable.
  const [revealed, setRevealed] = useState(text.length);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // stays fully revealed

    let cancelled = false;
    let frame = 0;
    let timer = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || cancelled) return;
        observer.disconnect();

        timer = window.setTimeout(() => {
          if (cancelled) return;
          setRevealed(0);
          setTyping(true);

          const startedAt = performance.now();
          // ~14ms per character ≈ 70 chars/second: quick enough that a long
          // mission never feels stalled, slow enough to read as typing.
          const tick = (now: number) => {
            if (cancelled) return;
            const chars = Math.min(
              text.length,
              Math.floor((now - startedAt - startDelayMs) / 14),
            );
            if (chars <= 0) {
              frame = requestAnimationFrame(tick);
              return;
            }
            setRevealed(chars);
            if (chars >= text.length) {
              setTyping(false);
              return;
            }
            frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        }, 120);
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [text, startDelayMs]);

  const done = revealed >= text.length;

  return (
    <div ref={ref} className={className}>
      <p className="text-[10.5px] font-bold tracking-[0.24em] text-gold-400 uppercase">
        {label}
      </p>
      <p className="mt-4 text-[20px] leading-[1.55] font-semibold text-white sm:text-[26px] sm:leading-[1.5]">
        {/* The real text is always in the DOM for crawlers and no-JS readers;
            a clipped duplicate paints the typed portion on top of it. */}
        <span className="sr-only">{text}</span>
        <span aria-hidden="true">
          {text.slice(0, revealed)}
          {typing ? (
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] animate-pulse bg-gold-400 align-baseline"
            />
          ) : null}
        </span>
      </p>
      <span
        aria-hidden="true"
        className={`mt-5 block h-px bg-gradient-to-r from-gold-400/80 to-transparent transition-all duration-700 ${
          done ? "w-40 opacity-100" : "w-0 opacity-0"
        }`}
      />
    </div>
  );
}
