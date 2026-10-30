"use client";

import { GlanceMark } from "@/components/glance-logo";
import Link from "next/link";

/**
 * Error boundary for the whole portal. The copy is deliberately short and
 * confident: it says what happened to the action and what to do next, without
 * exposing infrastructure language to a member or an officer.
 */
export default function PortalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-5 py-16">
      <div className="w-full max-w-[420px] text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 shadow-lg">
          <GlanceMark tone="light" height={28} />
        </div>

        <h1 className="font-display mt-6 text-[26px] font-bold tracking-tight text-navy-900">
          That page didn&apos;t open
        </h1>

        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500">
          Reload the page and continue. Nothing on your account was changed or
          lost.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-navy-900 px-6 py-3 text-[13px] font-bold text-white transition hover:bg-navy-950"
          >
            Reload
          </button>
          <Link
            href="/portal/dashboard"
            className="rounded-full border border-line bg-white px-6 py-3 text-[13px] font-semibold text-navy-900 transition hover:bg-navy-50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
