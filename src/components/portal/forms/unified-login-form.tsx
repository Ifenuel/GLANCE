"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { FormMessage } from "@/components/forms/form-parts";
import { loginAction } from "@/server/actions/auth";
import { idleFormState } from "@/server/validation";

/**
 * The sign-in card's options: "Remember me" and "Forgot password?" live in
 * one small dropdown instead of a loose row, so nothing scatters across the
 * card on a phone. Escape and a click outside close it; toggling the
 * checkbox keeps the menu open so the state stays visible.
 */
function LoginOptionsDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
      >
        Sign-in options
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 w-56 origin-top-right overflow-hidden rounded-xl border border-white/15 bg-[#0b2038] p-1.5 shadow-[0_20px_44px_-20px_rgba(0,0,0,0.8)]"
        >
          <label
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12.5px] font-medium text-white/85 hover:bg-white/[0.07]"
          >
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-gold-500 focus:ring-gold-400"
            />
            Remember me
          </label>
          <Link
            role="menuitem"
            href="/portal/forgot-password"
            className="block rounded-lg px-3 py-2.5 text-[12.5px] font-semibold text-gold-300 hover:bg-white/[0.07]"
          >
            Forgot password?
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function UnifiedLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, idleFormState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      {/* Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block text-[12px] font-semibold text-white/90"
        >
          Email Address
        </label>
        <div className="relative mt-1.5">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Enter your email"
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[13.5px] text-white placeholder:text-white/35 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.09] focus:border-gold-400 focus:bg-white/[0.1] focus:outline-none focus:ring-1 focus:ring-gold-400"
          />
        </div>
        {state.errors?.email ? (
          <p className="mt-1 text-[11.5px] text-rose-400">{state.errors.email}</p>
        ) : null}
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="password"
          className="block text-[12px] font-semibold text-white/90"
        >
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 pr-11 text-[13.5px] text-white placeholder:text-white/35 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.09] focus:border-gold-400 focus:bg-white/[0.1] focus:outline-none focus:ring-1 focus:ring-gold-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/50 transition-colors hover:text-white"
          >
            {showPassword ? (
              <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M3 3l14 14M8.5 8.7a2 2 0 002.8 2.8M6.2 6.4C4.2 7.7 2.7 9.6 2 10.7c1 1.8 4.6 5.3 8 5.3 1.5 0 2.9-.6 4.1-1.4M9 5.1c.3 0 .7-.1 1-.1 3.4 0 7 3.5 8 5.3-.4.8-1.4 2.2-2.9 3.3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M2 10.7c1-1.8 4.6-5.3 8-5.3s7 3.5 8 5.3c-1 1.8-4.6 5.3-8 5.3s-7-3.5-8-5.3z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="10.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
        {state.errors?.password ? (
          <p className="mt-1 text-[11.5px] text-rose-400">{state.errors.password}</p>
        ) : null}
      </div>

      {/* One compact dropdown carries the options (the old remember-me row
          wrapped into two uneven strips on phones). */}
      <div className="flex justify-end pt-1">
        <LoginOptionsDropdown />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="sheen flex w-full items-center justify-center gap-2 rounded-xl bg-[#EAAE14] py-3.5 text-[14px] font-extrabold text-navy-950 shadow-[0_12px_24px_-10px_rgba(234,174,20,0.8)] transition-all hover:-translate-y-0.5 hover:bg-gold-500 hover:shadow-[0_18px_34px_-12px_rgba(234,174,20,0.75)] active:scale-[0.99] disabled:translate-y-0 disabled:opacity-60"
        >
          {isPending ? "Signing in…" : "Sign in"}
          {!isPending ? (
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
      </div>

    </form>
  );
}
