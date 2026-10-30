"use client";

import { useActionState } from "react";
import { Field, FormMessage, TextArea, SubmitButton } from "@/components/forms/form-parts";
import { reviewChapterApplicationAction } from "@/server/actions/admin";
import { idleFormState } from "@/server/validation";

export function ChapterApplicationReviewForm({
  application,
  role,
}: {
  application: {
    id: string;
    institution: string;
    proposedName: string;
    city: string;
    state: string;
    contactName: string;
    contactEmail: string;
    motivation: string;
    status: string;
  };
  role: string;
}) {
  const [state, formAction] = useActionState(reviewChapterApplicationAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={application.id} />
      <FormMessage state={state} />
      {state.message ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">{state.message}</p>
      ) : null}
      {state.success ? (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700"
        >
          {state.success}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Proposed chapter name"
          htmlFor="proposedName"
          required
          error={state.errors?.proposedName}
        >
          <input
            id="proposedName"
            name="proposedName"
            required
            defaultValue={application.proposedName}
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
            defaultValue={application.institution}
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
            defaultValue={application.city}
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
            defaultValue={application.state}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
        <Field
          label="Contact name"
          htmlFor="contactName"
          required
          error={state.errors?.contactName}
        >
          <input
            id="contactName"
            name="contactName"
            required
            defaultValue={application.contactName}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <Field
        label="Contact email"
        htmlFor="contactEmail"
        required
        error={state.errors?.contactEmail}
      >
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          required
          defaultValue={application.contactEmail}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Motivation"
        htmlFor="motivation"
        required
        error={state.errors?.motivation}
      >
        <textarea
          id="motivation"
          name="motivation"
          rows={3}
          required
          defaultValue={application.motivation}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Review notes"
        htmlFor="reviewNotes"
        error={state.errors?.reviewNotes}
      >
        <TextArea
          id="reviewNotes"
          name="reviewNotes"
          rows={4}
          placeholder="Notes recorded for this decision."
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <SubmitButton
          pendingLabel="Approving…"
          type="submit"
        >
          Approve
        </SubmitButton>
        <SubmitButton
          pendingLabel="Rejecting…"
          type="submit"
          actionName="reject"
        >
          Reject
        </SubmitButton>
      </div>

      <p className="text-[11.5px] text-ink-400">
        {role === "AGID_ADMIN"
          ? "The GLANCE team approves or rejects chapter applications. Once approved, the chapter code is issued and can be used to join."
          : "For chapter coordinators this form shows the application received for your chapter."}
      </p>
    </form>
  );
}
