"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlanceMark } from "@/components/glance-logo";
import { logoutAction, verifyPasswordAction } from "@/server/actions/auth";

/**
 * Locks the portal after two minutes of no interaction.
 *
 * The overlay is a client-side guard: the session cookie is still valid
 * underneath, and every server action continues to authorise as normal. Its
 * job is the shared-device case. An officer walks away from a logged-in
 * workstation, the screen blacks out completely, and it stays black until the
 * password is typed again. The password is checked by the server against the
 * real hash, so the overlay cannot be bypassed by editing the DOM.
 */
const IDLE_MS = 2 * 60 * 1000;
const WARN_MS = 10 * 1000;

export function ScreenLock({ name }: { name: string }) {
  const [locked, setLocked] = useState(false);
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARN_MS / 1000);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
    idleTimer.current = null;
    warnTimer.current = null;
    tickTimer.current = null;
  }, []);

  const arm = useCallback(() => {
    clearTimers();
    warnTimer.current = setTimeout(() => {
      setWarning(true);
      setCountdown(WARN_MS / 1000);
      tickTimer.current = setInterval(() => {
        setCountdown((value) => Math.max(0, value - 1));
      }, 1000);
    }, IDLE_MS - WARN_MS);
    idleTimer.current = setTimeout(() => {
      setLocked(true);
      setWarning(false);
      clearTimers();
    }, IDLE_MS);
  }, [clearTimers]);

  useEffect(() => {
    if (locked) return;

    // Activity is a real user event, so it is the place to drop a warning
    // that was already counting down before the idle clock restarts.
    const activity = () => {
      setWarning(false);
      if (!locked) arm();
    };

    arm();
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "wheel",
      "focus",
    ];
    for (const event of events) {
      window.addEventListener(event, activity, { passive: true });
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, activity);
      }
      clearTimers();
    };
  }, [locked, arm, clearTimers]);

  useEffect(() => {
    if (locked) {
      document.body.style.overflow = "hidden";
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [locked]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    if (!password || checking) return;
    setChecking(true);
    setError(null);
    try {
      const result = await verifyPasswordAction(password);
      if (result.ok) {
        setPassword("");
        setWarning(false);
        setLocked(false);
        arm();
      } else {
        setError(result.error ?? "That password is incorrect.");
      }
    } catch {
      setError("Something didn't go through. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function signOutEverywhere() {
    await logoutAction();
  }

  return (
    <>
      {warning && !locked ? (
        <div
          role="status"
          className="rise fixed right-5 bottom-5 z-[90] flex items-center gap-3 rounded-xl border border-gold-300 bg-white px-4 py-3 shadow-[0_20px_44px_-24px_rgba(5,42,92,0.4)]"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-500" />
          </span>
          <p className="text-[12.5px] font-semibold text-navy-900">
            Screen locks in {countdown}s. Move the mouse to stay signed in.
          </p>
        </div>
      ) : null}

      {locked ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Screen locked"
          className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-[#05070b] text-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(70% 55% at 50% 0%, rgba(16,74,54,0.35) 0%, transparent 60%), radial-gradient(50% 40% at 85% 100%, rgba(10,37,80,0.55) 0%, transparent 65%)",
            }}
          />

          <div className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
            <div className="flex items-center gap-2.5">
              <GlanceMark tone="light" height={26} />
              <span className="font-display text-[13px] font-bold tracking-[0.22em] text-white/90 uppercase">
                GLANCE
              </span>
            </div>
            <span className="font-data text-[10.5px] font-semibold tracking-[0.16em] text-white/35 uppercase">
              Locked session
            </span>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16">
            <div className="w-full max-w-[390px]">
              <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_0_6px_rgba(255,255,255,0.02)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7 text-gold-400"
                  aria-hidden="true"
                >
                  <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
                  <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
                  <path d="M12 15v2" />
                </svg>
              </div>

              <h1 className="font-display mt-7 text-center text-[26px] font-bold tracking-[-0.02em] text-white">
                Screen locked
              </h1>
              <p className="mt-2 text-center text-[13px] leading-relaxed text-white/45">
                {name.split(" ")[0] || "Welcome back"}, enter your password to
                get straight back to where you were.
              </p>

              <form onSubmit={unlock} className="mt-8 space-y-3">
                <label htmlFor="lock-password" className="sr-only">
                  Password
                </label>
                <input
                  ref={inputRef}
                  id="lock-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  aria-invalid={error ? true : undefined}
                  className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 text-[14px] text-white placeholder:text-white/30 focus:border-gold-400 focus:bg-white/[0.07] focus:outline-none"
                />

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-[12.5px] font-semibold text-rose-200"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={checking || !password}
                  className="h-12 w-full rounded-xl bg-gold-400 text-[13.5px] font-bold text-navy-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {checking ? "Checking" : "Unlock screen"}
                </button>
              </form>

              <div className="mt-7 flex items-center justify-center gap-5 text-[11.5px] text-white/40">
                <button
                  type="button"
                  onClick={signOutEverywhere}
                  className="font-semibold underline decoration-white/25 decoration-1 underline-offset-4 transition-colors hover:text-white/80"
                >
                  Sign out instead
                </button>
                <span aria-hidden="true" className="h-3 w-px bg-white/15" />
                <span>Locked after 2 minutes idle</span>
              </div>
            </div>
          </div>

          <p className="relative z-10 pb-6 text-center text-[10.5px] tracking-wide text-white/20">
            GLANCE member area
          </p>
        </div>
      ) : null}
    </>
  );
}
