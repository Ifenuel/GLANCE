/**
 * Product analytics for the membership-application funnel.
 *
 * Plain ESM with no imports on purpose: `src/lib/analytics/product.ts` mounts
 * this module in the browser, and `posthog-analytics.verify.mjs` imports the
 * very same file in Node to drive it against a stubbed SDK and consent store.
 * Nothing here touches `window`, `document`, `process.env` or the network.
 *
 * The contract is a start/success funnel with one drop-off event:
 *
 *   membership_application_started    first interaction with the join form
 *   membership_application_submitted  the action accepted the application
 *   membership_application_failed     the action refused it, with a stable code
 *
 * Only the properties named in `EVENT_PROPERTIES` travel, and `scrubForSend`
 * (installed as the client's `before_send`) deletes everything the SDK adds on
 * its own: URL, referrer, person metadata and any unrecognised event.
 */

/**
 * @typedef {'membership_application_started'
 *   | 'membership_application_submitted'
 *   | 'membership_application_failed'} ProductEventName
 */

/** @type {Readonly<{ STARTED: 'membership_application_started', SUBMITTED: 'membership_application_submitted', FAILED: 'membership_application_failed' }>} */
export const PRODUCT_EVENTS = Object.freeze({
  STARTED: "membership_application_started",
  SUBMITTED: "membership_application_submitted",
  FAILED: "membership_application_failed",
});

/** The membership categories the join form offers. */
export const MEMBERSHIP_CATEGORIES = Object.freeze(["STUDENT", "NON_STUDENT", "ALUMNI"]);

/** Whether the action created an application or found one already pending. */
export const APPLICATION_OUTCOMES = Object.freeze(["created", "already_pending"]);

/**
 * Stable codes returned by `submitJoinApplicationAction`; never user text.
 * `unknown` is the safe fallback for an action that did not name a reason.
 */
export const FAILURE_REASONS = Object.freeze([
  "invalid_fields",
  "unknown_chapter",
  "rate_limited",
  "unknown",
]);

/**
 * The complete property allowlist, per event. A property that is not listed
 * here is dropped before the SDK ever sees it.
 * @type {Readonly<Record<ProductEventName, readonly string[]>>}
 */
export const EVENT_PROPERTIES = Object.freeze({
  [PRODUCT_EVENTS.STARTED]: ["membership_category"],
  [PRODUCT_EVENTS.SUBMITTED]: ["membership_category", "outcome"],
  [PRODUCT_EVENTS.FAILED]: ["reason"],
});

/**
 * Every allowed value is an enum member, so no free text, email, name or token
 * can reach a property by accident.
 * @type {Readonly<Record<string, (value: string) => string | null>>}
 */
const PROPERTY_FORMATS = Object.freeze({
  membership_category: (value) =>
    MEMBERSHIP_CATEGORIES.includes(value) ? value : null,
  outcome: (value) => (APPLICATION_OUTCOMES.includes(value) ? value : null),
  reason: (value) => (FAILURE_REASONS.includes(value) ? value : null),
});

/**
 * The only automatic properties allowed through. They are library and session
 * markers: no URL, no referrer, no person, no device or account identifier.
 */
const KEPT_AUTOMATIC_PROPERTIES = Object.freeze(["$lib", "$lib_version", "$session_id"]);

/** Identity events the SDK may still deliver; their person payload is emptied. */
const IDENTITY_EVENTS = Object.freeze(["$identify"]);

/**
 * Build one allowlisted event from arbitrary input.
 * @param {unknown} name
 * @param {unknown} properties
 * @returns {{ event: ProductEventName, properties: Record<string, string> } | null}
 */
export function buildProductEvent(name, properties) {
  if (typeof name !== "string" || !Object.hasOwn(EVENT_PROPERTIES, name)) return null;

  const allowed = EVENT_PROPERTIES[name];
  const source =
    properties && typeof properties === "object"
      ? /** @type {Record<string, unknown>} */ (properties)
      : {};

  /** @type {Record<string, string>} */
  const safe = {};
  for (const key of allowed) {
    const format = PROPERTY_FORMATS[key];
    const value = source[key];
    if (typeof value !== "string" || !format) continue;
    const cleaned = format(value);
    if (cleaned !== null) safe[key] = cleaned;
  }

  return { event: /** @type {ProductEventName} */ (name), properties: safe };
}

