"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { activateAccountAction } from "@/server/actions/auth";
import { idleFormState } from "@/server/validation";

export function InvitationAcceptanceForm() {
  const [state, formAction] = useActionState(activateAccountAction, idleFormState);

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

      <Field
        label="Activation code"
        htmlFor="code"
        required
        error={state.errors?.code}
      >
        <input
          id="code"
          name="code"
          required
          maxLength={40}
          placeholder="GLN7KQ2M is the code GLANCE or your chapter's coordinators sent you"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] uppercase tracking-wide text-navy-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        error={state.errors?.password}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Choose a strong password"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="confirmPassword"
        required
        error={state.errors?.confirmPassword}
      >
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat password"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <SubmitButton pendingLabel="Activating account…">
        Activate account
      </SubmitButton>
    </form>
  );
}
