import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireUser, canAccessChapter } from "@/server/auth";
import { MemberIdCard } from "@/components/portal/member-id-card";
import { GlanceLogo } from "@/components/glance-logo";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Chapter ID cards",
  description: "Generate and download the official GLANCE ID cards for a chapter.",
};

const LEVEL_LABEL: Record<string, string> = {
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

export default async function BatchIdCardsPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const viewer = await requireUser();

  const allowed =
    viewer.role === "SUPER_ADMIN" ||
    viewer.role === "AGID_ADMIN" ||
    (viewer.role === "CHAPTER_ADMIN" && canAccessChapter(viewer, chapterId));
  if (!allowed) redirect("/portal/members");

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, name: true, code: true, institution: true },
  });
  if (!chapter) notFound();

  const members = await db.memberProfile.findMany({
    where: { chapterId: chapter.id, status: "ACTIVE" },
    orderBy: [{ isExecutive: "desc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      memberCode: true,
      institution: true,
      department: true,
      academicLevel: true,
      position: true,
      membershipCategory: true,
      gender: true,
      matricNo: true,
      avatarUrl: true,
      registeredAt: true,
    },
  });

  const origin = await (async () => {
    const list = await headers();
    const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:58063";
    const proto = list.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-600 uppercase">
            Members
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-[26px] font-extrabold tracking-[-0.02em] text-navy-900">
            <GlanceLogo className="h-9" />
            ID cards — {chapter.name}
            <span className="rounded-md bg-navy-950 px-2 py-1 font-mono text-[12px] font-bold text-gold-300">
              {chapter.code}
            </span>
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-500">
            {members.length} {members.length === 1 ? "member" : "members"} with an
            official card. Every card carries a unique QR code that verifies
            against the member record in the database.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/portal/chapters/${chapter.id}/members`}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-900 transition-colors hover:bg-navy-50"
          >
            Chapter members
          </Link>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <p className="text-[15px] font-bold text-navy-900">No active members yet</p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            Register members in this chapter first — their cards appear here
            immediately.
          </p>
          <Link
            href="/portal/members/new"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-navy-900 px-5 text-[12.5px] font-bold text-white"
          >
            Register a member
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 print:hidden">
            <p className="text-[12.5px] text-ink-500">
              Download each card as PNG, or print the whole batch as one PDF.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="space-y-3">
                <div className="text-center text-[11px] font-bold uppercase tracking-wider text-ink-400 print:hidden">
                  {member.fullName} · {formatDate(member.registeredAt)}
                </div>
                <MemberIdCard
                  member={{
                    fullName: member.fullName,
                    memberCode: member.memberCode,
                    institution: member.institution,
                    chapterName: chapter.name,
                    chapterCode: chapter.code,
                    department: member.department,
                    levelLabel: member.academicLevel
                      ? LEVEL_LABEL[member.academicLevel] ?? member.academicLevel
                      : null,
                    position: member.position,
                    categoryLabel: CATEGORY_LABEL[member.membershipCategory] ?? "Student",
                    avatarUrl: member.avatarUrl,
                    registeredLabel: formatDate(member.registeredAt),
                    matricNo: member.matricNo,
                    gender: member.gender,
                    origin,
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
