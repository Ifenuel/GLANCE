import type { Metadata } from "next";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { ButtonLink, Container, Card, SectionHeading, VerifiedNote, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { exportMembersCsv } from "@/server/actions/admin";

export const metadata: Metadata = {
  title: "Members",
  description: "Members of this chapter.",
};

export default async function ChapterMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chapter = await db.chapter.findUnique({ where: { id }, select: { name: true, code: true } });
  if (!chapter) return <div>Chapter not found.</div>;

  // Server-side scoping: only GLANCE or this chapter's administrators may view.
  const viewer = await getCurrentUser();
  const mayView =
    viewer &&
    (viewer.role === "SUPER_ADMIN" ||
      viewer.role === "AGID_ADMIN" ||
      (viewer.role === "CHAPTER_ADMIN" && viewer.chapterId === id));
  if (!mayView) return <div>Chapter not found.</div>;

  const members = await db.memberProfile.findMany({
    where: { chapterId: id, status: "ACTIVE" },
    orderBy: { registeredAt: "desc" },
    select: {
      id: true,
      fullName: true,
      memberCode: true,
      user: { select: { email: true } },
      institution: true,
      department: true,
      academicLevel: true,
      gender: true,
      membershipCategory: true,
      registeredAt: true,
    },
  });

  const exportUrl = await exportMembersCsv(id);

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
        title={`Members | ${chapter.name}`}
        intro={
          <p>
            {members.length} active members.
          </p>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-navy-900">
              {chapter.name} · {chapter.code}
            </p>
            <p className="text-[12.5px] text-ink-500">
              {members.length} active members
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href={exportUrl}
              download
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-[13px] font-bold text-navy-900 hover:bg-white/90"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M10 4v12m0 0l-3-3m3 3l3-3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 6h12" strokeLinecap="round" />
              </svg>
              Export CSV
            </a>
            <ButtonLink href="/portal/members" variant="outline">
              All members
            </ButtonLink>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
                <th className="pb-3 pr-4 font-semibold text-navy-900">Member ID</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Member code</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Full name</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Email</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Institution</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Department</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Level</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Gender</th>
                <th className="pb-3 pr-4 font-semibold text-navy-900">Category</th>
                <th className="pb-3 font-semibold text-navy-900">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="pb-3 pr-4 font-mono text-[12px] font-semibold text-navy-800">{member.id.slice(0, 8)}</td>
                  <td className="pb-3 pr-4 font-mono text-[11.5px] font-semibold text-navy-800">{member.memberCode}</td>
                  <td className="pb-3 pr-4 font-semibold text-navy-900">{member.fullName}</td>
                  <td className="pb-3 pr-4 text-ink-500">{member.user.email}</td>
                  <td className="pb-3 pr-4 text-ink-500">{member.institution}</td>
                  <td className="pb-3 pr-4 text-ink-500">{member.department ?? "Not set"}</td>
                  <td className="pb-3 pr-4 text-ink-500">{member.academicLevel ?? "Not set"}</td>
                  <td className="pb-3 pr-4 text-ink-500">{member.gender}</td>
                  <td className="pb-3 pr-4 text-ink-500">{member.membershipCategory}</td>
                  <td className="pb-3 font-mono text-[12px] text-ink-500">{formatDate(member.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 ? (
            <EmptyState
              title="No members yet"
              description="This chapter has not yet started accepting members."
            />
          ) : null}
        </div>
        <VerifiedNote>
          Record counts and exports are drawn from this platform&apos;s own
          database. The file contains the authorised member records for this
          chapter only. Use it for legitimate chapter administration.
        </VerifiedNote>
      </Card>
    </Container>
  );
}
