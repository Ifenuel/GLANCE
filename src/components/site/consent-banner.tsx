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

  if (consent === "granted" || consent === "denied") {
    const granted = consent === "granted";
    return (
      <div className="fixed bottom-3 left-3 z-[60] flex items-center gap-2 rounded-full border border-line bg-white/95 py-1 pr-1 pl-3 text-[11px] font-semibold text-ink-500 shadow-[0_10px_30px_-20px_rgba(5,42,92,0.6)] backdrop-blur">
        <span>{granted ? "Replay on" : "Replay off"}</span>
        <button
          type="button"
          onClick={() => setAnalyticsConsent(granted ? "denied" : "granted")}
          className="rounded-full bg-navy-50 px-2.5 py-1 font-bold text-navy-800 transition-colors hover:bg-navy-100"
        >
          {granted ? "Turn off" : "Turn on"}
        </button>
        <Link
          href="/privacy"
          className="pr-1.5 text-navy-600 underline-offset-4 hover:underline"
        >
          Privacy
        </Link>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[560px] rounded-xl border border-line bg-white p-4 shadow-[0_24px_60px_-30px_rgba(5,42,92,0.55)] sm:inset-x-4 sm:bottom-4 sm:p-5"
    >
      <p className="text-[11px] font-bold tracking-[0.12em] text-navy-900/60 uppercase">
        Privacy choice
      </p>
      <p className="mt-2 text-[13px] leading-[1.7] text-ink-600">
        We would like to record fully masked walkthroughs of the public pages with
        PostHog, so we can see where the site is hard to use. Nothing is recorded
        until you allow it: the member area, application forms and anything you type
        are never recorded.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAnalyticsConsent("granted")}
          className="inline-flex h-9 items-center rounded-lg bg-navy-900 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-navy-950"
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsConsent("denied")}
          className="inline-flex h-9 items-center rounded-lg border border-line px-4 text-[12.5px] font-bold text-navy-700 transition-colors hover:bg-navy-50"
        >
          No thanks
        </button>
        <Link
          href="/privacy"
          className="ml-auto text-[12px] font-semibold text-navy-600 underline-offset-4 hover:underline"
        >
          Privacy policy
        </Link>
      </div>
    </div>
  );
}
