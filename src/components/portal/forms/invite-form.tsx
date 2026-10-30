"use client";

import { useActionState } from "react";
import { Field, FormMessage, Select, SubmitButton } from "@/components/forms/form-parts";
import { issueInvitationAction } from "@/server/actions/admin";
import { idleFormState } from "@/server/validation";

const roleOptions = [
  { value: "CHAPTER_ADMIN", label: "Chapter coordinator" },
  { value: "MEMBER", label: "Member" },
];

export function InviteForm({
  chapters = [],
}: {
  chapters?: { id: string; name: string; code: string }[];
}) {
  const [state, formAction] = useActionState(issueInvitationAction, idleFormState);

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
          placeholder="colleague@institution.edu.ng"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Choose a role"
        htmlFor="role"
        required
        error={state.errors?.role}
      >
        <Select
          id="role"
          name="role"
          options={roleOptions}
          defaultValue=""
        />
      </Field>

      {chapters.length > 0 ? (
        <Field
          label="Assign to chapter"
          htmlFor="chapterId"
          hint="GLANCE administrators may assign the invitation to any activated chapter."
          error={state.errors?.chapterId}
        >
          <select
            id="chapterId"
            name="chapterId"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          >
            <option value="">Select a chapter…</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name} ({chapter.code})
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <SubmitButton pendingLabel="Issuing invite…">
        Issue invite
      </SubmitButton>
    </form>
  );
}
