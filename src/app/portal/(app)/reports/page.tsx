import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { ButtonLink, Card, CardTitle, GLANCE, SectionHeading, VerifiedNote } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { ReportForm } from "@/components/portal/forms";

export const metadata: Metadata = {
  title: "Activity reports",
  description: "Submit and view chapter activity reports.",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ chapterCode?: string }>;
}) {
  const { chapterCode } = await searchParams;
  const viewer = await requireUser();

  const chapters = await db.chapter.findMany({
    where: {
      ...(chapterCode ? { code: chapterCode.toUpperCase() } : {}),
      // Chapter administrators never see other chapters, active or pending.
      ...(viewer.role === "CHAPTER_ADMIN"
        ? { id: viewer.chapterId ?? "__no_chapter__" }
        : {}),
    },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  // Chapter administrators only ever see their own chapter's reports.
  const scopeChapterId =
    viewer.role === "CHAPTER_ADMIN"
      ? viewer.chapterId
      : chapterCode
        ? chapters[0]?.id
        : undefined;

  const reports = await db.activityReport.findMany({
    where: scopeChapterId ? { chapterId: scopeChapterId } : {},
    orderBy: { activityDate: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      activityDate: true,
      attendeeCount: true,
      createdAt: true,
      chapter: { select: { name: true, code: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SectionHeading
            eyebrow="Network management"
            title="Activity reports"
            intro={
              <p>
                Submit weekly or monthly activity reports for your chapter, and
                review what chapters across the network are doing.
              </p>
            }
          />
        </div>
        <div className="flex gap-3">
          <a
            href="/portal/reports/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gold-400 px-5 text-[13px] font-bold text-navy-900 hover:bg-gold-500"
          >
            New report
          </a>
          <ButtonLink href="/portal/chapters" variant="outline">
            Back to chapters
          </ButtonLink>
        </div>
      </div>

      {chapters.length > 0 ? (
        <Card>
          <p className="text-[12.5px] text-ink-500">
            Filter reports by chapter code. Leave blank to see all reports.
          </p>
          <form
            action="/portal/reports"
            method="get"
            className="flex items-center gap-2"
          >
            <input
              type="search"
              name="chapterCode"
              placeholder="Chapter code"
              defaultValue={chapterCode ?? ""}
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none sm:w-auto"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-navy-900 px-5 text-[13px] font-bold text-white hover:bg-navy-950"
            >
              Filter
            </button>
          </form>
        </Card>
      ) : null}

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Submit an activity report</h3>
        <p className="text-[12.5px] text-ink-500">
          Report chapter activity for the PR period: what the chapter did, who
          participated, and the outcome. Reports are part of the audit trail.
        </p>
        <div className="mt-4">
          <ReportForm
            chapter={
              chapters[0] ?? {
                id: "",
                name: "Select a chapter first",
                code: "",
              }
            }
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <GLANCE className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h3 className="text-base font-extrabold text-navy-900">What is reported</h3>
            <ul className="mt-3 space-y-2 text-[13.5px] leading-6 text-ink-500">
              <li className="flex gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Activity title and date</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Attendee count</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Summary for GLANCE and the network</span>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-ink-400">
          Activity reports are stored in the audit trail and are visible to
          authorised administrators only.
        </p>
      </Card>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">
          Submitted reports
        </h3>
        {reports.length === 0 ? (
          <div className="py-10 text-center text-ink-500">
            <p className="text-base font-bold text-navy-900">No reports yet</p>
            <p className="text-[12.5px]">
              Use the form above to submit your first activity report.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="border-border">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{report.title}</CardTitle>
                    <p className="text-[12.5px] text-ink-500">
                      {report.chapter.name} ({report.chapter.code}) · {formatDate(report.activityDate)}
                    </p>
                    <p className="font-mono text-[11.5px] font-semibold text-ink-400">
                      {report.attendeeCount ?? 0} attendees
                    </p>
                  </div>
                  <p className="text-[11.5px] font-mono text-ink-400">{formatDate(report.createdAt)}</p>
                </div>
                <p className="mt-2 text-[12.5px] leading-6 text-ink-500">{report.summary}</p>
              </Card>
            ))}
          </div>
        )}
        <VerifiedNote>
          Activity reports are part of the membership tracking work the network
          does with GLANCE. They are never published publicly.
        </VerifiedNote>
      </Card>
    </div>
  );
}
