"use client";

import { useActionState } from "react";
import { Field, FormMessage, Select, SubmitButton } from "@/components/forms/form-parts";
import { updateOwnProfileAction } from "@/server/actions/member";
import { idleFormState } from "@/server/validation";

const categoryOptions = [
  { value: "STUDENT", label: "Student" },
  { value: "NON_STUDENT", label: "Non-student participant" },
  { value: "ALUMNI", label: "Alumni" },
];

const levelOptions = [
  { value: "", label: "Not set" },
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

export function MemberEditForm({
  member,
  chapter,
}: {
  member: {
    id: string;
    fullName: string;
    email: string;
    institution: string;
    chapterId: string;
    chapterCode: string;
    department: string | null;
    academicLevel: string | null;
    gender: string;
    position: string | null;
    isExecutive: boolean;
    membershipCategory: string;
    status: string;
    registeredAt: string;
  };
  chapter: { id: string; code: string; name: string };
}) {
  const [state, formAction] = useActionState(updateOwnProfileAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={member.id} />
      <input type="hidden" name="chapterId" value={chapter.id} />
      <FormMessage state={state} />
      {state.error ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">
          {state.error}
        </p>
      ) : null}


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
            defaultValue={member.fullName}
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
            defaultValue={member.email}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

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
            defaultValue={member.institution}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Chapter"
          htmlFor="chapterId"
          required
          error={state.errors?.chapterId}
        >
          <select
            id="chapterId"
            name="chapterId"
            defaultValue={member.chapterId}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          >
            <option value={chapter.id}>{chapter.name} | {chapter.code}</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Department or field"
          htmlFor="department"
          hint="Not applicable for non-students or alumni."
          error={state.errors?.department}
        >
          <input
            id="department"
            name="department"
            defaultValue={member.department ?? ""}
            placeholder="Optional"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Academic level"
          htmlFor="academicLevel"
          hint="Conditional on being a student."
          error={state.errors?.academicLevel}
        >
          <Select
            id="academicLevel"
            name="academicLevel"
            options={levelOptions}
            defaultValue={member.academicLevel ?? ""}
          />
        </Field>
      </div>

      <Field
        label="Gender"
        htmlFor="gender"
        hint="Privacy controlled. Administrators see this for reporting."
        error={state.errors?.gender}
      >
        <Select
          id="gender"
          name="gender"
          options={genderOptions}
          defaultValue={member.gender}
        />
      </Field>

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
          defaultValue={member.membershipCategory}
        />
      </Field>

      <Field
        label="Chapter position or role"
        htmlFor="position"
        hint="Set by GLANCE or your chapter's coordinators. You cannot assign an official position here."
        error={state.errors?.position}
      >
        <input
          id="position"
          name="position"
          defaultValue={member.position ?? ""}
          placeholder="Set by an administrator"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <div className="flex gap-3">
        <SubmitButton pendingLabel="Saving record…">
          Save member record
        </SubmitButton>
        <a
          href={`/portal/members/${member.id}`}
          className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink-600 hover:bg-lineHover"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
