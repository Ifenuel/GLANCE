"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { savePageContentAction } from "@/server/actions/site-content";
import { idleFormState } from "@/server/validation";
import type { EditablePage } from "@/lib/site-pages";

/**
 * The page-copy editor: pick a public page, edit its fields, save. Values
 * live in the SiteContent store (`page.<key>.<field>`); a cleared field
 * restores that line's built-in copy, so the site never loses its design —
 * it only shows what the secretariat has deliberately overridden.
 */

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-navy-900 placeholder:text-ink-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

export function PageContentForm({
  pages,
  initial,
}: {
  pages: EditablePage[];
  initial: Record<string, Record<string, string>>;
}) {
  const [selected, setSelected] = useState(pages[0]?.key ?? "");
  const [state, formAction] = useActionState(savePageContentAction, idleFormState);

  const page = pages.find((entry) => entry.key === selected) ?? pages[0];
  if (!page) return null;
  const values = initial[page.key] ?? {};
  const storedCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <Field label="Page" htmlFor="page-picker">
            <select
              id="page-picker"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className={inputClass}
            >
              {pages.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <a
          href={page.path}
          target="_blank"
          rel="noreferrer"
          className="mb-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-[12px] font-bold text-navy-900 hover:bg-navy-50"
        >
          View page ↗
        </a>
      </div>

      <p className="text-[11.5px] leading-[1.7] text-ink-400">
        {storedCount > 0
          ? `${storedCount} field${storedCount === 1 ? "" : "s"} on this page currently override the built-in copy.`
          : "This page still shows its built-in copy everywhere — nothing overridden yet."}{" "}
        Clear a field to bring its built-in wording back.
      </p>

      {/* Remount on page change so each field re-seeds from stored values. */}
      <form action={formAction} key={page.key} className="space-y-4">
        <FormMessage state={state} />
        <input type="hidden" name="page" value={page.key} readOnly />

        {page.fields.map((field) => (
          <Field
            key={field.name}
            label={field.label}
            htmlFor={`f-${field.name}`}
            hint={field.hint}
            error={state.errors?.[`f.${field.name}`]}
          >
            {field.multiline ? (
              <textarea
                id={`f-${field.name}`}
                name={`f.${field.name}`}
                rows={4}
                defaultValue={values[field.name] ?? ""}
                placeholder="Leave empty to use the built-in copy."
                className={inputClass}
              />
            ) : (
              <input
                id={`f-${field.name}`}
                name={`f.${field.name}`}
                type="text"
                defaultValue={values[field.name] ?? ""}
                placeholder="Leave empty to use the built-in copy."
                className={inputClass}
              />
            )}
          </Field>
        ))}

        <SubmitButton pendingLabel="Saving…" className="w-full">
          Save {page.label}
        </SubmitButton>
      </form>
    </div>
  );
}
