"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { changePasswordAction } from "@/server/actions/auth";
import { idleFormState } from "@/server/validation";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, idleFormState);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12.5px] font-semibold text-emerald-800">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <Field
        label="Current password"
        htmlFor="currentPassword"
        error={state.errors?.currentPassword?.[0]}
        required
      >
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>
      <Field
        label="New password"
        htmlFor="newPassword"
        error={state.errors?.newPassword?.[0]}
        hint="At least 10 characters."
        required
      >
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>
      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}
