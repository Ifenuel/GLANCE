"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, Select, SubmitButton } from "@/components/forms/form-parts";
import { registerChapterMemberAction } from "@/server/actions/chapter";
import { idleFormState } from "@/server/validation";

const categoryOptions = [
  { value: "STUDENT", label: "Student" },
  { value: "NON_STUDENT", label: "Non-student participant" },
  { value: "ALUMNI", label: "Alumni" },
];

const academicOptions = [
  { value: "YEAR_1", label: "Year 1" },
  { value: "YEAR_2", label: "Year 2" },
  { value: "YEAR_3", label: "Year 3" },
  { value: "YEAR_4", label: "Year 4" },
  { value: "YEAR_5", label: "Year 5" },
  { value: "ND", label: "National Diploma (ND)" },
  { value: "HND", label: "Higher National Diploma (HND)" },
  { value: "PGD", label: "Postgraduate Diploma" },
  { value: "MASTERS", label: "Master's degree" },
  { value: "DOCTORATE", label: "Doctorate" },
  { value: "OTHER", label: "Other" },
];

const genderOptions = [
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
];

export function RegisterMemberForm() {
  const [state, formAction] = useActionState(registerChapterMemberAction, idleFormState);
  const [category, setCategory] = useState("STUDENT");

  const isStudent = category === "STUDENT";
  const isNonStudent = category === "NON_STUDENT";
  const isAlumni = category === "ALUMNI";

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      {state.error ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">
          {state.error}
        </p>
      ) : null}

      <p className="text-[12.5px] text-ink-500">
        Your member record is private by default. Only GLANCE and
        authorised chapter coordinators can view it, and only for legitimate
        chapter administration.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full name"
          htmlFor="fullName"
          required
          error={state.errors?.fullName}
        >
          <input
            id="fullName"
            name="fullName"
            required
            autoComplete="name"
            placeholder="Jumoke Oduwole"
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
            placeholder="you@institution.edu.ng"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Phone number"
          htmlFor="phone"
          required
          error={state.errors?.phone}
        >
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            inputMode="tel"
            placeholder="080 1234 5678"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
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
            placeholder="e.g. University of Ibadan"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Membership category"
          htmlFor="membershipCategory"
          required
          error={state.errors?.membershipCategory}
        >
          <Select
            id="membershipCategory"
            name="membershipCategory"
            options={categoryOptions}
            defaultValue="STUDENT"
            onChange={setCategory}
          />
        </Field>
        <Field
          label="Chapter code"
          htmlFor="chapterCode"
          hint="Optional | the chapter you belong to. GLANCE assigns your official record."
          error={state.errors?.chapterCode}
        >
          <input
            id="chapterCode"
            name="chapterCode"
            maxLength={40}
            placeholder="e.g. GLN-UI-001"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Department or field"
          htmlFor="department"
          hint={
            isStudent
              ? "For example: Political Science"
              : isAlumni
                ? "Optional: your former department or professional field"
                : isNonStudent
                  ? "Optional: your professional or community field"
                  : "Optional: shown only to GLANCE and your chapter's coordinators"
          }
          error={state.errors?.department}
        >
          <input
            id="department"
            name="department"
            placeholder={isStudent ? "Department" : "Optional"}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Academic level"
          htmlFor="academicLevel"
          hint={
            isStudent
              ? "Required while you are a current student"
              : isAlumni
                ? "Not applicable to alumni"
                : "Not applicable to non-student participants"
          }
          error={state.errors?.academicLevel}
        >
        <Select
          id="academicLevel"
          name="academicLevel"
          options={academicOptions}
          defaultValue={isStudent ? "YEAR_1" : ""}
          disabled={!isStudent}
        />
        </Field>
        <Field
          label="Gender"
          htmlFor="gender"
          hint="You may decline disclosure. Administrators use this for reporting only."
          error={state.errors?.gender}
        >
        <Select
          id="gender"
          name="gender"
          options={genderOptions}
          defaultValue="PREFER_NOT_TO_SAY"
        />
        </Field>
      </div>

      <Field
        label="Your position or role in the chapter"
        htmlFor="position"
        hint="Filled by administrators only. You cannot assign yourself an official position."
        error={state.errors?.position}
      >
        <input
          id="position"
          name="position"
          placeholder="e.g. Chapter Secretary | not editable here"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Why do you want to join GLANCE?"
        htmlFor="motivation"
        required
        error={state.errors?.motivation}
        hint="Tell us what you want to contribute and where you want to serve."
      >
        <textarea
          id="motivation"
          name="motivation"
          rows={5}
          required
          maxLength={2000}
          placeholder="I want to build character, lead in my community and give back…"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Consent to data processing"
        htmlFor="consent"
        required
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
            I consent to GLANCE storing and processing the personal
            information in this record for membership administration. I
            understand that GLANCE and my chapter's coordinators can see my
            record, that my
            details are not published publicly, and that I can request
            correction or deletion at any time.
          </p>
        </div>
      </Field>

      {state.errors?.consent ? (
        <p role="alert" className="text-[12px] font-semibold text-rose-600">
          {state.errors.consent[0]}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Saving your record…">
        Create my account
      </SubmitButton>
    </form>
  );
}
