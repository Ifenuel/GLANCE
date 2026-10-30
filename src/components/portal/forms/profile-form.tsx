"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { updateOwnProfileAction } from "@/server/actions/member";
import { idleFormState } from "@/server/validation";

export function ProfileForm({
  user,
  profile,
}: {
  user: { id: string; email: string; name: string; phone: string | null };
  profile: { id: string; institution: string; department: string | null; academicLevel: string | null; gender: string; position: string | null; membershipCategory: string; avatarUrl: string | null; registeredAt: string };
}) {
  const [state, formAction] = useActionState(updateOwnProfileAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={profile.id} />
      <FormMessage state={state} />
      {state.error ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">
          {state.error}
        </p>
      ) : null}


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
            required
            defaultValue={user.name}
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
            required
            defaultValue={user.email}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <Field
        label="Phone number"
        htmlFor="phone"
        error={state.errors?.phone}
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={user.phone ?? ""}
          placeholder="080 1234 5678"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Institution or community"
          htmlFor="institution"
          required
          error={state.errors?.institution}
        >
          <input
            id="institution"
            name="institution"
            required
            defaultValue={profile.institution}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Membership category"
          htmlFor="membershipCategory"
          required
          error={state.errors?.membershipCategory}
        >
          <select
            id="membershipCategory"
            name="membershipCategory"
            defaultValue={profile.membershipCategory}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          >
            <option value="STUDENT">Student</option>
            <option value="NON_STUDENT">Non-student participant</option>
            <option value="ALUMNI">Alumni</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Department or field"
          htmlFor="department"
          error={state.errors?.department}
        >
          <input
            id="department"
            name="department"
            defaultValue={profile.department ?? ""}
            placeholder="Optional | for students"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Academic level"
          htmlFor="academicLevel"
          error={state.errors?.academicLevel}
        >
          <select
            id="academicLevel"
            name="academicLevel"
            defaultValue={profile.academicLevel ?? ""}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          >
            <option value="">Not applicable</option>
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
      </div>

      <Field
        label="Gender"
        htmlFor="gender"
        error={state.errors?.gender}
      >
        <select
          id="gender"
          name="gender"
          defaultValue={profile.gender}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        >
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="OTHER">Other</option>
        </select>
      </Field>

      <Field
        label="Chapter position or role"
        htmlFor="position"
        hint="Set by your chapter's coordinators. You cannot assign yourself an official position."
        error={state.errors?.position}
      >
        <input
          id="position"
          name="position"
          defaultValue={profile.position ?? ""}
          placeholder="Set by an administrator"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <div className="flex gap-3">
        <SubmitButton pendingLabel="Saving profile…">
          Save profile
        </SubmitButton>
        <a
          href="/portal/profile"
          className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink-600 hover:bg-lineHover"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
