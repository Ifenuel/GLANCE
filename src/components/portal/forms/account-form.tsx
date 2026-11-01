"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { updateAccountAction } from "@/server/actions/member";
import { idleFormState } from "@/server/validation";

/**
 * Name, email, phone, and, for staff accounts created by invitation, the
 * full completion set: gender, department, academic level and position.
 *
 * `required` switches the form into first-time completion mode: every field
 * is mandatory and the copy says why. The server enforces the same schema, so
 * the gate cannot be skipped by editing the DOM.
 */
export function AccountForm({
  user,
  required = false,
}: {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    gender?: string | null;
    department?: string | null;
    academicLevel?: string | null;
    position?: string | null;
  };
  /** True while this account has never completed its profile. */
  required?: boolean;
}) {
  const [state, formAction] = useActionState(updateAccountAction, idleFormState);

  const input =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      {state.success ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-700"
        >
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="account-name" required error={state.errors?.name}>
          <input
            id="account-name"
            name="name"
            required
            defaultValue={user.name}
            placeholder="e.g. Ada Obi"
            className={input}
          />
        </Field>
        <Field
          label="Email address"
          htmlFor="account-email"
          required
          hint="This is the address you sign in with."
          error={state.errors?.email}
        >
          <input
            id="account-email"
            name="email"
            type="email"
            required
            defaultValue={user.email}
            className={input}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Phone number"
          htmlFor="account-phone"
          required={required}
          error={state.errors?.phone}
        >
          <input
            id="account-phone"
            name="phone"
            type="tel"
            required={required}
            defaultValue={user.phone ?? ""}
            placeholder="080 1234 5678"
            className={input}
          />
        </Field>
        <Field label="Gender" htmlFor="account-gender" required={required} error={state.errors?.gender}>
          <select
            id="account-gender"
            name="gender"
            required={required}
            defaultValue={user.gender ?? "PREFER_NOT_TO_SAY"}
            className={input}
          >
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
      </div>

      {/* Shown at all times so an account can be corrected later; mandatory
          only during first-time completion. */}
      <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Department or field"
            htmlFor="account-department"
            required={required}
            error={state.errors?.department}
          >
            <input
              id="account-department"
              name="department"
              required={required}
              defaultValue={user.department ?? ""}
              placeholder="e.g. Political Science"
              className={input}
            />
          </Field>
          <Field
            label="Academic level"
            htmlFor="account-level"
            required={required}
            error={state.errors?.academicLevel}
          >
            <select
              id="account-level"
              name="academicLevel"
              required={required}
              defaultValue={user.academicLevel ?? ""}
              className={input}
            >
              <option value="" disabled>
                Select your level
              </option>
              <option value="YEAR_1">Year 1</option>
              <option value="YEAR_2">Year 2</option>
              <option value="YEAR_3">Year 3</option>
              <option value="YEAR_4">Year 4</option>
              <option value="YEAR_5">Year 5</option>
              <option value="ND">National Diploma (ND)</option>
              <option value="HND">Higher National Diploma (HND)</option>
              <option value="PGD">Postgraduate Diploma</option>
              <option value="MASTERS">Master&apos;s degree</option>
              <option value="DOCTORATE">Doctorate</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field
            label="Position"
            htmlFor="account-position"
            required={required}
            hint="Your role in GLANCE, for example coordinator or communications lead. Type “Not applicable” if none."
            error={state.errors?.position}
          >
            <input
              id="account-position"
              name="position"
              required={required}
              defaultValue={user.position ?? ""}
              placeholder="e.g. Chapter Administrator"
              className={input}
            />
          </Field>
      </div>

      <div className="flex gap-3">
        <SubmitButton pendingLabel="Saving…">
          {required ? "Complete my profile" : "Save account details"}
        </SubmitButton>
      </div>
    </form>
  );
}
