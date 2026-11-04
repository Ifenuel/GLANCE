"use client";

import { useActionState } from "react";
import { submitRsvpAction } from "@/server/actions/rsvp";
import { idleFormState } from "@/server/validation";

/**
 * Inline reservation on an event card.
 *
 * It expands in place so the visitor never leaves the events page: name, email,
 * optional phone, optional guests. The server re-checks that the event is still
 * published and still ahead, so the form is a convenience, never the gate.
 */
export function RsvpForm({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [state, formAction, pending] = useActionState(submitRsvpAction, idleFormState);
  const errors = state.errors ?? {};

  if (state.status === "success") {
    return (
      <p
        role="status"
        className="mt-auto rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-800"
      >
        {state.success ?? "Your place is reserved."}
      </p>
    );
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-navy-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none";

  return (
    <details className="group mt-auto pt-4">
      <summary className="cursor-pointer list-none text-[12.5px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4 marker:content-none [&::-webkit-details-marker]:hidden">
        Reserve a place
      </summary>

      <form action={formAction} className="mt-4 space-y-2.5">
        <input type="hidden" name="eventId" value={eventId} />
        <p className="sr-only">
          Reserve a place at {eventTitle}. Your name is required, plus an email
          address for the confirmation.
        </p>

        <div>
          <label htmlFor={`rsvp-name-${eventId}`} className="sr-only">
            Full name
          </label>
          <input
            id={`rsvp-name-${eventId}`}
            name="name"
            required
            autoComplete="name"
            placeholder="Full name"
            aria-invalid={errors.name ? true : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`rsvp-email-${eventId}`} className="sr-only">
            Email address
          </label>
          <input
            id={`rsvp-email-${eventId}`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email address"
            aria-invalid={errors.email ? true : undefined}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`rsvp-phone-${eventId}`} className="sr-only">
              Phone number (optional)
            </label>
            <input
              id={`rsvp-phone-${eventId}`}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Phone (optional)"
              className={inputClass}
            />
          </div>
          <div className="w-[104px] shrink-0">
            <label htmlFor={`rsvp-guests-${eventId}`} className="sr-only">
              Guests you are bringing
            </label>
            <select
              id={`rsvp-guests-${eventId}`}
              name="guests"
              defaultValue="0"
              className={inputClass}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Just me" : `+${n} guest${n > 1 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-navy-900 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Reserving…" : "Confirm my place"}
        </button>

        {state.status === "error" && state.error ? (
          <p role="alert" className="text-[12px] font-semibold text-rose-600">
            {state.error}
          </p>
        ) : null}
        <p className="text-[11px] leading-[1.6] text-ink-400">
          Your details go only to the chapter hosting this event.
        </p>
      </form>
    </details>
  );
}
