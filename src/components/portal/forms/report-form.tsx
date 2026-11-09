"use client";

import { useActionState, useRef, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-parts";
import { submitActivityReportAction } from "@/server/actions/chapter";
import { idleFormState } from "@/server/validation";

const MAX_REPORT_IMAGES = 3;
const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB per photo

type UploadedImage = { publicId: string; name: string };

export function ReportForm({ chapter }: { chapter: { id: string; name: string; code: string } }) {
  const [state, formAction] = useActionState(submitActivityReportAction, idleFormState);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageIds = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="chapterId" value={chapter.id} />
      <FormMessage state={state} />


      <Field
        label="Report title"
        htmlFor="title"
        required
        error={state.errors?.title}
      >
        <input
          id="title"
          name="title"
          required
          maxLength={160}
          placeholder="e.g. Term 1 activity roundup"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Activity date"
        htmlFor="activityDate"
        required
        error={state.errors?.activityDate}
      >
        <input
          id="activityDate"
          name="activityDate"
          type="date"
          required
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Summary of activity"
        htmlFor="summary"
        required
        error={state.errors?.summary}
      >
        <textarea
          id="summary"
          name="summary"
          rows={5}
          required
          maxLength={4000}
          placeholder="What the chapter did, who participated, and the outcome."
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      <Field
        label="Attendee count"
        htmlFor="attendeeCount"
        hint="Total number of members or participants."
      >
        <input
          id="attendeeCount"
          name="attendeeCount"
          type="number"
          min={0}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        />
      </Field>

      {/* Up to three photos from the chapter's own device, each kept under
          1 MB; they upload straight to GLANCE media storage and travel with
          the report the secretariat reads. */}
      <div>
        <p className="text-[12.5px] font-bold text-navy-900">
          Photos{" "}
          <span className="font-normal text-ink-400">(optional, up to {MAX_REPORT_IMAGES})</span>
        </p>
        <p className="mt-1 text-[12px] text-ink-500">
          Each photo at most 1 MB. They appear beside the report the GLANCE team reads.
        </p>
        <input ref={imageIds} type="hidden" name="imagePublicIds" readOnly />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {images.map((img, index) => (
            <span
              key={img.publicId}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-navy-50 px-3 py-1 text-[12px] font-semibold text-navy-800"
            >
              Photo {index + 1} · {img.name.slice(0, 18)}
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                className="text-rose-600 hover:text-rose-700"
                onClick={() => removeImage(img.publicId)}
              >
                ×
              </button>
            </span>
          ))}
          {images.length < MAX_REPORT_IMAGES ? (
            <label
              className={`inline-flex h-9 cursor-pointer items-center rounded-lg border border-line bg-white px-3.5 text-[12px] font-bold text-navy-800 transition-colors hover:bg-navy-50 ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {uploading ? "Uploading…" : "Add photo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void uploadImage(file);
                }}
              />
            </label>
          ) : null}
        </div>
        {imageError ? (
          <p role="alert" className="mt-1.5 text-[12px] font-semibold text-rose-600">
            {imageError}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Submitting report…">
        Submit activity report
      </SubmitButton>
    </form>
  );

  // Keeps the hidden imagePublicIds input in sync with the chips shown,
  // including after a photo is removed from the report.
  function syncIds(list: UploadedImage[]) {
    if (imageIds.current) imageIds.current.value = list.map((x) => x.publicId).join(",");
  }

  function removeImage(publicId: string) {
    const next = images.filter((x) => x.publicId !== publicId);
    setImages(next);
    syncIds(next);
  }

  async function uploadImage(file: File) {
    setImageError(null);
    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("That photo is over 1 MB. Please choose a smaller one.");
      return;
    }
    setUploading(true);
    try {
      const sign = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "report-media" }),
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
      if (!uploaded.ok) throw new Error("The image upload was rejected. Please try again.");
      const result = (await uploaded.json()) as { public_id?: string };
      if (!result.public_id) throw new Error("Upload finished without an asset ID.");
      const next: UploadedImage[] = [...images, { publicId: result.public_id, name: file.name }];
      setImages(next);
      syncIds(next);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "The upload failed.");
    } finally {
      setUploading(false);
    }
  }
}
