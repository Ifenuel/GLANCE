"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { idleFormState } from "@/server/validation";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      {state.error ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700"
        >
          {state.success}
        </div>
      ) : null}

      <p className="text-[12.5px] text-ink-500">
        Enter your account email. You&apos;ll receive a reset link on the next
        email we can send.
      </p>

      <Field
        label="Email address"
        htmlFor="email"
        required
        error={state.errors?.email}
      >
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@institution.edu.ng"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <SubmitButton pendingLabel="Sending reset link…">
        Send reset link
      </SubmitButton>

      <p className="text-[11.5px] text-ink-400">
        If that email is registered, we&apos;ll send a reset link. No link will be
        sent if you&apos;re not using a configured email provider.
      </p>
    </form>
  );
}
