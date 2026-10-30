"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { attachAvatarAction } from "@/server/actions/member";
import { idleFormState } from "@/server/validation";

/**
 * Profile photo picker.
 *
 * Uploads straight from the browser to Cloudinary using a short-lived signature
 * minted by /api/cloudinary/signature. The folder and public ID are derived on
 * the server and bound to the signed-in member, so a client cannot write
 * anywhere else. Once Cloudinary answers, the returned public ID is handed to
 * `attachAvatarAction`, which verifies the asset server-side before it is
 * written to the member record.
 */
export function AvatarUploader({ currentUrl, name }: { currentUrl: string | null; name: string }) {
  const [state, formAction] = useActionState(attachAvatarAction, idleFormState);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const publicIdInput = useRef<HTMLInputElement>(null);

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
    setPreview(URL.createObjectURL(file));

    try {
      const sign = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "member-avatar" }),
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
      const result = (await uploaded.json()) as { public_id?: string; secure_url?: string };
      if (!result.public_id) throw new Error("Upload finished without an asset ID.");

      // Hand the verified public ID to the server action through a real form
      // submission, so the action still validates ownership before saving.
      if (publicIdInput.current) publicIdInput.current.value = result.public_id;
      const fd = new FormData();
      fd.append("publicId", result.public_id);
      formAction(fd);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "The upload failed.");
      setPreview(null);
    } finally {
      setBusy(null);
    }
  }

  const shown = preview ?? currentUrl;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line bg-navy-50">
        {shown ? (
          <Image src={shown} alt={name} fill sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[22px] font-bold text-navy-900 uppercase">
            {name.trim().charAt(0) || "?"}
          </span>
        )}
      </div>

      <div className="min-w-0">
        {/* Not a nested <form>: this sits inside the profile form, which is
            invalid HTML. The upload posts straight to Cloudinary and hands the
            verified public ID to the server action directly. */}
        <div className="space-y-2">
          <input ref={publicIdInput} type="hidden" name="publicId" value="" />
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:border-navy-200 hover:bg-navy-50">
            {busy ? "Uploading…" : currentUrl ? "Replace photo" : "Upload a photo"}
            <input
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
          </label>
          <p className="text-[11.5px] text-ink-400">
            JPG, PNG or WebP, up to 4 MB. Shown wherever your name appears.
          </p>
        </div>

        {busy ? <p className="text-[12px] font-semibold text-navy-700">{busy}</p> : null}
        {localError ? (
          <p role="alert" className="text-[12px] font-semibold text-rose-600">
            {localError}
          </p>
        ) : null}
        {state.message && !localError ? (
          <p className="text-[12px] font-semibold text-navy-700">{state.message}</p>
        ) : null}
      </div>
    </div>
  );
}
