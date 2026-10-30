/**
 * Ambient browser globals the app's own inline scripts define.
 *
 * `src/app/layout.tsx` writes `window.__glanceIntroStartedAt` before the React
 * bundle runs, so the client intro can measure how long the zip animation has
 * already been playing on a repeat visit.
 */
export {};

declare global {
  interface Window {
    __glanceIntroStartedAt?: number;
  }
}
