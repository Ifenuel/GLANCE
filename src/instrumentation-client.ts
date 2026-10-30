/**
 * Client instrumentation entry.
 *
 * Next.js 15.3+ runs `instrumentation-client.ts` once per page load, after the
 * document is ready and before hydration, which is where the PostHog browser
 * client belongs. This file only wires real collaborators into the controller
 * in `src/lib/analytics/posthog-replay.mjs`: the posthog-js singleton, the
 * current router path, the site's consent store and the public project config.
 * The controller itself is plain ESM so `posthog-replay.check.mjs` can import
 * it directly and exercise every branch offline.
 *
 * Configure `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`
 * (US or EU) privately; with either missing the controller is a no-op and no
 * client is created at all.
 */
import posthog from "posthog-js";
import { analyticsConsent } from "./lib/analytics/consent";
import { createReplayController, type ReplayController } from "./lib/analytics/posthog-replay.mjs";
import { mountProductAnalytics } from "./lib/analytics/product";

let replay: ReplayController | null = null;

function mountReplay(): void {
  if (replay) return;
  replay = createReplayController({
    sdk: posthog,
    router: {
      pathname: () => window.location.pathname,
    },
    consent: analyticsConsent,
    env: {
      token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      origin: window.location.origin,
      isBrowser: true,
    },
  });
}

// `posthog.init` injects its loader <script> into the document; doing that
// before React hydrates makes the hydration walk see an unexpected node and
// warn. The controller initialises the client lazily — nothing is downloaded
// before an explicit consent — and it attaches after hydration has finished
// via one idle callback. The funnel controller attaches to the client the
// replay controller just created, so the site keeps exactly one PostHog instance.
if (typeof window !== "undefined") {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => {
      mountReplay();
      mountProductAnalytics();
    });
  } else {
    window.setTimeout(() => {
      mountReplay();
      mountProductAnalytics();
    }, 250);
  }
}

/**
 * App Router navigations, including back and forward. Starting or stopping
 * replay happens inside the controller so a sensitive route is never
 * snapshotted, and a return to the public journey resumes normally.
 */
export function onRouterTransitionStart(url: string): void {
  replay?.onRouteChange(url);
}
