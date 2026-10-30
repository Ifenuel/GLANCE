"use client";

import { useActionState } from "react";
import { Field, FormMessage, Checkbox, SubmitButton } from "@/components/forms/form-parts";
import { createChapterAction } from "@/server/actions/admin";
import { idleFormState } from "@/server/validation";

const statusOptions: never[] = [];
void statusOptions;

export function ChapterForm() {
  const [state, formAction] = useActionState(createChapterAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      {state.error ? (
        <p role="alert" className="text-[12.5px] font-semibold text-rose-600">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700"
        >
          {state.success}
        </div>
      ) : null}

      <p className="rounded-xl bg-navy-50 px-4 py-3 text-[12.5px] leading-6 text-navy-700">
        The unique chapter code (e.g. GLN-UI-001) is issued automatically when
        the chapter is created and is shown on the chapter page.
      </p>

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
            placeholder="e.g. GLANCE Club, University of Ibadan"
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
            placeholder="e.g. University of Ibadan"
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
            placeholder="e.g. Ibadan"
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
            placeholder="e.g. Oyo State"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
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
            placeholder="chapter@example.ng"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
          />
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="description"
        hint="What the chapter does, its pillars and activity focus."
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="e.g. A campus club preparing students for responsible governance, leadership and civic engagement through the GLANCE Pathway."
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Checkbox
        id="activate"
        name="activate"
        label="Activate this chapter immediately (it can then appear in the directory and register members)."
      />

      <SubmitButton pendingLabel="Creating chapter…">
        Create chapter
      </SubmitButton>
    </form>
  );
}
