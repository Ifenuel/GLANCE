type GsapLike = {
  registerPlugin?: (...plugins: unknown[]) => void;
  fromTo(
    target: Element | Element[] | NodeListOf<Element> | null,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ): { scrollTrigger?: { kill: () => void }; kill: () => void };
  set(
    target: Element | Element[] | NodeListOf<Element> | null,
    vars: Record<string, unknown>,
  ): void;
};

type ScrollTriggerLike = {
  register: (plugin?: unknown) => void;
  getAll: () => Array<{ kill: () => void }>;
};

let loading: Promise<{ gsap: GsapLike; ScrollTrigger: ScrollTriggerLike }> | null =
  null;

/**
 * One lazy GSAP + ScrollTrigger loader shared by every motion island on the
 * page. The core (~24 kB gzipped) downloads only after hydration, and
 * ScrollTrigger registers exactly once no matter how many sections ask.
 */
export function loadGsap() {
  if (!loading) {
    loading = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollTriggerModule]) => {
        const gsap = gsapModule.gsap as unknown as GsapLike;
        const ScrollTrigger = scrollTriggerModule
          .ScrollTrigger as unknown as ScrollTriggerLike;
        gsap.registerPlugin?.(ScrollTrigger);
        return { gsap, ScrollTrigger };
      },
    );
  }
  return loading;
}

/** Shared guard: callers skip setup entirely for reduced-motion users. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