/**
 * The properties of the funnel's start step. An unrecognised category simply
 * produces an event with no properties rather than an event with a stray value.
 * @param {unknown} membershipCategory
 * @returns {Record<string, string>}
 */
export function applicationStartedProperties(membershipCategory) {
  return typeof membershipCategory === "string" &&
    MEMBERSHIP_CATEGORIES.includes(membershipCategory)
    ? { membership_category: membershipCategory }
    : {};
}

/**
 * Translate one `submitJoinApplicationAction` result into the funnel's success
 * or drop-off step. Idle and unknown states produce nothing, so a re-render can
 * never invent an event.
 *
 * @param {{ status?: string, result?: Record<string, string>, reason?: string } | null | undefined} state
 * @param {unknown} membershipCategory
 * @returns {{ event: ProductEventName, properties: Record<string, string> } | null}
 */
export function applicationResultEvent(state, membershipCategory) {
  if (!state || typeof state !== "object") return null;

  if (state.status === "success") {
    return {
      event: PRODUCT_EVENTS.SUBMITTED,
      properties: {
        ...applicationStartedProperties(membershipCategory),
        // The action only returns a reference when it created the record.
        outcome: state.result && typeof state.result === "object" ? "created" : "already_pending",
      },
    };
  }

  if (state.status === "error") {
    return {
      event: PRODUCT_EVENTS.FAILED,
      properties: {
        reason:
          typeof state.reason === "string" && FAILURE_REASONS.includes(state.reason)
            ? state.reason
            : "unknown",
      },
    };
  }

  return null;
}

/**
 * Keep only the automatic markers that carry no visitor data.
 * @param {unknown} properties
 * @returns {Record<string, unknown>}
 */
function keptAutomaticProperties(properties) {
  /** @type {Record<string, unknown>} */
  const kept = {};
  if (!properties || typeof properties !== "object") return kept;

  const source = /** @type {Record<string, unknown>} */ (properties);
  for (const key of KEPT_AUTOMATIC_PROPERTIES) {
    if (Object.hasOwn(source, key)) kept[key] = source[key];
  }
  return kept;
}

/**
 * The client's `before_send` hook: the last gate before an event is queued.
 *
 * Product events keep their allowlisted properties and nothing else. Identity
 * events lose their person payload. Anything else the SDK or a remote setting
 * produces — pageviews, autocapture, pageleave, clicks, exceptions — is dropped.
 *
 * @param {unknown} record
 * @returns {Record<string, unknown> | null}
 */
export function scrubForSend(record) {
  if (!record || typeof record !== "object") return null;

  const input = /** @type {Record<string, unknown>} */ (record);
  const name = typeof input.event === "string" ? input.event : "";
  if (!name) return null;

  const automatic = keptAutomaticProperties(input.properties);

  if (IDENTITY_EVENTS.includes(name)) {
    return {
      ...input,
      properties: automatic,
      $set: {},
      $set_once: undefined,
      $unset: undefined,
    };
  }

  const safe = buildProductEvent(name, input.properties);
  if (!safe) return null;

  return {
    ...input,
    event: safe.event,
    properties: { ...automatic, ...safe.properties },
    $set: undefined,
    $set_once: undefined,
    $unset: undefined,
  };
}

/**
 * An opaque account identifier: the portal's cuid, never a name, email, phone,
 * invitation code or chapter code. Anything else — including an upper-case or
 * word-shaped value — leaves the visitor anonymous.
 * @param {unknown} value
 * @returns {string | null}
 */
export function opaqueMemberId(value) {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (id.length < 8 || id.length > 64) return null;
  if (!/^[a-z0-9]+$/.test(id)) return null;
  if (!/[a-z]/.test(id) || !/[0-9]/.test(id)) return null;
  return id;
}

/**
 * @typedef {'granted' | 'denied' | 'unknown'} ConsentState
 */

/**
 * The slice of the PostHog browser client this controller drives.
 * @typedef {object} ProductSdk
 * @property {boolean} [__loaded]
 * @property {(event: string, properties?: Record<string, unknown>) => unknown} capture
 * @property {(distinctId: string) => unknown} identify
 * @property {() => unknown} reset
 * @property {() => void} opt_in_capturing
 * @property {() => void} opt_out_capturing
 * @property {() => boolean} has_opted_in_capturing
 */

