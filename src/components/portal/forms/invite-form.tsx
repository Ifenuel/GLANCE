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
  chapterAdmin = false,
}: {
  chapters?: { id: string; name: string; code: string }[];
  chapterAdmin?: boolean;
}) {
  const [state, formAction] = useActionState(issueInvitationAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      {/* FormMessage is the single place a result is announced; repeating the
          success line here printed "Invitation sent to …" twice. */}
      <FormMessage state={state} />

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
        hint={
          chapterAdmin
            ? "Members only — staff accounts are created by the GLANCE team."
            : undefined
        }
        error={state.errors?.role}
      >
        <Select
          id="role"
          name="role"
          options={
            chapterAdmin
              ? roleOptions.filter((option) => option.value === "MEMBER")
              : roleOptions
          }
          defaultValue={chapterAdmin ? "MEMBER" : ""}
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

      <Field
        label="Permission to share details"
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
            I confirm I have this person&apos;s permission to share their name
            and email address with GLANCE for this invitation.
          </p>
        </div>
      </Field>

      <SubmitButton pendingLabel="Issuing invite…">
        Issue invite
      </SubmitButton>
    </form>
  );
}
