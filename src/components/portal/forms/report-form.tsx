"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { submitActivityReportAction } from "@/server/actions/chapter";
import { idleFormState } from "@/server/validation";

export function ReportForm({ chapter }: { chapter: { id: string; name: string; code: string } }) {
  const [state, formAction] = useActionState(submitActivityReportAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="chapterId" value={chapter.id} />
      <FormMessage state={state} />
      {state.message ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">{state.message}</p>
      ) : null}


      <Field
        label="Report title"
        htmlFor="title"
        required
        error={state.errors?.title}
      >
        <input
          id="title"
          name="title"
          required
          maxLength={160}
          placeholder="e.g. Term 1 activity roundup"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Activity date"
        htmlFor="activityDate"
        required
        error={state.errors?.activityDate}
      >
        <input
          id="activityDate"
          name="activityDate"
          type="date"
          required
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Summary of activity"
        htmlFor="summary"
        required
        error={state.errors?.summary}
      >
        <textarea
          id="summary"
          name="summary"
          rows={5}
          required
          maxLength={4000}
          placeholder="What the chapter did, who participated, and the outcome."
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Attendee count"
        htmlFor="attendeeCount"
        hint="Total number of members or participants."
      >
        <input
          id="attendeeCount"
          name="attendeeCount"
          type="number"
          min={0}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <SubmitButton pendingLabel="Submitting report…">
        Submit activity report
      </SubmitButton>
    </form>
  );
}
