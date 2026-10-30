/**
 * Consent-gated PostHog session replay for the GLANCE website.
 *
 * Plain ESM on purpose: `src/instrumentation-client.ts` mounts this module in the
 * browser, and `posthog-replay.check.mjs` imports the very same file in Node to
 * exercise it against stubbed SDK, router and consent objects. Nothing here
 * touches `window`, `document`, `process.env` or the network, so both callers
 * can inject exactly what the controller may use. Its only import is the event
 * scrubber, which is also plain ESM with no imports.
 *
 * Recording is off until a visitor says yes: the SDK starts opted out with
 * replay disabled, and only an affirmative consent followed by a page inside
 * `SAFE_JOURNEY` calls `opt_in_capturing()` and a plain
 * `startSessionRecording()`. Leaving the journey, denying, withdrawing or
 * having no project token stops capture.
 */

import { scrubForSend } from "./posthog-events.mjs";

/** Public pages a recorded walkthrough may cover. */
export const SAFE_JOURNEY = Object.freeze([
  "/",
  "/about",
  "/pathway",
  "/leading-at-27",
  "/chapters",
  "/impact",
  "/news",
  "/events",
  "/gallery",
  "/alumni",
  "/partners",
]);

/**
 * Routes that never reach a snapshot: the management portal (auth, member
 * records, applications, audit), the application and contact forms, certificate
 * verification and free-text search. Auth, payment and account screens are
 * excluded before the first snapshot rather than masked afterwards.
 */
export const SENSITIVE_ROUTE_PREFIXES = Object.freeze([
  "/portal",
  "/join",
  "/start-a-chapter",
  "/contact",
  "/verify",
  "/search",
]);

/**
 * Extra DOM blockers on top of `ph-no-capture`. Text masking hides words but
 * not attributes or images, so a sensitive subtree has to be replaced wholesale.
 */
export const SENSITIVE_DOM_SELECTOR = [
  ".ph-no-capture",
  "[data-ph-sensitive]",
  "input[type='hidden']",
  "input[type='file']",
].join(", ");

/** Attributes that carry typed or personal values rather than layout. */
const SENSITIVE_ATTRIBUTES = new Set([
  "value",
  "alt",
  "title",
  "placeholder",
  "aria-label",
  "aria-description",
  "data-email",
  "data-name",
  "data-phone",
  "data-token",
]);

/**
 * Path identifiers, which never belong in a recording: UUIDs, long unbroken
 * base-62 tokens (invitation, certificate and member codes) and numeric ids.
 * Readable slugs such as `convocation-2026` stay in the journey.
 */
const OPAQUE_SEGMENT =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{4,}|(?=.{16,}$)(?=.*[a-z])(?=.*[0-9])[a-z0-9]+)$/;

/**
 * Reduce any URL or path to a lower-case path without query or fragment.
 * @param {unknown} input
 * @returns {string | null} `null` when the value cannot be parsed safely.
 */
function normalisePath(input) {
  if (typeof input !== "string") return null;
  let value = input.trim();
  if (!value) return null;

  const cut = value.search(/[?#]/);
  if (cut !== -1) value = value.slice(0, cut);

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.startsWith("//")) {
    try {
      value = new URL(value, "http://localhost").pathname;
    } catch {
      return null;
    }
  }

  if (!value.startsWith("/")) value = `/${value}`;

  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }

  decoded = decoded.toLowerCase().replace(/\/{2,}/g, "/");
  if (decoded.length > 1) decoded = decoded.replace(/\/+$/, "");
  return decoded || "/";
}

/**
 * @param {unknown} origin
 * @returns {string | null}
 */
