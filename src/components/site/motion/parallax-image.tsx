"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { loadGsap, prefersReducedMotion } from "./gsap";

/**
 * Scroll-scrubbed parallax for photography. The child (a next/image or any
 * element) drifts a small vertical distance while its section passes through
 * the viewport — depth without any scroll jank, computed by GSAP's
 * ScrollTrigger rather than per-frame scroll maths.
 *
 * Speed is a small factor by design (default 7%); big offsets look amazing
 * for two seconds and then just look desperate. Reduced-motion users get the
 * static composition, fully rendered.
 */
export function ParallaxImage({
  children,
  speed = 7,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion()) return;

    let kill: (() => void) | undefined;
    let cancelled = false;

    void loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      const tween = gsap.fromTo(
        node.firstElementChild,
        { yPercent: speed, willChange: "transform" },
        {
          yPercent: -speed,
          ease: "none",
          scrollTrigger: {
            trigger: node,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
      kill = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(node.firstElementChild, { clearProps: "transform" });
      };
    });

    return () => {
      cancelled = true;
      kill?.();
    };
  }, [speed]);

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ""}`}>
      {children}
    </div>
  );
}
