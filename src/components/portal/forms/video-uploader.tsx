"use client";

import { useRef, useState } from "react";

/**
 * Teaser video for an event, recorded or picked straight from the device.
 *
 * The upload goes browser → Cloudinary with a short-lived signature issued by
 * /api/cloudinary/signature (scope `event-video`, minted for event managers).
 * Only the returned public ID travels with the form; the server action verifies
 * the asset really exists in our Cloudinary account inside the event-video
 * folder before its URL is stored, so a client never controls what is saved.
 */
export function VideoUploader({ note }: { note?: string }) {
  const [publicId, setPublicId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_BYTES = 64 * 1024 * 1024;

  function uploadWithProgress(
    url: string,
    body: FormData,
    onProgress: (fraction: number) => void,
  ): Promise<{ public_id?: string; secure_url?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("The upload finished without a readable response."));
          }
        } else {
          reject(new Error("The media host rejected that file. Please try another video."));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("The upload failed.")));
      xhr.addEventListener("abort", () => reject(new Error("The upload was cancelled.")));
      xhr.send(body);
    });
  }

  async function upload(file: File) {
    setError(null);
    setPublicId("");
    setPreview(null);
    setFileName(null);

    if (!file.type.startsWith("video/")) {
      setError("Choose a video file (MP4, MOV or WebM).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That video is over 64 MB. Trim it or record a shorter teaser.");
      return;
    }

    setBusy(true);
    setProgress(0);
    setFileName(file.name);

    try {
      const sign = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "event-video" }),
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

      const result = await uploadWithProgress(sig.uploadUrl, body, (fraction) =>
        setProgress(Math.round(fraction * 100)),
      );
      if (!result.public_id || !result.secure_url) {
        throw new Error("The upload finished without a video address.");
      }

      setPublicId(result.public_id);
      setPreview(result.secure_url);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed.");
      setProgress(null);
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setPublicId("");
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {/* The verified public ID is the only thing posted with the event. */}
      <input type="hidden" name="videoPublicId" value={publicId} readOnly />

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-navy-950 px-4 text-[12px] font-bold text-white transition-colors hover:bg-navy-900">
          {busy ? "Uploading…" : publicId ? "Pick a different video" : "Upload from device"}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
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
        <span className="text-[11px] text-ink-400">MP4, MOV or WebM, up to 64 MB.</span>
      </div>

      {busy ? (
        <p className="text-[12px] font-semibold text-navy-700">
          Uploading {fileName ? `“${fileName}” ` : ""}
          {progress !== null && progress > 0 ? `— ${progress}%` : "…"}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[12px] font-semibold text-rose-600">
          {error}
        </p>
      ) : null}
      {preview && !busy ? (
        <video
          controls
          className="w-full max-w-[320px] rounded-lg border border-line bg-navy-950"
          src={preview}
        />
      ) : null}
      {!preview && !busy && !error ? (
        <p className="text-[11px] text-ink-400">
          {note ?? "Optional — plays inside the event card on the website."}
        </p>
      ) : null}
    </div>
  );
}
