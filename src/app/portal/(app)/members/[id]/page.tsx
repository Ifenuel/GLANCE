import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { auditEntry } from "@/server/audit";
import {
    Card,
    CardTitle,
    GLANCE,
    VerifiedNote
  } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { MemberEditForm } from "@/components/portal/forms";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await db.memberProfile.findUnique({ where: { id }, select: { fullName: true } });
  return {
    title: member ? `${member.fullName} | member record` : "Member record",
  };
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await db.memberProfile.findUnique({
    where: { id },
    include: {
      chapter: true,
      user: { select: { email: true } },
    },
  });

  if (!member || !member.chapter) notFound();

  // Server-side scoping: only GLANCE or this chapter's administrators may view.
  const viewer = await getCurrentUser();
  const mayView =
    viewer &&
    (viewer.role === "SUPER_ADMIN" ||
      viewer.role === "AGID_ADMIN" ||
      (viewer.role === "CHAPTER_ADMIN" && viewer.chapterId === member.chapterId));
  if (!mayView) notFound();

  const entries = await auditEntry({ limit: 5 });

  return (
    <div className="space-y-8">
      <Link
        href="/portal/members"
        className="text-[12.5px] font-semibold text-navy-900 hover:underline underline-offset-4 decoration-gold-400 decoration-2"
      >
        ← Members
      </Link>

      <Card className="border-0 bg-navy-950/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white">
              <GLANCE className="h-8 w-8" />
            </div>
            <div>
              <CardTitle>{member.fullName}</CardTitle>
              <p className="text-[13.5px] text-ink-300">
                {member.institution} · {member.chapter?.name} ({member.chapter?.code})
              </p>
              <p className="font-mono text-[12px] font-semibold text-white/70">
                Member ID {member.memberCode}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4">
              <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Type</dt>
              <dd className="text-[13px] font-semibold text-white">
                {member.membershipCategory === "STUDENT"
                  ? "Student"
                  : member.membershipCategory === "NON_STUDENT"
                    ? "Non-student participant"
                    : "Alumni"}
              </dd>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Chapter</dt>
              <dd className="text-[13px] font-semibold text-white">{member.chapter?.name}</dd>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Registered</dt>
              <dd className="text-[13px] font-semibold text-white">{formatDate(member.registeredAt)}</dd>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Member record</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Full name</dt>
            <dd className="text-[13px] font-semibold text-white">{member.fullName}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Email</dt>
            <dd className="text-[13px] font-semibold text-white">{member.user.email}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Institution</dt>
            <dd className="text-[13px] font-semibold text-white">{member.institution}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Department</dt>
            <dd className="text-[13px] font-semibold text-white">{member.department ?? "Not applicable"}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Academic level</dt>
            <dd className="text-[13px] font-semibold text-white">{member.academicLevel ?? "Not applicable"}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Gender</dt>
            <dd className="text-[13px] font-semibold text-white">{member.gender}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Position</dt>
            <dd className="text-[13px] font-semibold text-white">
              {member.position ?? "Not set by administrator"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Role</dt>
            <dd className={`text-[13px] font-semibold ${member.isExecutive ? "text-emerald-600" : "text-ink-500"}`}>
              {member.isExecutive ? "Executive" : "Member"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Edit this member record</h3>
        <p className="text-[12.5px] text-ink-500">
          Assigned only to GLANCE or chapter coordinators. You cannot assign an
          official position here, that is set by the GLANCE team.
        </p>
        <div className="mt-4">
          <MemberEditForm
            member={{
              id: member.id,
              fullName: member.fullName,
              email: member.user.email,
              institution: member.institution,
              chapterId: member.chapterId,
              chapterCode: member.chapter.code,
              department: member.department,
              academicLevel: member.academicLevel,
              gender: member.gender,
              position: member.position,
              isExecutive: member.isExecutive,
              membershipCategory: member.membershipCategory,
              status: member.status,
              registeredAt: member.registeredAt.toISOString(),
            }}
            chapter={{ id: member.chapter.id, code: member.chapter.code, name: member.chapter.name }}
          />
        </div>
        <VerifiedNote>
          Member records are personal. Only edit with a legitimate administration
          reason, and never share beyond authorised administrators.
        </VerifiedNote>
      </Card>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Recent audit entries</h3>
        <dl className="mt-3 grid gap-2 text-[12.5px]">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
              <div>
                <p className="text-[12.5px] font-semibold text-navy-900">{entry.action}</p>
                <p className="text-[11.5px] text-ink-500">{entry.entityType} · {formatDate(entry.createdAt)}</p>
              </div>
            </div>
          ))}
          {entries.length === 0 ? (
            <p className="text-[12px] text-ink-400">No audit entries yet.</p>
          ) : null}
        </dl>
      </Card>
    </div>
  );
}
