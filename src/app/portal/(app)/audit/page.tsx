import type { Metadata } from "next";
import Link from "next/link";
import {
  auditActionLabel,
  auditMetadataDecision,
  auditPage,
} from "@/server/audit";
import { requireRole } from "@/server/auth";
import { Container, SectionHeading } from "@/components/ui";
import { roleLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Every administrative action recorded across the GLANCE network.",
};

/** Row counts offered as one-click jumps. */
const PAGE_SIZES = [10, 100, 1000, 10000];

const ACTION_FILTERS = [
  { label: "All activity", value: "" },
  { label: "Sign-ins", value: "auth.login" },
  { label: "Chapter approvals", value: "chapter.activate" },
  { label: "Member approvals", value: "join_application.approve" },
  { label: "Member rejections", value: "join_application.reject" },
  { label: "Invitations issued", value: "invitation.issue" },
  { label: "CSV exports", value: "export" },
];

function initials(name: string | null, email: string | null) {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "Unknown";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Short human summary of the device behind an action. */
function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  let browser = "Browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/")) browser = "Safari";

  let os = "";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return os ? `${browser} on ${os}` : browser;
}

function decisionTone(decision: string) {
  const value = decision.toLowerCase();
  if (value.startsWith("approv")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value.startsWith("reject") || value.startsWith("fail")) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-navy-50 text-navy-700 border-navy-100";
}

/** Builds an audit URL with a filter, a row count, an offset and a cursor stack. */
function pageHref(
  params: { action?: string; limit: number; offset: number; stack: string[] },
  options: {
    action?: string;
    limit?: number;
    offset?: number;
    cursor?: string | null;
    stack?: string[];
  } = {},
) {
  const search = new URLSearchParams();
  const action = options.action !== undefined ? options.action : params.action;
  const limit = options.limit ?? params.limit;
  const offset = options.offset ?? params.offset;
  const stack = options.stack ?? params.stack;
  if (action) search.set("action", action);
  search.set("limit", String(limit));
  if (offset > 0) search.set("offset", String(offset));
  for (const item of stack) search.append("c", item);
  if (options.cursor) search.append("c", options.cursor);
  return `/portal/audit?${search.toString()}`;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    limit?: string;
    offset?: string;
    c?: string | string[];
  }>;
}) {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);
  const query = await searchParams;

  const action = query.action && ACTION_FILTERS.some((f) => f.value === query.action)
    ? query.action
    : undefined;
  const limit = PAGE_SIZES.includes(Number(query.limit)) ? Number(query.limit) : 100;
  // The stack holds one keyset cursor per page already walked, so the current
  // page number is its length regardless of how the row count has changed.
  const stack = (Array.isArray(query.c) ? query.c : query.c ? [query.c] : []).slice(-20);
  const offset = Number.isFinite(Number(query.offset)) ? Number(query.offset) : 0;
  const cursor = stack[stack.length - 1];

  const where: Record<string, unknown> = {};
  if (action) {
    where.action = action === "export" ? { startsWith: "export" } : action;
  }

  const { entries, nextCursor } = await auditPage({ limit, cursor, where });
  const params = { action, limit, offset, stack };

  return (
    <Container>
      <SectionHeading
        eyebrow="Network management"
        title="Audit log"
        intro={
          <p>
            Every action taken in the portal is recorded here with the person who
            took it, their role, the device they used and where they signed in
            from. The record cannot be edited or deleted.
          </p>
        }
      />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {ACTION_FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={pageHref(params, {
              action: filter.value || undefined,
              limit,
              offset: 0,
              cursor: null,
              stack: [],
            })}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
              (action ?? "") === filter.value
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-line bg-white text-navy-800 hover:border-navy-300"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
        <p className="text-[12px] text-ink-500">
          Rows{" "}
          <span className="font-bold text-navy-900">
            {(offset + 1).toLocaleString()}
          </span>{" "}
          to{" "}
          <span className="font-bold text-navy-900">
            {(offset + entries.length).toLocaleString()}
          </span>{" "}
          of the log
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase">
            Rows
          </span>
          {PAGE_SIZES.map((size) => (
            <Link
              key={size}
              href={pageHref(params, {
                limit: size,
                offset: 0,
                cursor: null,
                stack: [],
              })}
              className={`h-8 min-w-[3rem] rounded-lg border px-3 text-[12px] font-bold transition-colors ${
                size === limit
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-line bg-white text-navy-800 hover:border-navy-300"
              }`}
            >
              {size.toLocaleString()}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-navy-50/70">
              <th scope="col" className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-navy-800 uppercase">When</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-navy-800 uppercase">Who</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-navy-800 uppercase">Action</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-navy-800 uppercase">Record</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-navy-800 uppercase">Outcome</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-navy-800 uppercase">Device</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {entries.map((entry) => {
              const decision = auditMetadataDecision(entry.metadata);
              const metadata = entry.metadata as { email?: unknown } | null;
              const attemptedEmail =
                metadata && typeof metadata.email === "string" ? metadata.email : null;
              const who =
                entry.actor?.name?.trim() || entry.actor?.email || attemptedEmail || "Unknown user";
              return (
                <tr key={entry.id} className="align-top transition-colors hover:bg-navy-50/40">
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-[12.5px] font-semibold text-navy-900">
                      {entry.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-400">
                      {entry.createdAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-bold text-navy-800"
                      >
                        {initials(entry.actor?.name ?? null, entry.actor?.email ?? null)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-navy-900">{who}</p>
                        <p className="mt-0.5 text-[11px] text-ink-500">
                          {roleLabel(entry.actorRole ?? entry.actor?.role ?? "member")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] font-semibold text-navy-800">
                    {auditActionLabel(entry.action)}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-ink-500">{entry.entityType}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${decisionTone(decision)}`}>
                      {decision}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[12px] text-navy-800">{deviceLabel(entry.userAgent)}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-ink-400">
                      {entry.ip ?? "No address recorded"}
                    </p>
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <p className="text-[15px] font-bold text-navy-900">No activity recorded yet</p>
                  <p className="mt-1.5 text-[12.5px] text-ink-500">
                    Actions taken in the portal will appear here as they happen.
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-500">
          {nextCursor || stack.length > 0
            ? "Keep stepping through the log to reach the oldest entries."
            : "You have reached the oldest entry in the log."}
        </p>
        <div className="flex items-center gap-2">
          {stack.length > 0 ? (
            <Link
              href={pageHref(params, {
                limit,
                offset: Math.max(0, offset - limit),
                stack: stack.slice(0, -1),
              })}
              className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:bg-navy-50"
            >
              ← Newer
            </Link>
          ) : null}
          {nextCursor ? (
            <Link
              href={pageHref(params, {
                limit,
                offset: offset + limit,
                stack: [...stack, nextCursor],
              })}
              className="inline-flex h-10 items-center rounded-lg bg-navy-900 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-navy-800"
            >
              Older {limit.toLocaleString()} →
            </Link>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