/**
 * @typedef {object} ProductConsent
 * @property {() => ConsentState | string | null | undefined} current
 * @property {(listener: () => void) => (() => void) | void} [subscribe]
 */

/**
 * @typedef {object} ProductAnalytics
 * @property {boolean} active
 * @property {string} reason
 * @property {(name: unknown, properties?: unknown) => boolean} capture
 * @property {(memberId: unknown) => boolean} identify
 * @property {() => boolean} reset
 * @property {() => void} sync
 * @property {() => void} stop
 */

/** @type {WeakMap<object, ProductAnalytics>} */
const controllers = new WeakMap();

/**
 * @param {unknown} fn
 * @returns {unknown} The call result, or `undefined` if the SDK threw.
 */
function attempt(fn) {
  try {
    return typeof fn === "function" ? fn() : undefined;
  } catch {
    // A failing SDK or transport must never break the page it measures.
    return undefined;
  }
}

/**
 * Mount (or return the already mounted) product analytics controller for one
 * SDK client. The client itself is created once by the replay controller in
 * `src/instrumentation-client.ts`; this controller never initialises a second
 * one, and stays inert until that client exists.
 *
 * @param {{ sdk?: ProductSdk, consent?: ProductConsent }} deps
 * @returns {ProductAnalytics}
 */
export function createProductAnalytics({ sdk, consent } = {}) {
  const sdkKey = /** @type {object | undefined} */ (sdk);
  if (sdkKey && controllers.has(sdkKey)) return controllers.get(sdkKey);

  /** @type {(() => void) | null} */
  let unsubscribe = null;

  /** @type {ProductAnalytics} */
  const controller = {
    active: false,
    reason: "not-mounted",
    capture: () => false,
    identify: () => false,
    reset: () => false,
    sync: () => {},
    stop: () => {},
  };

  if (sdkKey) controllers.set(sdkKey, controller);

  if (!sdk) {
    controller.reason = "missing-sdk";
    return controller;
  }

  const readConsent = () => {
    const state = attempt(() => consent?.current());
    return state === "granted" ? "granted" : state === "denied" ? "denied" : "unknown";
  };

  const hasOptedIn = () => attempt(() => sdk.has_opted_in_capturing()) === true;

  /**
   * Keep the SDK opt-in flag in step with the visitor's choice, whatever page
   * they are on. Called on mount and on every consent change.
   */
  const applyConsent = () => {
    if (!controller.active) return;
    try {
      if (readConsent() === "granted") {
        if (!hasOptedIn()) sdk.opt_in_capturing();
        return;
      }
      if (hasOptedIn()) sdk.opt_out_capturing();
    } catch {
      // Ignored: consent bookkeeping must not surface to the visitor.
    }
  };

  /**
   * Become active once the shared client exists. Re-checked on every call, so a
   * controller mounted before `posthog.init` still starts working afterwards.
   */
  const activate = () => {
    if (controller.active) return true;
    if (sdk.__loaded !== true) {
      controller.reason = "client-not-initialised";
      return false;
    }

    controller.active = true;
    controller.reason = "mounted";
    applyConsent();

    if (consent && typeof consent.subscribe === "function") {
      const off = attempt(() => consent.subscribe(() => applyConsent()));
      unsubscribe = typeof off === "function" ? off : null;
    }
    return true;
  };

  controller.capture = (name, properties) => {
    if (!activate()) return false;
    if (readConsent() !== "granted") return false;

    const safe = buildProductEvent(name, properties);
    if (!safe) return false;

    try {
      sdk.capture(safe.event, safe.properties);
      return true;
    } catch {
      // A refused or broken transport is harmless: the form result stands.
      return false;
    }
  };

  controller.identify = (memberId) => {
    if (!activate()) return false;
    if (readConsent() !== "granted") return false;

    const opaque = opaqueMemberId(memberId);
    if (!opaque) return false;

    try {
      sdk.identify(opaque);
      return true;
    } catch {
      return false;
    }
  };

  controller.reset = () => {
    if (!activate()) return false;
    try {
      sdk.reset();
      return true;
    } catch {
      return false;
    }
  };

  controller.sync = () => applyConsent();
  controller.stop = () => {
    if (unsubscribe) attempt(unsubscribe);
    unsubscribe = null;
    controller.active = false;
    controller.reason = "stopped";
  };

  return controller;
}
