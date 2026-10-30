"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up to its real value when it scrolls into view.
 *
 * The first render is always `0` on both server and client, so there is no
 * hydration mismatch. The final value is also present for screen readers from
 * the first paint, so the number is never missing for assistive technology.
 */
export function CountUp({
  value,
  duration = 1700,
  className,
  suffix,
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value === 0) {
      // No animation wanted: show the real figure on the next frame, the same
      // beat the animation would have started on, instead of during the effect.
      const settle = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(settle);
    }

    let frame = 0;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic: fast start, calm finish
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(value * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className={className}>
        {shown.toLocaleString("en-NG")}
        {suffix}
      </span>
      <span className="sr-only">
        {value.toLocaleString("en-NG")}
        {suffix}
      </span>
    </>
  );
}
