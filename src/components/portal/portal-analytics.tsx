"use client";

import { useEffect } from "react";
import {
  identifyPortalMember,
  resetProductAnalytics,
} from "@/lib/analytics/product";

/**
 * Binds the portal session to PostHog with the user's opaque database id only:
 * no name, email, role, chapter or record is ever attached. Leaving the portal
 * (signing out, or a hard hand-off to the public site) drops the identity again.
 *
 * Renders nothing and is inert unless the visitor has granted analytics
 * consent, in which case the funnel controller in
 * `src/lib/analytics/posthog-events.mjs` decides whether anything is sent.
 */
export function PortalAnalytics({ memberId }: { memberId: string }) {
  useEffect(() => {
    identifyPortalMember(memberId);
    return () => {
      resetProductAnalytics();
    };
  }, [memberId]);

  return null;
}
