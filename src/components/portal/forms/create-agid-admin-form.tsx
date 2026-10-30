"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { createAgidAdminAction } from "@/server/actions/admin";
import { idleFormState } from "@/server/validation";

export function CreateAgidAdminForm() {
  const [state, formAction] = useActionState(createAgidAdminAction, idleFormState);

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
        label="Full name"
        htmlFor="name"
        required
        error={state.errors?.name}
      >
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="Dr. Jumoke Oduwole"
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
          required
          placeholder="officer@glance.org.ng"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
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
        htmlFor="passwordConfirm"
        required
        error={state.errors?.passwordConfirm}
      >
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat password"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Phone number (optional)"
        htmlFor="phone"
        error={state.errors?.phone}
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="080 1234 5678"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <SubmitButton pendingLabel="Creating administrator account…">
        Create network administrator
      </SubmitButton>

      <p className="text-[11.5px] text-ink-400">
        Network administrators manage chapters, member records, applications,
        invitations and audit logs for the entire network. Use this only when
        needed.
      </p>
    </form>
  );
}
