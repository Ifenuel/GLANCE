"use client";

import { useState, useTransition } from "react";
import { revokeInvitationAction } from "@/server/actions/admin";

/**
 * Per-row controls on the invitations table: copy the code to the clipboard,
 * and revoke a pending code. Revoke posts straight to the server action with
 * an in-flight guard, so the row can never be double-submitted.
 */
export function InvitationRowActions({
  id,
  status,
  code,
  canRevoke,
}: {
  id: string;
  status: string;
  code: string;
  canRevoke: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status !== "PENDING") {
    return <span className="text-[11.5px] text-ink-400">, </span>;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(null);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed. Select the code manually.");
    }
  }

  function revoke() {
    if (pending) return;
    const ok = window.confirm(
      `Revoke the code ${code}? It will stop working immediately.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("invitationId", id);
        await revokeInvitationAction(fd);
      } catch {
        setError("Could not revoke. Try again.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 items-center rounded-lg border border-line bg-white px-2.5 text-[11.5px] font-bold text-navy-800 transition-colors hover:border-navy-300 hover:bg-navy-50"
      >
        {copied ? "Copied ✓" : "Copy code"}
      </button>
      {canRevoke ? (
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className="inline-flex h-8 items-center rounded-lg border border-rose-200 bg-white px-2.5 text-[11.5px] font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Revoking…" : "Revoke"}
        </button>
      ) : null}
      {error ? (
        <span role="alert" className="text-[11px] text-rose-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}
