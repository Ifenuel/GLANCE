"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's motion: an eslint-disable comment kept in one narrow client
 * island so the page component itself stays a server component and still
 * renders on the server.
 *
 * The entrance matches the GLANCE broadcast language — everything rises
 * once, decisively, with the photograph settling from a gentle zoom — and
 * a single scroll parallax on the photograph afterwards. Classic GSAP
 * entrance + ScrollTrigger, animating from visible states so a JS failure
 * or a slow script never hides the headline.
 */
export function HeroMotion() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void import("./hero-motion-run").then(({ runHeroMotion }) => {
      if (cancelled) return;
      cleanup = runHeroMotion(root);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div ref={ref} className="contents" aria-hidden="true" />;
}
