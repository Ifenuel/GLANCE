"use client";

import { useActionState } from "react";
import { Field, FormMessage, Select, SubmitButton } from "@/components/forms/form-parts";
import { createStaffAccountAction } from "@/server/actions/admin";
import { idleFormState } from "@/server/validation";

const roleOptions = [
  { value: "COMM_MANAGER", label: "Communications & media" },
  { value: "AGID_ADMIN", label: "GLANCE team (full network administrator)" },
];

export function CreateStaffForm() {
  const [state, formAction] = useActionState(createStaffAccountAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

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
        label="Staff role"
        htmlFor="role"
        required
        error={state.errors?.role}
        hint="Communications runs events, media and website content. GLANCE team runs the entire portal."
      >
        <Select id="role" name="role" options={roleOptions} defaultValue="COMM_MANAGER" />
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
        label="Permission to create the account"
        htmlFor="consent"
        required
        error={state.errors?.consent}
      >
        <div className="flex items-start gap-3 text-[13.5px] leading-6 text-ink-600">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-line text-navy-900 focus:ring-navy-500"
          />
          <p>
            I confirm this person has agreed to GLANCE holding their name and
            email address to create this account.
          </p>
        </div>
      </Field>

      <SubmitButton pendingLabel="Creating staff account…">
        Create staff account
      </SubmitButton>

      <p className="text-[11.5px] text-ink-400">
        Share the password over a private channel and ask the new staff member to
        change it from Settings on first sign in. Chapter coordinators are
        created differently: send an activation code from the Invitations page.
      </p>
    </form>
  );
}
