"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  /* One-time engine setup. */
  useEffect(() => {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
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
    lenisRef.current = lenis;

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

    return () => {
      gsap.ticker.remove(onScroll);
      lenis.destroy();
      lenisRef.current = null;
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  /* Per-page choreography: staggered groups, shine sweeps, and — crucially —
     a reset to the top whenever a new page mounts.

     Lenis keeps its own scroll position across client-side navigation, so
     without this a visitor who clicked "Gallery" from halfway down the
     homepage would land halfway down the gallery (or at its footer) with no
     room left to scroll. Resetting here also re-arms the reveal triggers for
     the new page's elements, which the one-time setup would otherwise miss. */
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.resize();
    }
    window.scrollTo(0, 0);

    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (coarse || reduced) return;

    // Let the new route paint before measuring it.
    const triggers: ScrollTrigger[] = [];
    const frame = requestAnimationFrame(() => {

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
    });

    return () => {
      cancelAnimationFrame(frame);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [pathname]);

  return null;
}
