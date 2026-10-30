"use client";

import { useActionState, useState } from "react";
import {
  Field,
  FormMessage,
  SubmitButton,
  TextInput,
} from "@/components/forms/form-parts";
import { loginAction } from "@/server/actions/auth";
import { idleFormState } from "@/server/validation";

/**
 * The one sign-in form for every administrative role. Access is decided on the
 * server against the account's real role — never from what the user picked on
 * screen. Chapter administrators additionally confirm their chapter code; the
 * field is optional here so Network Officers and Communication Managers only
 * ever see email and password.
 */
export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, idleFormState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <Field label="Email address" htmlFor="email" required error={state.errors?.email}>
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@institution.edu.ng"
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        error={state.errors?.password}
      >
        <div className="relative">
          <TextInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink-400 transition-colors hover:text-navy-900"
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
      </Field>

      <Field
        label="Chapter code"
        htmlFor="chapterCode"
        error={state.errors?.chapterCode}
        hint="Administrators only. The code assigned to your chapter, e.g. GL-001."
      >
        <TextInput
          id="chapterCode"
          name="chapterCode"
          autoComplete="off"
          placeholder="Optional · e.g. GL-001"
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12.5px] text-ink-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-navy-900 focus:ring-navy-500"
          />
          Remember this device
        </label>
        <a
          href="/portal/forgot-password"
          className="text-[12.5px] font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-navy-700"
        >
          Forgot password?
        </a>
      </div>

      <SubmitButton pendingLabel="Signing in…" tone="gold" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
