type MotionStep = [
  target: Element | Iterable<Element> | null,
  fromVars: Record<string, unknown>,
  toVars: Record<string, unknown>,
  position?: unknown,
];

type GsapTimeline = {
  fromTo: (...args: MotionStep) => GsapTimeline;
  kill: () => void;
};

type GsapBundle = {
  timeline: (config?: Record<string, unknown>) => GsapTimeline;
  fromTo: (...args: MotionStep) => void;
  to: (target: Element | null, vars: Record<string, unknown>) => {
    kill: () => void;
  };
  registerPlugin?: (...plugins: unknown[]) => void;
};

/**
 * The actual animation timeline, loaded lazily through the client island —
 * keeps gsap's core off the critical path until after hydration. Everything
 * animates FROM a visible state: if the script never runs or a JS error
 * interrupts it, the hero still reads perfectly, since the base markup
 * already shows the headline.
 */
export function runHeroMotion(root: HTMLElement): (() => void) | undefined {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  let timeline: ReturnType<GsapBundle["timeline"]> | null = null;
  let parallax: ReturnType<GsapBundle["to"]> | null = null;
  let headlineFade: ReturnType<GsapBundle["to"]> | null = null;

  void import("gsap").then(async (mod) => {
    const ScrollTriggerMod = await import("gsap/ScrollTrigger");
    const gsap = mod.default as unknown as GsapBundle;
    gsap.registerPlugin?.(ScrollTriggerMod.ScrollTrigger);

    const stage = root.closest("section");
    if (!stage) return;

    // ── Entrance: the broadcast's decisive rise, one beat at a time ──
    timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline
      .fromTo(
        stage.querySelector("[data-hero-glow]"),
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 2.4, ease: "sine.out" },
      )
      .fromTo(
        stage.querySelector("[data-motion='eyebrow']"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7 },
        "+=0",
      )
      .fromTo(
        stage.querySelectorAll("[data-motion^='headline-'] > span"),
        { opacity: 0, yPercent: 110 },
        { opacity: 1, yPercent: 0, duration: 1.1, stagger: 0.14, ease: "power4.out" },
        "+=0",
      )
      .fromTo(
        stage.querySelector("[data-motion='supporting']"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8 },
        "+=0",
      )
      .fromTo(
        stage.querySelector("[data-motion='actions']"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        "+=0",
      )
      .fromTo(
        stage.querySelector("[data-motion='cue']"),
        { opacity: 0 },
        { opacity: 1, duration: 0.8 },
        "+=0",
      );

    // ── Photograph: settle from a gentle zoom, then parallax on scroll ──
    gsap.fromTo(
      stage.querySelector("[data-hero-parallax] img"),
      { scale: 1.12 },
      { scale: 1, duration: 3.2, ease: "power2.out" },
    );

    parallax = gsap.to(stage.querySelector("[data-hero-parallax]"), {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    headlineFade = gsap.to(stage.querySelector("h1"), {
      opacity: 0.25,
      yPercent: -8,
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "60% center",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  return () => {
    timeline?.kill();
    parallax?.kill();
    headlineFade?.kill();
  };
}
