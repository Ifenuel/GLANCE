/**
 * The site's analytics consent source of truth.
 *
 * One key, one answer: `granted`, `denied`, or `unknown`. Recording is only
 * ever allowed on an explicit `granted`; a missing, blocked or unrecognised
 * value stays `unknown`, which never opts anyone in.
 *
 * Stored in localStorage so the choice survives reloads, and read lazily so a
 * blocked storage API fails closed instead of throwing during render.
 */

export type AnalyticsConsent = "granted" | "denied" | "unknown";

export const ANALYTICS_CONSENT_KEY = "glance:analytics-consent";

const listeners = new Set<() => void>();

let snapshot: AnalyticsConsent = "unknown";
let started = false;

function readStored(): AnalyticsConsent {
  if (typeof window === "undefined") return "unknown";
  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return raw === "granted" || raw === "denied" ? raw : "unknown";
  } catch {
    return "unknown";
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  snapshot = readStored();
  // Another tab changing the choice re-syncs this one.
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== ANALYTICS_CONSENT_KEY) return;
    snapshot = readStored();
    emit();
  });
}

/** Current choice. Never assumes consent for a missing or unreadable value. */
export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unknown";
  start();
  return snapshot;
}

/** Record an affirmative or negative choice and notify the mounted replay client. */
export function setAnalyticsConsent(next: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  start();
  snapshot = next;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, next);
  } catch {
    // Storage blocked: the choice still applies to this page view, and the
    // next load reads `unknown` again rather than inheriting consent.
  }
  emit();
}

/** Subscribe to choice changes. */
export function subscribeAnalyticsConsent(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The consent source injected into the replay controller and the banner. */
export const analyticsConsent = {
  current: readAnalyticsConsent,
  subscribe: subscribeAnalyticsConsent,
} as const;
