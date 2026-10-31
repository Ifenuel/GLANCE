"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The cinematic motion layer for the public site, built on GSAP ScrollTrigger
 * and shared by every page so the experience reads as one directed film.
 *
 * Rules the layer obeys everywhere:
 * - `prefers-reduced-motion: reduce` shows the finished composition, static.
 * - Everything renders on the server exactly as it finalises, so the page is
 *   complete in the source before JavaScript takes over.
 * - One shared registration; triggers are torn down on unmount (no leaks).
 */

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}

/* ------------------------------------------------------------------ */
/* KineticHeading — masked, word-by-word headline reveal               */
/* ------------------------------------------------------------------ */

/**
 * Splits a headline into words and rises each word out of a line mask as the
 * block enters the viewport. The real text is always in the source (fully
 * readable without JS, and for screen readers); the mask is presentation.
 */
export function KineticHeading({
  text,
  as: Tag = "h2",
  className,
  delay = 0,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    const words = node.innerHTML.split(/(<[^>]+>)/g).filter(Boolean);
    node.innerHTML = words
      .map((part) =>
        part.startsWith("<")
          ? part
          : part.replace(
              /(\S+)/g,
              `<span class="motion-word"><span class="motion-word__inner">$1</span></span>`,
            ),
      )
      .join(" ");

    const inner = node.querySelectorAll(".motion-word__inner");
    const ctx = gsap.context(() => {
      gsap.set(inner, { yPercent: 110 });
      gsap.to(inner, {
        yPercent: 0,
        duration: 0.9,
        stagger: 0.055,
        delay,
        ease: "power4.out",
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
      });
    }, node);

    return () => ctx.revert();
  }, [delay]);

  return <Tag ref={ref as never} className={`motion-kinetic ${className ?? ""}`}>{text}</Tag>;
}

/* ------------------------------------------------------------------ */
/* Parallax — a layer drifting at its own speed while the page scrolls */
/* ------------------------------------------------------------------ */

/**
 * Scrubbed parallax: the child drifts vertically (and optionally scales)
 * against scroll at a fraction of the viewport. Desktop-leaning effect; on
 * phones it runs with a quieter range so touch scrolling stays natural.
 */
export function Parallax({
  children,
  range = 12,
  scaleTo,
  scaleFrom = 1.12,
  className,
  style,
  mobileRange,
}: {
  children: ReactNode;
  /** Percent of viewport the layer may travel through. */
  range?: number;
  /** Optional scale applied across the travel, e.g. 1.08. */
  scaleTo?: number;
  /** Scale the layer starts with, when scaleTo is set. */
  scaleFrom?: number;
  className?: string;
  style?: CSSProperties;
  /** Quieter travel to use on small screens. */
  mobileRange?: number;
  }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    const phone = window.matchMedia("(max-width: 640px)").matches;
    const travel = phone && mobileRange !== undefined ? mobileRange : range;

    const from: gsap.TweenVars = { ease: "none" };
    const to: gsap.TweenVars = { ease: "none" };
    if (travel) {
      from.yPercent = travel;
      to.yPercent = -travel;
    }
    if (scaleTo) {
      from.scale = scaleFrom;
      to.scale = scaleTo;
    }
    if (!travel && !scaleTo) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(node, from, {
        ...to,
        scrollTrigger: {
          trigger: node.parentElement ?? node,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, node);

    return () => ctx.revert();
  }, [range, scaleTo, mobileRange, scaleFrom]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: "transform", ...style }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MaskReveal — a photograph unveiling through an animated mask        */
/* ------------------------------------------------------------------ */

/**
 * Clip-path unveiling: the frame opens from the bottom edge upward (other
 * directions supported) as it enters the viewport, or scrubbed while the
 * visitor keeps scrolling. Photographs grow quietly inside the opening frame
 * so the shot always feels composed, not stretched.
 */
export function MaskReveal({
  children,
  from = "bottom",
  scrubbed = false,
  className,
  style,
  once = true,
}: {
  children: ReactNode;
  from?: "bottom" | "top" | "left" | "right";
  scrubbed?: boolean;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    const closed =
      from === "bottom"
        ? "inset(100% 0% 0% 0%)"
        : from === "top"
          ? "inset(0% 0% 100% 0%)"
          : from === "left"
            ? "inset(0% 100% 0% 0%)"
            : "inset(0% 0% 0% 100%)";
    const open = "inset(0% 0% 0% 0%)";

    const img = node.querySelector("img");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { clipPath: closed },
        {
          clipPath: open,
          duration: 1.1,
          ease: "power3.out",
          ...(scrubbed
            ? { scrollTrigger: { trigger: node, start: "top 85%", end: "top 35%", scrub: 0.5 } }
            : { scrollTrigger: { trigger: node, start: "top 82%", once } }),
        },
      );
      if (img) {
        gsap.fromTo(
          img,
          { scale: 1.14 },
          {
            scale: 1,
            duration: scrubbed ? 1.4 : 1.5,
            ease: "power3.out",
            scrollTrigger: scrubbed
              ? { trigger: node, start: "top 85%", end: "top 35%", scrub: 0.5 }
              : { trigger: node, start: "top 82%", once },
          },
        );
      }
    }, node);

    return () => ctx.revert();
  }, [from, scrubbed, once]);

  return (
    <div ref={ref} className={className} style={{ willChange: "clip-path", ...style }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ScrubLine — the gold seam drawing itself along the scroll           */
/* ------------------------------------------------------------------ */

/** A hairline whose width answers the scroll — used to thread sections together. */
export function ScrubLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { scaleX: 0.15 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: node, start: "top 92%", end: "bottom 55%", scrub: 0.6 },
        },
      );
    }, node);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`h-px w-full origin-left bg-gradient-to-r from-gold-400 via-gold-400/50 to-transparent ${className ?? ""}`}
      style={{ willChange: "transform" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* StaggerGroup — a family of siblings rising in choreography          */
/* ------------------------------------------------------------------ */

/**
 * One ScrollTrigger driving the children instead of one observer each:
 * they rise with their own positions and small y-offset, a beat apart.
 */
export function StaggerGroup({
  children,
  className,
  step = 0.08,
  rise = 26,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  /** Extra fade so items emerge rather than pop. */
  rise?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        Array.from(node.children),
        { opacity: 0, y: rise },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: step,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top 85%", once: true },
        },
      );
    }, node);
    return () => ctx.revert();
  }, [step, rise]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* useScrollScene — escape hatch for one-of-a-kind compositions        */
/* ------------------------------------------------------------------ */

/**
 * Hook for sections that need a bespoke GSAP scene (pinning, timelines).
 * The callback runs inside a gsap.context scoped to the node and is reverted
 * when the node leaves the tree, cleaning every trigger it created.
 */
export function useScrollScene(
  build: (node: HTMLElement) => gsap.core.Timeline | void,
  scopeKey: string,
) {
  const ref = useRef<HTMLElement>(null);
  const buildRef = useRef(build);

  useEffect(() => {
    // Keep the latest builder without re-running the scene on every render.
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      buildRef.current?.(node);
    }, node);
    return () => ctx.revert();
  }, [scopeKey]);

  return ref;
}

export { gsap, ScrollTrigger, prefersReducedMotion };