function normaliseOrigin(origin) {
  if (typeof origin !== "string" || !origin.trim()) return null;
  try {
    const parsed = new URL(origin.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * @param {string} path A normalised path.
 * @returns {boolean}
 */
function hasOpaqueIdentifier(path) {
  return path
    .split("/")
    .some((segment) => segment.length > 0 && OPAQUE_SEGMENT.test(segment));
}

/**
 * True when a path must never be recorded. Unparseable input counts as
 * sensitive, so a malformed URL fails closed.
 * @param {unknown} pathname
 * @returns {boolean}
 */
export function isSensitivePath(pathname) {
  const path = normalisePath(pathname);
  if (!path) return true;

  const blocked = SENSITIVE_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return blocked || hasOpaqueIdentifier(path);
}

/**
 * True when a path belongs to the public journey we are willing to record.
 * @param {unknown} pathname
 * @returns {boolean}
 */
export function isSafeJourneyPath(pathname) {
  const path = normalisePath(pathname);
  if (!path || isSensitivePath(path)) return false;

  return SAFE_JOURNEY.some((route) =>
    route === "/" ? path === "/" : path === route || path.startsWith(`${route}/`),
  );
}

/**
 * Redact one captured capture URL: the replay page URL in a snapshot and every
 * captured network request URL pass through here. Query strings and fragments
 * are dropped, unsafe or unparseable URLs and blocked paths are rejected, and
 * bodies and headers are cleared as a second line behind `recordBody` /
 * `recordHeaders` being off.
 *
 * @param {Record<string, unknown> | null | undefined} request
 * @param {{ origin?: string }} [options]
 * @returns {Record<string, unknown> | null}
 */
export function redactCapturedUrl(request, options = {}) {
  if (!request || typeof request !== "object") return null;
  if (typeof request.name !== "string") return null;

  const raw = request.name.trim();
  if (!raw) return null;

  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//");
  const origin = normaliseOrigin(options.origin);
  if (!isAbsolute && !origin) return null;

  let parsed;
  try {
    parsed = new URL(raw, origin ?? undefined);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;

  if (isSensitivePath(parsed.pathname)) return null;

  request.name = isAbsolute
    ? `${parsed.protocol}//${parsed.host}${parsed.pathname}`
    : parsed.pathname;

  delete request.requestHeaders;
  delete request.responseHeaders;
  request.requestBody = null;
  request.responseBody = null;

  return request;
}

/**
 * @param {string} name
 * @param {string} value
 * @returns {string}
 */
function maskAttribute(name, value) {
  return SENSITIVE_ATTRIBUTES.has(String(name).toLowerCase()) ? "[redacted]" : value;
}

/**
 * The full `posthog.init` configuration. Every privacy channel the browser SDK
 * exposes is set here rather than left to project defaults, so a remote setting
 * cannot switch body, header, canvas, JSON-LD or console capture back on.
 *
 * @param {{ host: string, origin?: string | null }} input
 * @returns {Record<string, unknown>}
 */
export function buildReplayConfig({ host, origin = null }) {
  return {
    api_host: host,
    // Nothing is sent, and no profile is built, before consent.
    opt_out_capturing_by_default: true,
    disable_session_recording: true,
    // Event collection channels stay off; replay is the only thing we asked for.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    rageclick: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    enable_recording_console_log: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
      blockClass: "ph-no-capture",
      blockSelector: SENSITIVE_DOM_SELECTOR,
      maskAttributeFn: maskAttribute,
      recordBody: false,
      recordHeaders: false,
      captureCanvas: { recordCanvas: false },
      captureJsonLd: false,
      // Runs for network requests and for the replay page URL alike.
      maskCapturedNetworkRequestFn: (request) => redactCapturedUrl(request, { origin }),
    },
    // The only events this client may send are the membership-funnel events,
    // with their allowlisted properties and no automatic metadata.
    before_send: scrubForSend,
  };
}

/**
 * @typedef {'granted' | 'denied' | 'unknown'} ConsentState
 */

/**
 * The slice of the PostHog browser client this controller drives.
 * @typedef {object} ReplaySdk
 * @property {boolean} [__loaded]
 * @property {(token: string, config?: Record<string, unknown>, name?: string) => void} init
 * @property {() => void} opt_in_capturing
 * @property {() => void} opt_out_capturing
 * @property {() => boolean} has_opted_in_capturing
 * @property {() => void} startSessionRecording
 * @property {() => void} stopSessionRecording
 * @property {() => boolean} sessionRecordingStarted
 */

/**
 * @typedef {object} ReplayEnv
 * @property {string | null | undefined} [token] Public project token.
 * @property {string | null | undefined} [host] US or EU ingestion host.
 * @property {string | null | undefined} [origin] Current browser origin.
 * @property {boolean} [isBrowser]
 */

/**
 * @typedef {object} ReplayRouter
 * @property {() => string} pathname
 * @property {(listener: (url: string) => void) => (() => void) | void} [subscribe]
 */

/**
 * @typedef {object} ReplayConsent
 * @property {() => ConsentState | string | null | undefined} current
 * @property {(listener: () => void) => (() => void) | void} [subscribe]
 */

/**
 * @typedef {object} ReplayController
 * @property {boolean} active
 * @property {string} reason
 * @property {() => void} sync
 * @property {(url?: string) => void} onRouteChange
 * @property {() => void} stop
 */

/** @type {WeakMap<object, ReplayController>} */
const controllers = new WeakMap();

/**
 * @param {unknown} fn
 * @returns {unknown} The call result, or `undefined` if the SDK threw.
 */
function attempt(fn) {
  try {
    return typeof fn === "function" ? fn() : undefined;
  } catch {
    // A broken SDK must never break the page it is measuring.
    return undefined;
  }
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {string} host
 * @returns {boolean}
 */
function isIngestionHost(host) {
  const origin = normaliseOrigin(host);
  return origin !== null && origin !== "null";
}

/**
 * Mount (or return the already mounted) replay controller for one SDK client.
 * Calling it again for the same client never re-initialises, re-subscribes or
 * restarts a recording that is already running.
 *
 * @param {{ sdk: ReplaySdk, router?: ReplayRouter, consent?: ReplayConsent, env?: ReplayEnv }} deps
 * @returns {ReplayController}
 */
export function createReplayController({ sdk, router, consent, env } = {}) {
  const sdkKey = /** @type {object | undefined} */ (sdk);
  if (sdkKey && controllers.has(sdkKey)) return controllers.get(sdkKey);

  const settings = env ?? {};
  const token = clean(settings.token);
  const host = clean(settings.host);
  const isBrowser =
    typeof settings.isBrowser === "boolean"
      ? settings.isBrowser
      : typeof window !== "undefined";
  const origin = normaliseOrigin(settings.origin);

  /** @type {ReplayController} */
  const controller = {
    active: false,
    reason: "not-mounted",
    sync: () => {},
    onRouteChange: () => {},
    stop: () => {},
  };

  if (sdkKey) controllers.set(sdkKey, controller);

  if (!sdk) {
    controller.reason = "missing-sdk";
    return controller;
  }
  if (!isBrowser) {
    controller.reason = "not-browser";
    return controller;
  }
  // No token or no chosen region is a no-op: no client, no listeners, no calls.
  if (!token || !host) {
    controller.reason = "missing-config";
    return controller;
  }
  if (!isIngestionHost(host)) {
    controller.reason = "invalid-host";
    return controller;
  }

  let unsubscribeRouter = null;
  let unsubscribeConsent = null;
  let initialised = false;

  /**
   * @param {string | undefined} url
   */
  const readPath = (url) => {
    if (typeof url === "string" && url.trim()) return url;
    return String(attempt(() => (typeof router?.pathname === "function" ? router.pathname() : "/")) ?? "/");
  };

  /**
   * The SDK is initialised lazily: an unauthenticated or unconsented visit
   * downloads no PostHog script and opens no connection to the ingestion
   * host. `init` only ever runs on the first consented `apply`, which also
   * keeps the sensitive-route exemption — a grant given while on a sensitive
   * screen still never instruments that screen before the visit moves on.
   */
  const ensureInitialised = () => {
    if (initialised) return;
    try {
      // Reuse the existing client when one is already initialised elsewhere.
      if (sdk.__loaded !== true) sdk.init(token, buildReplayConfig({ host, origin }));
      initialised = true;
    } catch {
      controller.active = false;
      controller.reason = "init-failed";
      if (unsubscribeRouter) attempt(unsubscribeRouter);
      if (unsubscribeConsent) attempt(unsubscribeConsent);
      unsubscribeRouter = null;
      unsubscribeConsent = null;
      throw new Error("init-failed");
    }
  };

  const readConsent = () => {
    const state = attempt(() => consent?.current());
    return state === "granted" ? "granted" : "unknown";
  };

  /**
   * Reconcile the SDK with consent and the current page. Idempotent: it only
   * calls into the SDK when the desired state differs from the current one.
   * @param {string} [url]
   */
  const apply = (url) => {
    if (!controller.active) return;

    const path = readPath(url);
    const granted = readConsent() === "granted";

    if (!granted) {
      // Unknown or denied consent never records, and a withdrawal opts out of
      // analytics as well as stopping the recording.
      // The SDK may not be initialised yet (lazily): these calls are safe
      // no-ops on an uncreated client, and the full teardown stays correct
      // for a client that exists.
      if (attempt(() => sdk.sessionRecordingStarted()) === true) {
        attempt(() => sdk.stopSessionRecording());
      }
      if (attempt(() => sdk.has_opted_in_capturing()) === true) {
        attempt(() => sdk.opt_out_capturing());
      }
      return;
    }

    // Consent granted: only now does the client exist and reach the network.
    try {
      ensureInitialised();
    } catch {
      return;
    }

    const safe = isSafeJourneyPath(path);
    const recording = attempt(() => sdk.sessionRecordingStarted()) === true;

    if (!safe) {
      // Sensitive screen: stop before anything new is snapshotted. Consent to
      // analytics is untouched, so returning to the journey resumes replay.
      if (recording) attempt(() => sdk.stopSessionRecording());
      return;
    }

    if (attempt(() => sdk.has_opted_in_capturing()) !== true) {
      attempt(() => sdk.opt_in_capturing());
    }
    if (!recording) {
      // Plain start: project enablement, sampling, triggers, minimum duration
      // and authorized domains still decide whether any bytes are sent.
      attempt(() => sdk.startSessionRecording());
    }
  };

  controller.active = true;
  controller.reason = "mounted";
  controller.sync = () => apply(undefined);
  controller.onRouteChange = (url) => apply(typeof url === "string" ? url : undefined);

  try {
    if (router && typeof router.subscribe === "function") {
      const off = router.subscribe((url) => controller.onRouteChange(url));
      unsubscribeRouter = typeof off === "function" ? off : null;
    }
  } catch {
    unsubscribeRouter = null;
  }
  try {
    if (consent && typeof consent.subscribe === "function") {
      const off = consent.subscribe(() => controller.sync());
      unsubscribeConsent = typeof off === "function" ? off : null;
    }
  } catch {
    unsubscribeConsent = null;
  }

  controller.stop = () => {
    if (attempt(() => sdk.sessionRecordingStarted()) === true) {
      attempt(() => sdk.stopSessionRecording());
    }
    if (unsubscribeRouter) attempt(unsubscribeRouter);
    if (unsubscribeConsent) attempt(unsubscribeConsent);
    unsubscribeRouter = null;
    unsubscribeConsent = null;
    controller.active = false;
    controller.reason = "stopped";
  };

  apply(undefined);
  return controller;
}
