import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { setChapterStatusAction } from "@/server/actions/admin";
import { ActionMenu } from "@/components/portal/action-menu";
import { GlanceMark } from "@/components/glance-logo";
import { SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Chapters",
  description: "GLANCE administrators manage every campus chapter.",
};

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  DEACTIVATED: "bg-slate-100 text-slate-600",
};

export default async function ChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);
  const { query, status } = await searchParams;

  const chapters = await db.chapter.findMany({
    where: status && ["ACTIVE", "PENDING", "SUSPENDED", "DEACTIVATED"].includes(status)
      ? { status: status as "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED" }
      : undefined,
    orderBy: [{ institution: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      institution: true,
      city: true,
      state: true,
      status: true,
      logoUrl: true,
      createdAt: true,
      activatedAt: true,
      _count: { select: { members: { where: { status: "ACTIVE" } } } },
    },
  });

  const q = (query ?? "").trim().toLowerCase();
  const filtered = q
    ? chapters.filter((c) =>
        [c.name, c.institution, c.city, c.state, c.code]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : chapters;

  const activeCount = chapters.filter((c) => c.status === "ACTIVE").length;
  const pendingCount = chapters.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Network management"
          title="Chapters"
          intro={
            <p>
              Every GLANCE chapter with its permanent, backend-allocated code.
              Create new chapters, change status, jump to members and generate
              ID cards in bulk — all through one menu per chapter.
            </p>
          }
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/portal/chapters/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gold-400 px-5 text-[13px] font-bold text-navy-900 shadow-sm transition-all hover:bg-gold-500 hover:shadow-lg"
          >
            Create chapter
          </Link>
          <Link
            href="/portal/statistics"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-[13px] font-bold text-navy-900 transition-colors hover:bg-navy-50"
          >
            View map
          </Link>
        </div>
      </div>

      {/* Counter strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Chapters on record", value: chapters.length },
          { label: "Active", value: activeCount },
          { label: "Pending approval", value: pendingCount },
        ].map((kpi) => (
          <div key={kpi.label} className="lift rounded-2xl border border-line bg-white p-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-ink-400 uppercase">
              {kpi.label}
            </p>
            <p className="font-data mt-2 text-[26px] leading-none font-bold text-navy-900">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {/* Search + filter bar */}
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <form action="/portal/chapters" method="get" className="flex w-full max-w-md items-center gap-2">
            <input
              type="search"
              name="query"
              placeholder="Search code, institution, city, state…"
              defaultValue={query ?? ""}
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-navy-800"
            >
              Search
            </button>
            {q ? (
              <Link
                href="/portal/chapters"
                className="shrink-0 rounded-lg px-3 py-2.5 text-[12.5px] font-bold text-ink-500 hover:text-navy-900"
              >
                Clear
              </Link>
            ) : null}
          </form>
          <div className="flex gap-1.5 rounded-xl border border-line bg-navy-50/50 p-1">
            {[
              [undefined, "All"],
              ["ACTIVE", "Active"],
              ["PENDING", "Pending"],
              ["SUSPENDED", "Suspended"],
            ].map(([value, label]) => (
              <Link
                key={String(label)}
                href={
                  value
                    ? `/portal/chapters?status=${value}${q ? `&query=${encodeURIComponent(query ?? "")}` : ""}`
                    : `/portal/chapters${q ? `?query=${encodeURIComponent(query ?? "")}` : ""}`
                }
                className={`rounded-lg px-3 py-1.5 text-[11.5px] font-bold transition-colors ${
                  (status ?? undefined) === value
                    ? "bg-navy-900 text-white"
                    : "text-ink-500 hover:bg-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50">
              <GlanceMark className="h-7 w-auto" />
            </div>
            <p className="text-[15px] font-bold text-navy-900">
              {q ? "No chapters match your search" : "No chapters yet"}
            </p>
            <p className="text-[12.5px] text-ink-500">
              {q
                ? "Try another code, institution or state."
                : "Create your first chapter with the button above — its unique code is generated automatically."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((chapter) => {
              const count = chapter._count.members;
              const tone = STATUS_TONE[chapter.status];
              const label =
                chapter.status === "ACTIVE"
                  ? "Active"
                  : chapter.status === "PENDING"
                    ? "Pending"
                    : chapter.status === "SUSPENDED"
                      ? "Suspended"
                      : "Deactivated";
              return (
                <li
                  key={chapter.id}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-navy-50/40 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-navy-50">
                      {chapter.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={chapter.logoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <GlanceMark className="h-6 w-auto" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[13.5px] font-bold text-navy-900">
                          {chapter.name}
                        </p>
                        <span className="rounded-md bg-navy-950 px-2 py-0.5 font-mono text-[10.5px] font-bold text-gold-300">
                          {chapter.code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${tone}`}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-ink-500">
                        {chapter.institution} · {chapter.city}, {chapter.state} · created{" "}
                        {formatDate(chapter.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-6 lg:flex">
                    <div className="text-right">
                      <p className="font-data text-[16px] font-bold text-navy-900">{count}</p>
                      <p className="text-[10px] text-ink-400">
                        {count === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-semibold text-navy-900">
                        {chapter.activatedAt ? formatDate(chapter.activatedAt) : "—"}
                      </p>
                      <p className="text-[10px] text-ink-400">activated</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {(["ACTIVE", "PENDING", "SUSPENDED"] as const)
                      .filter((next) => next !== chapter.status)
                      .map((next) => (
                        <form
                          key={next}
                          id={`chapter-status-${chapter.id}-${next}`}
                          action={setChapterStatusAction}
                        >
                          <input type="hidden" name="chapterId" value={chapter.id} />
                          <input type="hidden" name="status" value={next} />
                        </form>
                      ))}
                    <ActionMenu
                      label={`Actions for ${chapter.name}`}
                      items={[
                        {
                          kind: "link",
                          label: "Open chapter",
                          href: `/portal/chapters/${chapter.id}`,
                        },
                        ...(chapter.status !== "ACTIVE"
                          ? [
                              {
                                kind: "submit" as const,
                                label: "Activate chapter",
                                formId: `chapter-status-${chapter.id}-ACTIVE`,
                              },
                            ]
                          : [
                              {
                                kind: "submit" as const,
                                label: "Deactivate to Pending",
                                formId: `chapter-status-${chapter.id}-PENDING`,
                              },
                              {
                                kind: "submit" as const,
                                label: "Suspend chapter",
                                formId: `chapter-status-${chapter.id}-SUSPENDED`,
                                danger: true,
                              },
                            ]),
                        {
                          kind: "link",
                          label: "Members directory",
                          href: `/portal/chapters/${chapter.id}/members`,
                        },
                        {
                          kind: "link",
                          label: "Generate ID cards",
                          href: `/portal/members/id-cards/${chapter.id}`,
                        },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
