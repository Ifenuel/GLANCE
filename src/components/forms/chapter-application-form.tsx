"use client";

import { useActionState } from "react";
import {
  Checkbox,
  Field,
  FormMessage,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/forms/form-parts";
import { submitChapterApplicationAction } from "@/server/actions/public";
import { idleFormState } from "@/server/validation";

export function ChapterApplicationForm() {
  const [state, formAction] = useActionState(submitChapterApplicationAction, idleFormState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Institution or community"
          htmlFor="institution"
          required
          error={errors.institution?.[0]}
        >
          <TextInput id="institution" name="institution" required />
        </Field>
        <Field
          label="Proposed chapter name"
          htmlFor="proposedName"
          required
          error={errors.proposedName?.[0]}
          hint="For example: GLANCE Club, University of Ibadan"
        >
          <TextInput id="proposedName" name="proposedName" required />
        </Field>
        <Field label="City" htmlFor="city" required error={errors.city?.[0]}>
          <TextInput id="city" name="city" required />
        </Field>
        <Field label="State" htmlFor="state" required error={errors.state?.[0]}>
          <TextInput id="state" name="state" required />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your full name" htmlFor="contactName" required error={errors.contactName?.[0]}>
          <TextInput id="contactName" name="contactName" required autoComplete="name" />
        </Field>
        <Field label="Your role" htmlFor="contactRole" error={errors.contactRole?.[0]}>
          <TextInput
            id="contactRole"
            name="contactRole"
            placeholder="Student leader, lecturer, community organiser"
          />
        </Field>
        <Field label="Contact email" htmlFor="contactEmail" required error={errors.contactEmail?.[0]}>
          <TextInput id="contactEmail" name="contactEmail" type="email" required autoComplete="email" />
        </Field>
        <Field label="Phone number" htmlFor="contactPhone" required error={errors.contactPhone?.[0]}>
          <TextInput id="contactPhone" name="contactPhone" type="tel" required inputMode="tel" />
        </Field>
      </div>

      <Field
        label="Why should GLANCE be activated at this institution?"
        htmlFor="motivation"
        required
        error={errors.motivation?.[0]}
        hint="Describe the need on your campus, the interest you have gathered and who would lead the club."
      >
        <TextArea id="motivation" name="motivation" rows={7} required maxLength={3000} />
      </Field>

      <Checkbox
        id="consent"
        name="consent"
        required
        label="I confirm the information provided is accurate and consent to GLANCE contacting me about this application."
      />
      {errors.consent?.[0] ? (
        <p role="alert" className="text-[12px] font-semibold text-rose-600">
          {errors.consent[0]}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Submitting application…">
        Submit chapter application
      </SubmitButton>
    </form>
  );
}
