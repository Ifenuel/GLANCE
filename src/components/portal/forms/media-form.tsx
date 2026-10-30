"use client";

import { useActionState, useRef, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { createMediaAction } from "@/server/actions/media";
import { idleFormState } from "@/server/validation";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-navy-900 placeholder:text-ink-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none";

/**
 * A gallery item can come from two places: a photo uploaded straight from the
 * device (phone gallery or laptop file picker) through the same signed
 * Cloudinary pipeline the avatars use, or a pasted link (image URL, or a
 * YouTube link when the item is a film). The upload fills the same hidden
 * `url` field, so the server action keeps one path for both.
 */
export function MediaForm() {
  const [state, formAction] = useActionState(createMediaAction, idleFormState);
  const [kind, setKind] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [busy, setBusy] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLocalError(null);

    if (!file.type.startsWith("image/")) {
      setLocalError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setLocalError("That image is over 4 MB. Please choose a smaller one.");
      return;
    }

    setBusy("Uploading photo…");
    setUploadedPreview(URL.createObjectURL(file));

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
        throw new Error("Cloudinary rejected that image. Please try another.");
      }
      const result = (await uploaded.json()) as { secure_url?: string };
      if (!result.secure_url) throw new Error("Upload finished without an image URL.");

      // The returned delivery URL feeds the form's own `url` field, so the
      // existing server action saves it exactly like a pasted https link.
      if (urlInput.current) urlInput.current.value = result.secure_url;
      setUploadedPreview(result.secure_url);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "The upload failed.");
      setUploadedPreview(null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* FormMessage already renders the action's confirmation — one message. */}
      <FormMessage state={state} />

      <Field label="Item type" htmlFor="kind" required>
        <select
          id="kind"
          name="kind"
          className={inputClass}
          value={kind}
          onChange={(event) => {
            const next = event.target.value === "VIDEO" ? "VIDEO" : "IMAGE";
            setKind(next);
            setLocalError(null);
            setUploadedPreview(null);
            if (urlInput.current) urlInput.current.value = "";
          }}
        >
          <option value="IMAGE">Photo</option>
          <option value="VIDEO">Video (YouTube)</option>
        </select>
      </Field>

      <Field label="Title" htmlFor="media-title" required error={state.errors?.title}>
        <input
          id="media-title"
          name="title"
          placeholder="Leading at 27, campus activation"
          className={inputClass}
          required
        />
      </Field>

      {kind === "IMAGE" ? (
        <>
          <Field
            label="Photo"
            htmlFor="media-file"
            required
            hint="Pick an image from this device — phone gallery or computer. Links still work too."
            error={localError && !uploadedPreview ? localError : state.errors?.url}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={busy !== null}
                  className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:border-navy-200 hover:bg-navy-50 disabled:opacity-60"
                >
                  {uploadedPreview && !busy ? "Choose another photo" : "Upload from device"}
                </button>
                {busy ? (
                  <span className="text-[12px] font-semibold text-navy-700">{busy}</span>
                ) : uploadedPreview ? (
                  <span className="text-[12px] font-semibold text-emerald-700">
                    Photo ready
                  </span>
                ) : null}
              </div>
              <input
                ref={fileInput}
                id="media-file"
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.target.value = "";
                }}
              />
              {uploadedPreview ? (
                <div className="h-24 w-32 overflow-hidden rounded-lg border border-line bg-navy-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedPreview}
                    alt="Preview of the selected photo"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </Field>

          <Field
            label="Or paste an image link"
            htmlFor="media-url"
            hint="Only needed when you skip the upload."
          >
            <input
              ref={urlInput}
              id="media-url"
              name="url"
              placeholder="https://res.cloudinary.com/…"
              className={inputClass}
            />
          </Field>
        </>
      ) : (
        <Field
          label="Link"
          htmlFor="media-url"
          required
          hint="A YouTube link — the film plays inside the page."
          error={state.errors?.url}
        >
          <input
            ref={urlInput}
            id="media-url"
            name="url"
            placeholder="https://www.youtube.com/watch?v=…"
            className={inputClass}
            required
          />
        </Field>
      )}

      <Field label="Caption" htmlFor="media-caption" error={state.errors?.caption}>
        <textarea
          id="media-caption"
          name="caption"
          rows={3}
          placeholder="A short line shown under the item."
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
        Publish to the public gallery immediately
      </label>

      <SubmitButton
        pendingLabel={busy ?? "Saving…"}
        className="w-full"
      >
        Add to gallery
      </SubmitButton>
    </form>
  );
}
