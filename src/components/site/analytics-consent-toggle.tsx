"use client";

import { useEffect, useState } from "react";
import {
  analyticsConsent,
  readAnalyticsConsent,
  setAnalyticsConsent,
} from "@/lib/analytics/consent";

/**
 * A discreet analytics switch in the footer's legal bar.
 *
 * The banner asks once and leaves the website afterwards; this is the only
 * place the choice can be seen and reversed afterwards. It reflects the same
 * consent store the replay client watches, so a flip here takes effect
 * immediately. Hidden until mounted so the server render never disagrees with
 * the stored choice.
 */
export function AnalyticsConsentToggle() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<"granted" | "denied" | "unknown">(
    "unknown",
  );

  useEffect(() => {
    setMounted(true);
    setConsent(readAnalyticsConsent());
    return analyticsConsent.subscribe(() => {
      setConsent(readAnalyticsConsent());
    });
  }, []);

  if (!mounted) return null;

  const label =
    consent === "granted"
      ? "Analytics: On"
      : consent === "denied"
        ? "Analytics: Off"
        : "Analytics: Ask on first visit";

  if (consent === "unknown") {
    return (
      <span
        aria-label={`Analytics consent: ask on first visit`}
        className="inline-flex items-center whitespace-nowrap text-white/55"
      >
        {label}
      </span>
    );
  }

  const granted = consent === "granted";

  return (
    <button
      type="button"
      onClick={() => setAnalyticsConsent(granted ? "denied" : "granted")}
      title={
        granted
          ? "Website walkthrough recording is on. Click to turn it off."
          : "Website walkthrough recording is off. Click to turn it on."
      }
      className="inline-flex min-h-[44px] min-w-[44px] items-center whitespace-nowrap transition-colors hover:text-white"
    >
      {label}
    </button>
  );
}
