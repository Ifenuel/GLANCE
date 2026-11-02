"use client";

import { useActionState } from "react";
import {
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/forms/form-parts";
import { submitContactMessageAction } from "@/server/actions/public";
import { idleFormState } from "@/server/validation";

const subjects = [
  { value: "Membership enquiry", label: "Membership enquiry" },
  { value: "Start a chapter", label: "Starting a chapter" },
  { value: "Partnership", label: "Partnership" },
  { value: "Speaking or media", label: "Speaking or media" },
  { value: "Leading at 27", label: "Leading at 27" },
  { value: "Other", label: "Other" },
];

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactMessageAction, idleFormState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required error={errors.name?.[0]}>
          <TextInput id="name" name="name" required autoComplete="name" />
        </Field>
        <Field label="Email address" htmlFor="email" required error={errors.email?.[0]}>
          <TextInput id="email" name="email" type="email" required autoComplete="email" />
        </Field>
      </div>

      <Field label="Subject" htmlFor="subject" required error={errors.subject?.[0]}>
        <Select
          id="subject"
          name="subject"
          options={subjects}
          required
          placeholder="Select a subject"
        />
      </Field>

      <Field label="Message" htmlFor="message" required error={errors.message?.[0]}>
        <TextArea id="message" name="message" rows={6} required maxLength={4000} />
      </Field>

      <Field
        label="Consent to data processing"
        htmlFor="consent"
        required
        error={errors.consent?.[0]}
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
            I consent to GLANCE storing and processing the details I have
            provided so the secretariat can respond to my message, as described
            in the Privacy Policy.
          </p>
        </div>
      </Field>

      <SubmitButton pendingLabel="Sending…">Send message</SubmitButton>
    </form>
  );
}
