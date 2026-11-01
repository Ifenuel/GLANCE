"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/forms/form-parts";
import { loginAction } from "@/server/actions/auth";
import { idleFormState } from "@/server/validation";

interface RoleConfig {
  title: string;
  subtitle: string;
  roleHint?: string;
  needChapterCode?: boolean;
}

export function RoleLoginForm({ config }: { config: RoleConfig }) {
  const [state, formAction] = useActionState(loginAction, idleFormState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <label
          htmlFor="email"
          className="block text-[12px] font-semibold text-white/90"
        >
          Email Address
        </label>
        <div className="mt-1.5">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Enter your email"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/40 focus:border-gold-400 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-gold-400"
          />
        </div>
        {state.errors?.email ? (
          <p className="mt-1 text-[11.5px] text-rose-400">{state.errors.email}</p>
        ) : null}
      </div>

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
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 pr-11 text-[13.5px] text-white placeholder:text-white/40 focus:border-gold-400 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-gold-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/50 hover:text-white"
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

      {config.needChapterCode ? (
        <div>
          <label
            htmlFor="chapterCode"
            className="block text-[12px] font-semibold text-white/90"
          >
            Chapter Code <span className="font-normal text-white/50">(Optional)</span>
          </label>
          <div className="mt-1.5">
            <input
              id="chapterCode"
              name="chapterCode"
              type="text"
              placeholder="e.g. FUTA, UNILAG"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/40 focus:border-gold-400 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-gold-400"
            />
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-white/80">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-gold-500 focus:ring-gold-400"
          />
          Remember me
        </label>
        <a
          href="/portal/forgot-password"
          className="text-[12px] text-white/70 hover:text-gold-400 transition-colors"
        >
          Forgot password?
        </a>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-lg bg-gold-400 py-3 text-[14px] font-bold text-navy-950 shadow-md transition-all hover:bg-gold-300 hover:shadow-lg active:scale-[0.99]"
        >
          Sign in
        </button>
      </div>

      <div className="pt-3 text-center">
        <p className="text-[11.5px] text-white/50">
          Secure Access • GLANCE Network
        </p>
      </div>
    </form>
  );
}
