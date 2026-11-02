"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { saveSiteSectionsAction } from "@/server/actions/site-content";
import { idleFormState } from "@/server/validation";

/**
 * Edits the public site sections that are not records: the intro copy and the
 * header photograph of the events and news pages. Photos upload straight from
 * the device through the clipboard-checked Cloudinary pipeline (the same
 * gallery-media scope the gallery form uses); only a verified https delivery
 * URL is ever stored, and the server action rejects anything else. Clearing a
 * field restores that section's built-in default.
 */

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-navy-900 placeholder:text-ink-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

/** One device-image upload bound to a hidden field in the same form. */
function SectionImageUpload({
  name,
  initialUrl,
  label,
}: {
  name: string;
  initialUrl: string;
  label: string;
}) {
  const [value, setValue] = useState(initialUrl);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initialUrl), [initialUrl]);

  async function upload(file: File) {
    setError(null);
    setSuccess(null);

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("That image is over 4 MB. Please choose a smaller one.");
      return;
    }

    setBusy(true);
    try {
      const sign = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "gallery-media" }),
      });
      if (!sign.ok) {
        const body = (await sign.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not start the upload.");
      }
      const sig = (await sign.json()) as {
        uploadUrl: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        publicId: string;
        signature: string;
      };

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sig.apiKey);
      body.append("timestamp", String(sig.timestamp));
      body.append("folder", sig.folder);
      body.append("public_id", sig.publicId);
      body.append("signature", sig.signature);

      const uploaded = await fetch(sig.uploadUrl, { method: "POST", body });
      if (!uploaded.ok) {
        throw new Error("The image host rejected that file. Please try another image.");
      }
      const result = (await uploaded.json()) as { public_id?: string; secure_url?: string };
      if (!result.public_id || !result.secure_url) {
        throw new Error("The upload finished without an image address.");
      }

      // The uploaded file is enough for these sections — the delivery URL is
      // derived from the verified public ID, never crafted by hand.
      const delivery = result.secure_url;
      setValue(delivery);
      setSuccess("Image ready — it goes live when you save.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} readOnly />
      <Field label={label} htmlFor={name} error={error ?? undefined}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-navy-950 px-4 text-[12px] font-bold text-white transition-colors hover:bg-navy-900">
              {busy ? "Uploading…" : value ? "Pick a different image" : "Upload from device"}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.target.value = "";
                }}
              />
            </label>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setSuccess(null);
                  setError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="h-10 rounded-lg border border-line px-3 text-[12px] font-bold text-ink-500 hover:bg-navy-50"
              >
                Use the built-in image
              </button>
            ) : null}
            {success && !busy ? (
              <span className="text-[12px] font-semibold text-emerald-700">{success}</span>
            ) : null}
          </div>
          {value ? (
            <div className="relative aspect-video w-full max-w-[320px] overflow-hidden rounded-lg border border-line bg-navy-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ) : (
            <p className="text-[11px] text-ink-400">
              Empty — the section keeps its built-in photograph.
            </p>
          )}
        </div>
      </Field>
    </div>
  );
}

export function SiteSectionsForm({
  initial,
}: {
  initial: {
    eventsIntro: string;
    eventsBackground: string;
    newsIntro: string;
  };
}) {
  const [state, formAction] = useActionState(saveSiteSectionsAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <hr className="border-line" />
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
        Events page
      </p>
      <Field
        label="Intro paragraph"
        htmlFor="events-intro"
        hint="Shown at the top of the public events page."
        error={state.errors?.eventsIntro}
      >
        <textarea
          id="events-intro"
          name="eventsIntro"
          rows={3}
          defaultValue={initial.eventsIntro}
          placeholder="Leave empty to use the built-in copy."
          className={inputClass}
        />
      </Field>
      <SectionImageUpload
        name="eventsBackground"
        initialUrl={initial.eventsBackground}
        label="Header photograph"
      />

      <hr className="border-line" />
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
        News page
      </p>
      <Field
        label="Intro paragraph"
        htmlFor="news-intro"
        hint="Shown at the top of the public news page."
        error={state.errors?.newsIntro}
      >
        <textarea
          id="news-intro"
          name="newsIntro"
          rows={3}
          defaultValue={initial.newsIntro}
          placeholder="Leave empty to use the built-in copy."
          className={inputClass}
        />
      </Field>

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save sections
      </SubmitButton>
    </form>
  );
}
