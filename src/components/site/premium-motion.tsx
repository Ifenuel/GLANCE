"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * The site-wide motion foundation.
 *
 * - Lenis drives the scroll: one smooth, weighted ease for the whole page,
 *   exactly the feel people read as "premium".
 * - GSAP/ScrollTrigger drives anything that animates as you reach it (used by
 *   the Reveal component and by the [data-stagger] helpers below).
 *
 * Everything is skipped cleanly for touch devices, reduced motion and older
 * browsers — content is simply shown, never hidden behind motion.
 */
export function PremiumMotion() {
  useEffect(() => {
    const coarse =
      window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (coarse || reduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.15,
      // Slightly weighted wheel feel without being floaty.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let ticking = false;
    const onScroll = (time: number) => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ScrollTrigger.update();
          ticking = false;
        });
      }
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onScroll);
    gsap.ticker.lagSmoothing(0);

    // Staggered group reveals: any container marked [data-stagger] lifts its
    // children in as the group reaches the viewport.
    const triggers: ScrollTrigger[] = [];
    document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
      const items = Array.from(group.children) as HTMLElement[];
      if (items.length === 0) return;
      gsap.set(items, { opacity: 0, y: 26 });
      const tween = gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: {
          trigger: group,
          start: "top 82%",
          once: true,
        },
      });
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });

    // Gold shine sweep on wide banner surfaces, subtle and one-shot.
    document.querySelectorAll<HTMLElement>("[data-shine]").forEach((panel) => {
      gsap.fromTo(
        panel,
        { backgroundPositionX: "0%" },
        {
          backgroundPositionX: "100%",
          duration: 2.4,
          ease: "power1.out",
          scrollTrigger: { trigger: panel, start: "top 85%", once: true },
        },
      );
    });

    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      gsap.ticker.remove(onScroll);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}
