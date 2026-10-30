import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { auditEntry } from "@/server/audit";
import { setChapterStatusAction } from "@/server/actions/admin";
import {
    Container,
    Card,
    SectionHeading,
    VerifiedNote
  } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Change status",
  description: "Change a chapter's status, activate or suspend it.",
};

export default async function ChapterStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chapter = await db.chapter.findUnique({ where: { id } });
  if (!chapter) notFound();

  // Server-side scoping: only GLANCE or this chapter's administrators may view.
  const viewer = await getCurrentUser();
  const mayView =
    viewer &&
    (viewer.role === "SUPER_ADMIN" ||
      viewer.role === "AGID_ADMIN" ||
      (viewer.role === "CHAPTER_ADMIN" && viewer.chapterId === chapter.id));
  if (!mayView) notFound();

  const memberCount = await db.memberProfile.count({
    where: { chapterId: id, status: "ACTIVE" },
  });

  const entries = await auditEntry({ limit: 8 });

  return (
    <Container>
      <Link
        href={`/portal/chapters/${id}`}
        className="text-[12.5px] font-semibold text-navy-900 hover:underline underline-offset-4 decoration-gold-400 decoration-2"
      >
        ← Back to chapter
      </Link>

      <SectionHeading
        eyebrow="Network management"
        title={`Change status: ${chapter.name}`}
        intro={
          <p>
            Activate, suspend or deactivate this chapter. Activation assigns the
            chapter a usable code for member registration.
          </p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {([
          {
            status: "ACTIVE",
            title: "Activate",
            description: "Assign the chapter code and make it official. Members can register.",
            active: chapter.status === "ACTIVE",
            activeTone: "bg-emerald-50 border-emerald-200",
            badgeTone: "bg-emerald-100",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4.5 10.5l6 6 10-12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
          {
            status: "SUSPENDED",
            title: "Suspend",
            description: "Pause the chapter. Existing records remain, but no new members can register.",
            active: chapter.status === "SUSPENDED",
            activeTone: "bg-amber-50 border-amber-200",
            badgeTone: "bg-amber-100",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6h12M8 6v12M12 6v12" strokeLinecap="round" />
              </svg>
            ),
          },
          {
            status: "DEACTIVATED",
            title: "Deactivate",
            description: "Retire the chapter. Records remain for audit.",
            active: chapter.status === "DEACTIVATED",
            activeTone: "bg-slate-50 border-slate-200",
            badgeTone: "bg-slate-100",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4.5 10.5l6 6 10-12" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.5 4.5l3 3" strokeLinecap="round" />
              </svg>
            ),
          },
        ] as const).map((option) => {
          const isCurrent = chapter.status === option.status;
          return (
            <Card
              key={option.status}
              className={`transition-colors ${
                option.active ? option.activeTone : "bg-white border-border"
              }`}
            >
              <form action={setChapterStatusAction} className="flex h-full flex-col justify-between rounded-2xl p-6">
                <input type="hidden" name="chapterId" value={chapter.id} />
                <input type="hidden" name="status" value={option.status} />
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${
                      option.active ? option.badgeTone : "bg-white border border-line"
                    }`}
                  >
                    {option.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-navy-900">{option.title}</p>
                    <p className="text-[12px] text-ink-500">
                      {memberCount} members · {chapter.institution}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-ink-500">{option.description}</p>
                <button
                  type="submit"
                  disabled={isCurrent}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-navy-900 px-4 text-[12.5px] font-bold text-white hover:bg-navy-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCurrent ? `Current status (${option.title.toLowerCase()}ed)` : option.title}
                </button>
              </form>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Current status</h3>
        <p className="text-[13px] text-ink-500">
          Chapter code: <span className="font-mono font-semibold text-navy-900">{chapter.code}</span>
        </p>
        <p className="text-[13px] text-ink-500">
          Status: <span className="font-semibold text-emerald-700">{chapter.status}</span>
        </p>
        <p className="text-[13px] text-ink-500">
          Activated: {chapter.activatedAt ? formatDate(chapter.activatedAt) : "Not yet activated"}
        </p>
        <p className="text-[13px] text-ink-500">
          Member count: {formatNumber(memberCount)}
        </p>
      </Card>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Recent audit entries</h3>
        <div className="mt-3 space-y-2 text-[12.5px] text-ink-500">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
              <p>
                <span className="font-semibold text-navy-900">{entry.action}</span>
                {" · "}{entry.entityType}
              </p>
            </div>
          ))}
          {entries.length === 0 ? (
            <p className="text-[12px] text-ink-400">No audit entries yet.</p>
          ) : null}
        </div>
        <VerifiedNote>
          Pending chapters do not appear in public directories and cannot
          register members in the official network.
        </VerifiedNote>
      </Card>
    </Container>
  );
}
