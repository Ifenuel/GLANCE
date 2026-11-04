"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function subscribeNoop() {
  return () => {};
}

/**
 * Fades content up as it enters the viewport. Respects reduced motion and
 * degrades to plain content when IntersectionObserver is unavailable.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Kept in the API: shifts when this block rises, in milliseconds. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    document.documentElement.style.setProperty("--reveal-hidden", reduced ? "0" : "1");
    if (coarse || reduced || typeof IntersectionObserver === "undefined") {
      // Reduced-motion and touch devices simply show the content.
      gsap.set(node, { opacity: 1, y: 0 });
      return;
    }

    let registered: ScrollTrigger | null = null;
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(node, { opacity: 0, y: 34 });
    const tween = gsap.to(node, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      delay: (delay ?? 0) / 1000,
      ease: "power3.out",
      scrollTrigger: { trigger: node, start: "top 86%", once: true },
    });
    registered = tween.scrollTrigger ?? null;

    return () => {
      if (registered) registered.kill();
      tween.kill();
      gsap.set(node, { opacity: 1, y: 0 });
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
