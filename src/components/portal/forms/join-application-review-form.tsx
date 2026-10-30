"use client";

import { useActionState } from "react";
import { Field, FormMessage, TextArea, SubmitButton } from "@/components/forms/form-parts";
import { reviewJoinApplicationAction } from "@/server/actions/admin";
import { idleFormState } from "@/server/validation";

/**
 * Approve / reject controls for one membership application.
 *
 * Each decision button carries its intent through its own `name`, so the
 * server action knows which path to take from a single submission. Failures
 * (an inactive chapter, a stale application) come back as readable state
 * instead of an error page.
 */
export function JoinApplicationReviewForm({
  application,
}: {
  application: {
    id: string;
    status: string;
    chapterCode: string | null;
  };
}) {
  const [state, formAction] = useActionState(reviewJoinApplicationAction, idleFormState);
  const decided = application.status !== "PENDING";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="applicationId" value={application.id} />
      <FormMessage state={state} />

      {state.success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800"
        >
          {state.success}
        </div>
      ) : null}

      {decided ? (
        <p className="rounded-xl border border-line bg-navy-50/60 px-4 py-3 text-[13px] text-ink-500">
          This application has already been decided. Create a fresh invitation
          from the Invitations page if the applicant needs a new code.
        </p>
      ) : (
        <>
          <Field
            label="Review notes"
            htmlFor="reviewNotes"
            hint="Recorded with the decision in the audit trail. Not shown to the applicant."
          >
            <TextArea
              id="reviewNotes"
              name="reviewNotes"
              rows={3}
              placeholder="Why this application was approved or rejected."
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingLabel="Approving…" name="decision" value="APPROVED">
              Approve &amp; issue invitation
            </SubmitButton>
            <button
              type="submit"
              name="decision"
              value="REJECTED"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-6 text-[13px] font-bold text-navy-900 transition-colors hover:border-navy-300 hover:bg-navy-50"
            >
              Reject
            </button>
          </div>

          <p className="text-[11.5px] leading-5 text-ink-400">
            {application.chapterCode
              ? `Approval issues a member invitation for chapter ${application.chapterCode.trim().toUpperCase()} and emails the applicant their activation code.`
              : "This application has no chapter code, so it cannot be approved. Reject it and ask the applicant to name their chapter."}
          </p>
        </>
      )}
    </form>
  );
}
