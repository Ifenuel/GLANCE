"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  analyticsConsent,
  readAnalyticsConsent,
  setAnalyticsConsent,
} from "@/lib/analytics/consent";

/**
 * The one place a visitor grants or withdraws analytics consent.
 *
 * Undecided shows a short ask; once decided it collapses to a small pill so the
 * choice can still be reversed. Nothing here records anything itself: the
 * replay client in `instrumentation-client.ts` watches the same consent store
 * and starts or stops against it.
 */
export function ConsentBanner() {
  const consent = useSyncExternalStore(
    analyticsConsent.subscribe,
    readAnalyticsConsent,
    () => "pending" as const,
  );

  // Server render and the first hydration pass stay empty, so a returning
  // visitor never sees the ask flash before their stored choice is read.
  if (consent === "pending") return null;

  // Decided: the ask vanishes completely — nothing stays on the website
  // nagging about analytics. The choice can always be reversed from the
  // discreet Analytics toggle in the footer's legal bar.
  if (consent === "granted" || consent === "denied") return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed right-3 bottom-3 z-[9999] max-w-[320px] rounded-xl border border-line bg-white p-3.5 shadow-[0_18px_44px_-24px_rgba(5,42,92,0.55)] sm:right-4 sm:bottom-4"
    >
      <p className="text-[10px] font-bold tracking-[0.12em] text-navy-900/60 uppercase">
        Privacy choice
      </p>
      <p className="mt-1.5 text-[12px] leading-[1.55] text-ink-600">
        May we record masked website walkthroughs to see where the site is hard
        to use? Nothing personal is recorded — and nothing at all until you
        allow it.
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAnalyticsConsent("granted")}
          className="inline-flex h-8 items-center rounded-lg bg-navy-900 px-3 text-[11.5px] font-bold text-white transition-colors hover:bg-navy-950"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsConsent("denied")}
          className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-[11.5px] font-bold text-navy-700 transition-colors hover:bg-navy-50"
        >
          No thanks
        </button>
        <Link
          href="/privacy"
          className="ml-auto text-[11px] font-semibold text-navy-600 underline-offset-4 hover:underline"
        >
          Privacy
        </Link>
      </div>
    </div>
  );
}
