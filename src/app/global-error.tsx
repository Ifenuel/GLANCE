"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary. It replaces the root layout, so it carries its own
 * html and body and cannot use the app router. Copy stays human: no database,
 * server or "temporary issue" language reaches a visitor.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] render failed", error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#04295a] text-white">
        <main className="flex min-h-screen items-center justify-center px-5 py-20">
          <div className="w-full max-w-[440px]">
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#f9d775] uppercase">
              GLANCE
            </p>
            <h1 className="mt-4 text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[36px]">
              This page stopped short.
            </h1>
            <p className="mt-4 text-[14.5px] leading-[1.8] text-white/70">
              One more try should bring it back.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#fbca4b] px-6 text-[13px] font-bold text-[#0A2550]"
              >
                Try again
              </button>
              {/* No router exists above this boundary, so a full load is the
                  correct recovery path. */}
              {/* eslint-disable @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/25 px-6 text-[13px] font-bold text-white"
              >
                Back to the homepage
              </a>
              {/* eslint-enable @next/next/no-html-link-for-pages */}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
