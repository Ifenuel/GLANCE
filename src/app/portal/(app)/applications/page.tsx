import type { Metadata } from "next";
import type { ApplicationStatus } from "@prisma/client";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import {
  reviewJoinApplicationEntryAction,
  reviewChapterApplicationEntryAction,
} from "@/server/actions/admin";
import { ActionMenu } from "@/components/portal/action-menu";
import { GlanceMark } from "@/components/glance-logo";
import { SectionHeading } from "@/components/ui";
import { formatDate, genderLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Applications",
  description: "Review chapter and member applications.",
};

const STATUS_TONE: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const ACADEMIC_LABEL: Record<string, string> = {
  YEAR_1: "Year 1",
  YEAR_2: "Year 2",
  YEAR_3: "Year 3",
  YEAR_4: "Year 4",
  YEAR_5: "Year 5",
  ND: "ND",
  HND: "HND",
  PGD: "PGD",
  MASTERS: "Masters",
  DOCTORATE: "Doctorate",
  OTHER: "Other",
};

const CATEGORY_LABEL: Record<string, string> = {
  STUDENT: "Student",
  NON_STUDENT: "Non-student",
  ALUMNI: "Alumni",
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em] ${STATUS_TONE[status]}`}
    >
      {status === "PENDING" ? "Pending" : status === "APPROVED" ? "Approved" : "Rejected"}
    </span>
  );
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; chapterCode?: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);
  const { status, type, chapterCode } = await searchParams;

  const statusFilter: "PENDING" | "APPROVED" | "REJECTED" | "ALL" =
    status === "APPROVED" || status === "REJECTED" || status === "ALL"
      ? status
      : "PENDING";
  const typeFilter = type === "chapter" || type === "join" ? type : null;
  const applicationWhere: { status?: ApplicationStatus } =
    statusFilter === "ALL" ? {} : { status: statusFilter };
  const trimmedCode = chapterCode?.trim().toUpperCase();

  const whereJoin: { status?: ApplicationStatus; chapterCode?: string } = {
    ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    ...(trimmedCode ? { chapterCode: trimmedCode } : {}),
  };

  const chapterApplications =
    typeFilter === "join"
      ? []
      : await db.chapterApplication.findMany({
          where: applicationWhere,
          orderBy: { createdAt: "desc" },
        });

  const joinApplications =
    typeFilter === "chapter"
      ? []
      : await db.joinApplication.findMany({
          where: whereJoin,
          orderBy: { createdAt: "desc" },
        });

  const pendingChapter = chapterApplications.filter((a) => a.status === "PENDING").length;
  const pendingJoin = joinApplications.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Network management"
          title="Applications"
          intro={
            <p>
              Review chapter applications and membership applications in one
              place. Every submitted detail — phone, gender, level, motivation —
              arrives here the moment it is submitted.
            </p>
          }
        />
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white p-1.5">
          {([["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"], ["ALL", "All"]] as const).map(
            ([value, label]) => (
              <a
                key={value}
                href={`/portal/applications?status=${value}${typeFilter ? `&type=${typeFilter}` : ""}`}
                className={`rounded-lg px-3.5 py-2 text-[12px] font-bold transition-colors ${
                  statusFilter === value
                    ? "bg-navy-900 text-white"
                    : "text-ink-600 hover:bg-navy-50"
                }`}
              >
                {label}
              </a>
            ),
          )}
        </div>
      </div>

      {/* Counter strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pending now", value: pendingChapter + pendingJoin, tone: "text-amber-600" },
          { label: "Chapter applications", value: chapterApplications.length, tone: "text-navy-900" },
          { label: "Membership applications", value: joinApplications.length, tone: "text-navy-900" },
          {
            label: "Approved total",
            value: chapterApplications.filter((a) => a.status === "APPROVED").length +
              joinApplications.filter((a) => a.status === "APPROVED").length,
            tone: "text-emerald-700",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="lift rounded-2xl border border-line bg-white p-4 transition-shadow"
          >
            <p className="text-[10px] font-bold tracking-[0.14em] text-ink-400 uppercase">
              {kpi.label}
            </p>
            <p className={`font-data mt-2 text-[26px] leading-none font-bold ${kpi.tone}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Decisions recorded */}
      {joinApplications.length === 0 && chapterApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <p className="text-[15px] font-bold text-navy-900">
            {statusFilter === "PENDING" ? "No pending applications" : "Nothing here"}
          </p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            Membership applications submitted on the public website land in
            this list automatically.
          </p>
        </div>
      ) : null}

      {chapterApplications.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-950">
                <GlanceMark className="h-5 w-auto" />
              </div>
              <div>
                <h2 className="font-display text-[15px] font-bold text-navy-900">
                  Chapter applications
                </h2>
                <p className="mt-0.5 text-[11.5px] text-ink-400">
                  Institutions asking GLANCE to approve a new chapter.
                </p>
              </div>
            </div>
            <a
              href={`/portal/applications?status=${statusFilter}&type=join`}
              className="shrink-0 text-[11.5px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
            >
              Open list
            </a>
          </header>

          <ul className="divide-y divide-line">
            {chapterApplications.map((application) => (
              <li
                key={application.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-navy-50/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-bold text-navy-900">
                      {application.institution}
                    </p>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-500">
                    {application.proposedName} · {application.city}, {application.state}
                  </p>
                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-ink-500">
                    <div>
                      <dt className="inline font-bold text-ink-400">Contact: </dt>
                      <dd className="inline font-semibold text-navy-800">
                        {application.contactName} · {application.contactEmail} · {application.contactPhone}
                      </dd>
                    </div>
                    {application.contactRole ? (
                      <div>
                        <dt className="inline font-bold text-ink-400">Role: </dt>
                        <dd className="inline font-semibold text-navy-800">{application.contactRole}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="inline font-bold text-ink-400">Submitted: </dt>
                      <dd className="inline font-mono">{formatDate(application.createdAt)}</dd>
                    </div>
                    {application.reviewedAt ? (
                      <div>
                        <dt className="inline font-bold text-ink-400">Decided: </dt>
                        <dd className="inline font-mono">{formatDate(application.reviewedAt)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="mt-2 rounded-lg bg-navy-50/60 px-3 py-2 text-[12px] leading-5 text-ink-600">
                    {application.motivation}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {application.status === "PENDING" ? (
                    <>
                      {/* Hidden forms: one per decision, driven by the ⋯ menu. */}
                      <form id={`chap-approve-${application.id}`} action={reviewChapterApplicationEntryAction}>
                        <input type="hidden" name="id" value={application.id} />
                      </form>
                      <form id={`chap-reject-${application.id}`} action={reviewChapterApplicationEntryAction}>
                        <input type="hidden" name="id" value={application.id} />
                        <input type="hidden" name="reject" value="1" />
                      </form>
                      <ActionMenu
                        label={`Actions for ${application.institution} chapter application`}
                        items={[
                          {
                            kind: "link",
                            label: "Open full review",
                            href: `/portal/applications/chapter/${application.id}/review`,
                          },
                          {
                            kind: "submit",
                            label: "Approve & create chapter",
                            formId: `chap-approve-${application.id}`,
                          },
                          {
                            kind: "submit",
                            label: "Reject application",
                            formId: `chap-reject-${application.id}`,
                            danger: true,
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <ActionMenu
                      label={`Actions for ${application.institution} chapter application`}
                      items={[
                        {
                          kind: "link",
                          label: "View review record",
                          href: `/portal/applications/chapter/${application.id}/review`,
                        },
                      ]}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {joinApplications.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400">
                <svg className="h-4.5 w-4.5 text-navy-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 3h7l4 4v14H7z" />
                  <path d="M14 3v4h4M10 12h5M10 16h5" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-[15px] font-bold text-navy-900">
                  Membership applications
                </h2>
                <p className="mt-0.5 text-[11.5px] text-ink-400">
                  Submitted by individuals on the public website. Approved
                  applicants receive an activation code.
                </p>
              </div>
            </div>
            <a
              href={`/portal/applications?status=${statusFilter}&type=chapter`}
              className="shrink-0 text-[11.5px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
            >
              Open list
            </a>
          </header>

          <ul className="divide-y divide-line">
            {joinApplications.map((application) => (
              <li
                key={application.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-navy-50/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-bold text-navy-900">
                      {application.fullName}
                    </p>
                    <StatusBadge status={application.status} />
                    {application.chapterCode ? (
                      <span className="rounded-md bg-navy-950 px-2 py-0.5 font-mono text-[10.5px] font-bold text-gold-300">
                        {application.chapterCode}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-500">
                    {application.institution}
                    {application.state ? ` · ${application.state}` : ""} · {application.email}
                  </p>
                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-ink-500">
                    <div>
                      <dt className="inline font-bold text-ink-400">Phone: </dt>
                      <dd className="inline font-semibold text-navy-800">{application.phone}</dd>
                    </div>
                    <div>
                      <dt className="inline font-bold text-ink-400">Gender: </dt>
          <dd className="inline font-semibold text-navy-800">
            {genderLabel(application.gender)}
          </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold text-ink-400">Department: </dt>
                      <dd className="inline font-semibold text-navy-800">
                        {application.department ?? "Not set"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold text-ink-400">Level: </dt>
                      <dd className="inline font-semibold text-navy-800">
                        {application.academicLevel
                          ? ACADEMIC_LABEL[application.academicLevel] ?? application.academicLevel
                          : "Not set"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold text-ink-400">Category: </dt>
                      <dd className="inline font-semibold text-navy-800">
                        {CATEGORY_LABEL[application.membershipCategory]}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold text-ink-400">Received: </dt>
                      <dd className="inline font-mono">{formatDate(application.createdAt)}</dd>
                    </div>
                    {application.reviewedAt ? (
                      <div>
                        <dt className="inline font-bold text-ink-400">Decided: </dt>
                        <dd className="inline font-mono">{formatDate(application.reviewedAt)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="mt-2 rounded-lg bg-navy-50/60 px-3 py-2 text-[12px] leading-5 text-ink-600">
                    {application.motivation}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {application.status === "PENDING" ? (
                    <>
                      <form id={`join-approve-${application.id}`} action={reviewJoinApplicationEntryAction}>
                        <input type="hidden" name="applicationId" value={application.id} />
                        <input type="hidden" name="decision" value="APPROVED" />
                      </form>
                      <form id={`join-reject-${application.id}`} action={reviewJoinApplicationEntryAction}>
                        <input type="hidden" name="applicationId" value={application.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                      </form>
                      <ActionMenu
                        label={`Actions for ${application.fullName}'s application`}
                        items={[
                          {
                            kind: "link",
                            label: "Open full review",
                            href: `/portal/applications/member/${application.id}/review`,
                          },
                          {
                            kind: "submit",
                            label: "Approve & invite",
                            formId: `join-approve-${application.id}`,
                          },
                          {
                            kind: "submit",
                            label: "Reject application",
                            formId: `join-reject-${application.id}`,
                            danger: true,
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <ActionMenu
                      label={`Actions for ${application.fullName}'s application`}
                      items={[
                        {
                          kind: "link",
                          label: "View review record",
                          href: `/portal/applications/member/${application.id}/review`,
                        },
                      ]}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
