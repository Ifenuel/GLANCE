/**
 * Browser mount for the membership-funnel product analytics.
 *
 * The PostHog client itself is created once, at the supported Next.js boundary
 * (`src/instrumentation-client.ts`), by the replay controller. This module
 * attaches to that same singleton — never a second one — and exposes the two
 * calls the join form makes, so a component never touches `posthog-js`
 * directly. Every call is consent-gated, allowlisted and failure-tolerant:
 * analytics can never change what the form does.
 */
import posthog from "posthog-js";
import { analyticsConsent } from "./consent";
import {
  applicationResultEvent,
  applicationStartedProperties,
  createProductAnalytics,
  PRODUCT_EVENTS,
  type ProductAnalytics,
} from "./posthog-events.mjs";

type FormOutcome = {
  status?: string;
  result?: Record<string, string>;
  reason?: string;
};

let analytics: ProductAnalytics | null = null;

/** Attach the funnel controller to the shared client. Idempotent. */
export function mountProductAnalytics(): ProductAnalytics {
  if (!analytics) {
    analytics = createProductAnalytics({
      sdk: posthog,
      consent: analyticsConsent,
    });
  }
  return analytics;
}

/** Record the start of a membership application: the first form interaction. */
export function trackMembershipApplicationStarted(membershipCategory: string): boolean {
  return mountProductAnalytics().capture(
    PRODUCT_EVENTS.STARTED,
    applicationStartedProperties(membershipCategory),
  );
}

/**
 * Record how one `submitJoinApplicationAction` run ended. The mapping lives in
 * the plain-ESM contract module, so the offline runner exercises the same code
 * this component calls.
 */
export function trackMembershipApplicationResult(
  state: FormOutcome,
  membershipCategory: string,
): boolean {
  const event = applicationResultEvent(state, membershipCategory);
  if (!event) return false;
  return mountProductAnalytics().capture(event.event, event.properties);
}

/** Bind the portal session to its opaque database id (never an email). */
export function identifyPortalMember(memberId: string): boolean {
  return mountProductAnalytics().identify(memberId);
}

/** Drop the identified person again when the visitor leaves the portal. */
export function resetProductAnalytics(): boolean {
  return mountProductAnalytics().reset();
}

export { PRODUCT_EVENTS };
