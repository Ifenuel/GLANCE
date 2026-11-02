"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * Cover image for a story, chosen straight from the device.
 *
 * The upload goes browser → Cloudinary with a short-lived signature issued by
 * /api/cloudinary/signature (scope `post-cover`, minted for the signed-in
 * CMS author). Only the returned public ID travels with the form; the server
 * action verifies the asset really exists in our Cloudinary account inside the
 * post-cover folder before it is written to the story record, so a client
 * never controls the URL that is stored.
 */
export function CoverImageUploader({ note }: { note?: string }) {
  const [publicId, setPublicId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setPublicId("");

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("That image is over 4 MB. Please choose a smaller one.");
      return;
    }

    setBusy(true);
    setPreview(null);

    try {
      const sign = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "post-cover" }),
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

      setPublicId(result.public_id);
      setPreview(result.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed.");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setPublicId("");
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {/* The verified public ID is the only thing posted with the story. */}
      <input type="hidden" name="coverPublicId" value={publicId} readOnly />

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-navy-950 px-4 text-[12px] font-bold text-white transition-colors hover:bg-navy-900">
          {busy ? "Uploading…" : publicId ? "Pick a different image" : "Upload from device"}
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
        {publicId ? (
          <button
            type="button"
            onClick={clear}
            className="h-10 rounded-lg border border-line px-3 text-[12px] font-bold text-ink-500 hover:bg-navy-50"
          >
            Remove
          </button>
        ) : null}
        <span className="text-[11px] text-ink-400">JPG, PNG or WebP, up to 4 MB.</span>
      </div>

      {busy ? (
        <p className="text-[12px] font-semibold text-navy-700">
          Uploading the cover image…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[12px] font-semibold text-rose-600">
          {error}
        </p>
      ) : null}
      {preview && !busy ? (
        <div className="relative aspect-video w-full max-w-[280px] overflow-hidden rounded-lg border border-line bg-navy-50">
          <Image
            src={preview}
            alt="Selected cover image"
            fill
            sizes="280px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      {!preview && !busy && !error ? (
        <p className="text-[11px] text-ink-400">
          {note ?? "Optional — shown on the story card on the website."}
        </p>
      ) : null}
    </div>
  );
}
