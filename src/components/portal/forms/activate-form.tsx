"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { activateAccountAction } from "@/server/actions/auth";
import { idleFormState } from "@/server/validation";

export function ActivateForm() {
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
        htmlFor="activationCode"
        required
        error={state.errors?.activationCode}
      >
        <input
          id="activationCode"
          name="activationCode"
          placeholder="e.g. GLN7KQ2M"
          maxLength={40}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full name"
          htmlFor="name"
          required
          error={state.errors?.name}
        >
          <input
            id="name"
            name="name"
            placeholder="Jumoke Oduwole"
            autoComplete="name"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
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
            placeholder="you@institution.edu.ng"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <Field
        label="Choose a role"
        htmlFor="role"
        required
        error={state.errors?.role}
      >
        <select
          id="role"
          name="role"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        >
          <option value="">Select a role…</option>
          <option value="CHAPTER_ADMIN">Chapter coordinator</option>
          <option value="MEMBER">Member (will receive full profile form)</option>
          <option value="ALUMNI">Alumni (will receive full profile form)</option>
        </select>
      </Field>

      <SubmitButton pendingLabel="Activating account…">
        Activate account
      </SubmitButton>
    </form>
  );
}
