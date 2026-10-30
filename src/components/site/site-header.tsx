import Link from "next/link";
import { GlanceLogo } from "@/components/glance-logo";
import { DesktopNav, MobileMenu } from "./main-nav";

/**
 * The header as a quiet instrument panel on a white glass bar: a light mono
 * announcement strip, then one translucent white bar — hairline gold at the
 * top edge — with brand left, navigation centred, gold CTA right.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      {/* Announcement strip — quiet context above the nav on large screens. */}
      <div className="hidden border-b border-line bg-white/70 text-navy-900 backdrop-blur-md lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 xl:px-10">
          <p className="font-display text-[10.5px] font-semibold tracking-[0.22em] text-navy-900/55 uppercase">
            Governance · Leadership · National Civic Engagement
          </p>
          <div className="flex items-center gap-5 text-[11px] font-semibold text-navy-900/75">
            <Link
              href="/contact"
              className="transition-colors hover:text-navy-700"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-white/90 shadow-[0_18px_50px_-30px_rgba(10,37,80,0.4)] backdrop-blur-xl">
        {/* Gold signal line above the bar. */}
        <div
          aria-hidden="true"
          className="h-px w-full bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
        />
        <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[78px] xl:px-10">
          {/* Left zone — brand (grows to balance the centred nav). */}
          <div className="flex min-w-0 flex-1 items-center">
            <Link
              href="/"
              className="flex min-w-0 items-center"
              aria-label="GLANCE — home"
            >
              <GlanceLogo variant="dark" className="h-9 w-auto lg:h-10" />
            </Link>
          </div>

          {/* Centre zone — the primary menu (token-flipped by .site-canvas). */}
          <div className="flex flex-none items-center">
            <DesktopNav />
          </div>

          {/* Right zone — the gold call to action, then the mobile trigger. */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <Link
              href="/join"
              className="hidden h-10 items-center gap-2 rounded-lg bg-gold-500 px-5 text-[13px] font-extrabold text-navy-950 shadow-[0_10px_30px_-12px_rgba(234,174,20,0.65)] transition-colors hover:bg-gold-400 lg:inline-flex"
            >
              Get Involved
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h10m0 0l-4-4m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
