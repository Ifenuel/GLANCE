"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { createPostAction } from "@/server/actions/post";
import { idleFormState } from "@/server/validation";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-navy-900 placeholder:text-ink-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

export function PostForm() {
  const [state, formAction] = useActionState(createPostAction, idleFormState);

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

      <Field label="Type" htmlFor="post-category" required>
        <select id="post-category" name="category" className={inputClass} defaultValue="NEWS">
          <option value="NEWS">News</option>
          <option value="STORY">Impact story</option>
          <option value="ANNOUNCEMENT">Announcement</option>
        </select>
      </Field>

      <Field label="Title" htmlFor="post-title" required error={state.errors?.title}>
        <input
          id="post-title"
          name="title"
          placeholder="New chapter launched at your campus"
          className={inputClass}
          required
        />
      </Field>

      <Field label="Summary" htmlFor="post-excerpt" required error={state.errors?.excerpt}
        hint="One or two sentences shown in the news list.">
        <input
          id="post-excerpt"
          name="excerpt"
          className={inputClass}
          required
        />
      </Field>

      <Field label="Story" htmlFor="post-body" required error={state.errors?.body}
        hint="Readable text and paragraphs; it opens as a full page on the website.">
        <textarea id="post-body" name="body" rows={8} className={inputClass} required />
      </Field>

      <Field label="Cover image" htmlFor="post-cover"
        hint="Optional. An https image link for the story card.">
        <input
          id="post-cover"
          name="coverImageUrl"
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2.5 text-[12.5px] font-semibold text-ink-600">
        <input
          type="checkbox"
          name="published"
          defaultChecked
          className="h-4 w-4 rounded border-line text-navy-900 focus:ring-navy-500"
        />
        Publish to the public website immediately
      </label>

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Publish story
      </SubmitButton>
    </form>
  );
}
