"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Public error boundary. The visitor sees one calm sentence and a way forward;
 * the detail is logged for us and never rendered.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] page error", error);
  }, [error]);

  return (
    <main className="navy-wash flex min-h-[80vh] items-center justify-center px-5 py-20">
      <div className="w-full max-w-[460px]">
        <p className="text-[11px] font-bold tracking-[0.22em] text-gold-400 uppercase">
          GLANCE
        </p>
        <h1 className="mt-4 text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] text-white sm:text-[36px]">
          This page stopped short.
        </h1>
        <p className="mt-4 text-[14.5px] leading-[1.8] text-white/70">
          One more try should bring it back. Everything else on the site keeps
          working while you are here.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gold-400 px-6 text-[13px] font-bold text-navy-900 transition-colors hover:bg-gold-500"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/25 px-6 text-[13px] font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10"
          >
            Back to the homepage
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-[12.5px] text-white/60">
          <Link href="/about" className="underline underline-offset-4 hover:text-white">
            About GLANCE
          </Link>
          <Link href="/chapters" className="underline underline-offset-4 hover:text-white">
            Chapters
          </Link>
          <Link href="/join" className="underline underline-offset-4 hover:text-white">
            Join
          </Link>
          <Link href="/contact" className="underline underline-offset-4 hover:text-white">
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
