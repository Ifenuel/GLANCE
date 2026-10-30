"use client";

import { useActionState } from "react";
import { Field, FormMessage, Select, SubmitButton } from "@/components/forms/form-parts";
import { updateOwnChapterAction } from "@/server/actions/chapter";
import { idleFormState } from "@/server/validation";

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export function UpdateChapterForm({
  chapter,
}: {
  chapter: { id: string; status: string; name: string; institution: string; code: string; city: string; state: string; contactEmail: string | null; description: string | null; members: number; activatedAt: string | null };
}) {
  const [state, formAction] = useActionState(updateOwnChapterAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={chapter.id} />
      <FormMessage state={state} />
      {state.message ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">{state.message}</p>
      ) : null}


      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Chapter name"
          htmlFor="name"
          required
          error={state.errors?.name}
        >
          <input
            id="name"
            name="name"
            required
            defaultValue={chapter.name}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Institution"
          htmlFor="institution"
          required
          error={state.errors?.institution}
        >
          <input
            id="institution"
            name="institution"
            required
            defaultValue={chapter.institution}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="City"
          htmlFor="city"
          required
          error={state.errors?.city}
        >
          <input
            id="city"
            name="city"
            required
            defaultValue={chapter.city}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="State"
          htmlFor="state"
          required
          error={state.errors?.state}
        >
          <input
            id="state"
            name="state"
            required
            defaultValue={chapter.state}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Contact email"
          htmlFor="contactEmail"
          error={state.errors?.contactEmail}
        >
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={chapter.contactEmail ?? ""}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="description"
        hint="Chapter detail is editable by the chapter coordinator."
      >
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={chapter.description ?? ""}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Status"
        htmlFor="status"
        required
      >
        <Select id="status" name="status" options={statusOptions} defaultValue={chapter.status} />
      </Field>

      <div className="flex gap-3">
        <SubmitButton pendingLabel="Saving changes…">
          Save changes
        </SubmitButton>
        <a
          href={`/portal/chapters/${chapter.id}`}
          className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-ink-600 hover:bg-lineHover"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
