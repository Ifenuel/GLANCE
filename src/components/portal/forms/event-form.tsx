"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { createEventAction } from "@/server/actions/event";
import { idleFormState } from "@/server/validation";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-navy-900 placeholder:text-ink-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

export function EventForm() {
  const [state, formAction] = useActionState(createEventAction, idleFormState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      {state.success ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-700"
        >
          {state.success}
        </p>
      ) : null}

      <Field label="Event title" htmlFor="event-title" required error={state.errors?.title}>
        <input
          id="event-title"
          name="title"
          placeholder="Campus activation: Leading at 27"
          className={inputClass}
          required
        />
      </Field>

      <Field
        label="Description"
        htmlFor="event-description"
        required
        error={state.errors?.description}
      >
        <textarea
          id="event-description"
          name="description"
          rows={3}
          placeholder="What happens, who it is for, what to expect."
          className={inputClass}
          required
        />
      </Field>

      <Field label="Location" htmlFor="event-location" required error={state.errors?.location}>
        <input
          id="event-location"
          name="location"
          placeholder="Main Auditorium, University of Ibadan"
          className={inputClass}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" htmlFor="event-starts" required error={state.errors?.startsAt}>
          <input
            id="event-starts"
            name="startsAt"
            type="datetime-local"
            className={inputClass}
            required
          />
        </Field>
        <Field label="Ends (optional)" htmlFor="event-ends" error={state.errors?.endsAt}>
          <input
            id="event-ends"
            name="endsAt"
            type="datetime-local"
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Registration link (optional)"
        htmlFor="event-registration"
        hint="A full https:// URL where people can register."
        error={state.errors?.registrationUrl}
      >
        <input
          id="event-registration"
          name="registrationUrl"
          type="url"
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      <Field
        label="Teaser video (optional)"
        htmlFor="event-video"
        hint="A YouTube link. It plays inside the event card on the public page."
        error={state.errors?.videoUrl}
      >
        <input
          id="event-video"
          name="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2.5 text-[12.5px] font-semibold text-ink-600">
        <input
          type="checkbox"
          name="publish"
          defaultChecked
          className="h-4 w-4 rounded border-line text-navy-900 focus:ring-navy-500"
        />
        Publish to the public events page immediately
      </label>

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Create event
      </SubmitButton>
    </form>
  );
}
