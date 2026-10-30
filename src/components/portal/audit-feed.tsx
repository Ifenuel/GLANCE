import Link from "next/link";
import { auditActionLabel, type AuditEntry } from "@/server/audit";
import { formatRelativeTime, roleLabel } from "@/lib/format";

/**
 * The activity trail, shared by the dashboard and the audit log.
 *
 * Every row answers the three questions an audit entry exists to answer:
 * **who** did it, **what** they did, and **when**. The actor is joined on the
 * server (see entrySelect in server/audit.ts). Without that the trail reads as
 * a list of anonymous verbs, which cannot be used to trace anything.
 */

function initials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "G") + (parts[1]?.[0] ?? "");
}

/**
 * Who did it. Prefers the account's own name, then the email address on the
 * record, then the attempted email captured when a sign-in fails. Never shows
 * a bare role label or an anonymous placeholder, because the whole point of
 * the trail is to name the person.
 */
function actorLabel(entry: AuditEntry) {
  if (entry.actor) {
    const name = entry.actor.name.trim();
    if (name && !/^(member|admin|user|officer)$/i.test(name)) return name;
    return entry.actor.email;
  }
  const metadata = entry.metadata as { email?: unknown } | null;
  if (metadata && typeof metadata.email === "string" && metadata.email) {
    return metadata.email;
  }
  return "Unrecognised sign-in";
}

export function AuditFeed({
  entries,
  emptyMessage = "No activity recorded yet.",
  href,
  limit,
}: {
  entries: AuditEntry[];
  emptyMessage?: string;
  /** Where the trailing link points, when there is a fuller log to open. */
  href?: string;
  limit?: number;
}) {
  const rows = typeof limit === "number" ? entries.slice(0, limit) : entries;

  if (rows.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-[12.5px] text-ink-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <ol className="divide-y divide-line">
        {rows.map((entry) => {
          const who = actorLabel(entry);
          const email = entry.actor?.email ?? "";
          return (
            <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[11px] font-bold text-navy-800 uppercase"
              >
                {initials(entry.actor?.name ?? who, email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-snug text-navy-900">
                  <span className="font-bold">{who}</span>{" "}
                  <span className="text-ink-600">
                    {auditActionLabel(entry.action).toLowerCase()}
                  </span>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-400">
                  <span>{formatRelativeTime(entry.createdAt)}</span>
                  {entry.actor ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-ink-500">
                        {roleLabel(entry.actor.role)}
                      </span>
                    </>
                  ) : null}
                  {entry.ip ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[10.5px]">{entry.ip}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {href ? (
        <div className="border-t border-line px-5 py-3">
          <Link
            href={href}
            className="text-[12px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
          >
            Open audit log
          </Link>
        </div>
      ) : null}
    </>
  );
}
