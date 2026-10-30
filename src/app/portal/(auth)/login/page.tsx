import type { Metadata } from "next";
import Link from "next/link";
import { GlanceLogo, GlanceMark } from "@/components/glance-logo";
import { UnifiedLoginForm } from "@/components/portal/forms/unified-login-form";
import { CopyrightYear } from "@/components/site/copyright-year";

export const metadata: Metadata = {
  title: "Portal Sign In | GLANCE",
  description: "Sign in to the GLANCE member area.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-[#040D1A] text-white selection:bg-gold-400 selection:text-navy-950">
      {/* Background Graphic / Scrim matching the reference image */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="drift-slow absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.12)_0%,transparent_70%)] blur-3xl" />
        <div className="drift-slow absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(8,32,68,0.8)_0%,transparent_70%)] blur-2xl [animation-delay:-3s]" />
        <div className="drift-slow absolute left-[-120px] bottom-24 h-72 w-72 rounded-full bg-gold-500/[0.07] blur-3xl [animation-delay:-6s]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,13,26,0.7),rgba(4,13,26,0.95))]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-white/[0.08] bg-[#040D1A]/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
            <GlanceLogo variant="light" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-5 text-[13px]">
            <Link
              href="/"
              className="text-white/70 hover:text-gold-400 font-medium transition-colors"
            >
              ← Back to Website
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Interface (One unified interface matching the reference design) */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[460px]">
          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#081830]/90 p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            {/* Logo inside card */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.1] shadow-inner transition-transform duration-500 hover:scale-105">
                <GlanceMark className="h-9 w-auto" />
              </div>
              <h1 className="text-[23px] font-extrabold tracking-tight text-white">
                <span className="shimmer-text bg-gradient-to-r from-white via-gold-300 to-white bg-clip-text text-transparent">
                  GLANCE Portal Login
                </span>
              </h1>
              <span aria-hidden className="rule-grow mt-2 h-[2px] w-full rounded-full bg-white/10" />
              <p className="mt-2.5 text-[13px] leading-relaxed text-white/60">
                Sign in with your email and password
              </p>
            </div>

            {/* Single Unified Login Form */}
            <UnifiedLoginForm />
          </div>

      {/* Footer — calm, non-technical help */}
      <div className="mt-6 flex flex-col items-center gap-2 text-[12px]">
        <p className="text-center leading-[1.8] text-white/45">
          Issues signing in? Contact your GLANCE coordinator or the
          secretariat for help.
        </p>
      </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] py-4 text-center text-[12px] text-white/40">
        <div className="mx-auto max-w-6xl px-6">
          © <CopyrightYear /> GLANCE. Governance, Leadership and National Civic Engagement.
        </div>
      </footer>
    </div>
  );
}
