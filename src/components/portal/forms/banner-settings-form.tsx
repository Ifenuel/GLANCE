"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { saveBannerSettingsAction } from "@/server/actions/site-content";
import { idleFormState } from "@/server/validation";

/**
 * Countdown-banner controls for the ribbon at the top of every public page:
 * show/hide it, and choose which upcoming event it advertises. Events
 * themselves are written under Portal → Events; this card only points the
 * ribbon at one (or leaves it on automatic — the soonest published event).
 */

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-navy-900 placeholder:text-ink-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

export function BannerSettingsForm({
  settings,
  events,
}: {
  settings: { enabled: boolean; eventId: string };
  events: Array<{ id: string; title: string; startsAt: string }>;
}) {
  const [state, formAction] = useActionState(saveBannerSettingsAction, idleFormState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <label className="flex items-start gap-3 rounded-lg border border-line bg-navy-50/40 px-4 py-3.5">
        <input
          type="checkbox"
          name="show"
          defaultChecked={settings.enabled}
          className="mt-0.5 h-4 w-4 rounded border-line text-navy-900 focus:ring-navy-500"
        />
        <span>
          <span className="block text-[13.5px] font-bold text-navy-900">
            Show the countdown banner
          </span>
          <span className="mt-0.5 block text-[11.5px] text-ink-500">
            The ribbon at the very top of every public page. Uncheck to hide it
            site-wide.
          </span>
        </span>
      </label>

      <Field
        label="Featured event"
        htmlFor="banner-event"
        hint="Automatic advertises the soonest upcoming published event. Create and publish events under Portal → Events."
        error={state.errors?.eventId}
      >
        <select
          id="banner-event"
          name="eventId"
          defaultValue={settings.eventId}
          className={inputClass}
        >
          <option value="">Automatic — next upcoming event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} —{" "}
              {new Date(event.startsAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
      </Field>

      {events.length === 0 ? (
        <p className="text-[11.5px] text-ink-400">
          No upcoming published events yet — the banner stays hidden until one
          exists.
        </p>
      ) : null}

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save banner settings
      </SubmitButton>
    </form>
  );
}
