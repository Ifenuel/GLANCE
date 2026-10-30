"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Audit log filter bar. Every control is a real dropdown, not a wall of
 * scattered chips, and changing one updates the URL immediately (replace, so the Back
 * button still leaves the page rather than stepping through every tweak).
 *
 * Kept as a tiny client island: the page itself is a server component, and
 * this is the only part that needs to react to a change event.
 */
export function AuditFilters({
  actions,
  entities,
  pageSizes = [10, 25, 50, 100, 250],
}: {
  /** Distinct action values in use, e.g. ["auth.login", "member.update"]. */
  actions: string[];
  /** Distinct entity types in use, e.g. ["User", "Chapter"]. */
  entities: string[];
  /** Row-count choices offered to the reader. */
  pageSizes?: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pending values render instantly; the URL catches up when the server
  // responds, so the dropdown never feels like it is waiting on the network.
  // Comparing the query we navigated to against the live one derives the
  // pending flag, so no effect has to clear it afterwards.
  const [requestedQuery, setRequestedQuery] = useState<string | null>(null);

  const action = searchParams.get("action") ?? "";
  const entity = searchParams.get("entity") ?? "";
  const size = searchParams.get("size") ?? "25";
  const pending = requestedQuery !== null && requestedQuery !== searchParams.toString();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Any filter change resets to the first page, since staying on page 7 of a
    // different result set is never what the reader meant.
    params.delete("page");
    setRequestedQuery(params.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const selectClass =
    "h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white px-3.5 pr-9 text-[13px] font-semibold text-navy-900 transition-colors hover:border-navy-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none disabled:opacity-60";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <label className="flex-1">
        <span className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase">
          Activity
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={action}
            disabled={pending}
            onChange={(event) => update("action", event.target.value)}
          >
            <option value="">All activity</option>
            {actions.map((value) => (
              <option key={value} value={value}>
                {labelFor(value)}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </label>

      <label className="flex-1">
        <span className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase">
          Record type
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={entity}
            disabled={pending}
            onChange={(event) => update("entity", event.target.value)}
          >
            <option value="">All records</option>
            {entities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </label>

      <label className="w-full lg:w-44">
        <span className="mb-1.5 block text-[11px] font-bold tracking-[0.08em] text-ink-400 uppercase">
          Rows per page
        </span>
        <div className="relative">
          <select
            className={selectClass}
            value={size}
            disabled={pending}
            onChange={(event) => update("size", event.target.value)}
          >
            {pageSizes.map((value) => (
              <option key={value} value={String(value)}>
                {value} rows
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </label>

      {action || entity ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setRequestedQuery("");
            router.replace(pathname, { scroll: false });
          }}
          className="h-10 shrink-0 rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:bg-navy-50 disabled:opacity-60"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-400"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ACTION_WORDS: Record<string, string> = {
  auth: "Sign-in",
  account: "Account",
  chapter: "Chapter",
  chapter_application: "Chapter application",
  join_application: "Membership application",
  invitation: "Invitation",
  member: "Member record",
  membership: "Member export",
  media: "Media",
  report: "Activity report",
  content: "Content",
  contact: "Contact message",
  user: "User account",
  event: "Event",
};

/** "chapter_application.approve" reads as "Chapter application · approve". */
function labelFor(value: string) {
  const [domain, verb] = value.split(".");
  const head = ACTION_WORDS[domain] ?? domain.replaceAll("_", " ");
  return verb ? `${head} · ${verb.replaceAll("_", " ")}` : head;
}
