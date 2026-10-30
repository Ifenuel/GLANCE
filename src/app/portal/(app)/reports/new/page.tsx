import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { Card, SectionHeading, VerifiedNote } from "@/components/ui";
import { ReportForm } from "@/components/portal/forms";

export const metadata: Metadata = {
  title: "New activity report",
  description: "Submit an activity report for your chapter.",
};

export default async function NewReportPage() {
  const user = await requireRole("CHAPTER_ADMIN");
  if (!user.chapterId) redirect("/portal/profile");

  const chapter = await db.chapter.findUnique({
    where: { id: user.chapterId },
    select: { id: true, name: true, code: true, institution: true },
  });
  if (!chapter) redirect("/portal/profile");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Activity reports"
        title="New report"
        intro={
          <p>
            Log what {chapter.name} did, when it happened and how many people
            took part. Reports feed the national analysis on the dashboard.
          </p>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="font-display text-[16px] font-bold text-navy-900">
              {chapter.name}
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-500">
              {chapter.code} · {chapter.institution}
            </p>
          </div>
          <Link
            href="/portal/reports"
            className="text-[12px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
          >
            Back to reports
          </Link>
        </div>

        <div className="mt-5">
          <ReportForm chapter={chapter} />
        </div>
      </Card>

      <VerifiedNote>
        Activity reports are part of the membership tracking the network does
        with GLANCE. They are never published publicly.
      </VerifiedNote>
    </div>
  );
}
