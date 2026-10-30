import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { headers } from "next/headers";
import { academicLevelLabel, membershipLabel } from "@/lib/format";
import { VerifiedNote } from "@/components/ui";
import {
  MemberIdCard,
  type IdCardMember,
} from "@/components/portal/member-id-card";

export const metadata: Metadata = {
  title: "Member ID card",
  description: "Preview, download or print a GLANCE member ID card.",
};

export default async function MemberIdCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await db.memberProfile.findUnique({
    where: { id },
    include: {
      chapter: { select: { name: true, code: true } },
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

  // The QR code must scan to the public site, so build the verification URL
  // from the deployed origin rather than whatever host the portal is behind.
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const cardMember: IdCardMember = {
    fullName: member.fullName,
    memberCode: member.memberCode,
    institution: member.institution,
    chapterName: member.chapter.name,
    chapterCode: member.chapter.code,
    department: member.department,
    levelLabel: member.academicLevel ? academicLevelLabel(member.academicLevel) : null,
    position: member.position,
    categoryLabel: membershipLabel(member.membershipCategory),
    avatarUrl: member.avatarUrl,
    registeredLabel: member.registeredAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    origin,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-600 uppercase">
            Membership
          </p>
          <h1 className="mt-2 text-[26px] leading-[1.15] font-extrabold tracking-[-0.02em] text-navy-900">
            ID card: {member.fullName}
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-500">
            {member.institution} · {member.chapter.name} ({member.chapter.code})
          </p>
        </div>
        <Link
          href={`/portal/members/${member.id}`}
          className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:bg-navy-50"
        >
          ← Back to record
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-navy-50/40 p-5 sm:p-7">
        <MemberIdCard member={cardMember} />
      </div>

      <VerifiedNote>
        The QR code on the back scans to a public verification page that shows
        only this member&apos;s name, institution, chapter and position, never
        their email or phone number. Print at 100% scale on card stock for the
        correct physical size.
      </VerifiedNote>
    </div>
  );
}
