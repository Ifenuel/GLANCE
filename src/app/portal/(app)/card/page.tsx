import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { MemberIdCard, type IdCardMember } from "@/components/portal/member-id-card";
import { Card, SectionHeading, VerifiedNote } from "@/components/ui";
import { academicLevelLabel, membershipLabel } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "My membership card",
  description: "Your GLANCE membership card, with the QR code that verifies it.",
};

/**
 * A member's own card. Chapter coordinators and GLANCE staff print cards from
 * the member record; this page is the member's own copy, so nobody has to ask
 * an administrator for an image of their own ID.
 */
export default async function MyCardPage() {
  const user = await requireUser();

  const member = await db.memberProfile.findUnique({
    where: { userId: user.id },
    include: { chapter: { select: { name: true, code: true } } },
  });

  if (!member || !member.chapter) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Membership"
          title="My membership card"
          intro={
            <p>
              Your card is issued once your chapter record is complete. Ask your
              chapter coordinator to register you, or finish your profile first.
            </p>
          }
        />
        <Card>
          <p className="text-[13.5px] leading-relaxed text-ink-500">
            No membership record is linked to this account yet. Once it exists,
            your card — with its verifiable GLANCE ID — appears here.
          </p>
          <Link
            href="/portal/profile"
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:bg-navy-50"
          >
            Go to my profile
          </Link>
        </Card>
      </div>
    );
  }

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
    matricNo: member.matricNo,
    origin: SITE_URL,
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Membership"
        title="My membership card"
        intro={
          <p>
            Carry it to chapter sessions and campus events. Anyone can check it
            by scanning the code on the back — or by entering your GLANCE ID on
            the public verification page.
          </p>
        }
      />

      <div className="rounded-xl border border-line bg-navy-50/40 p-5 sm:p-7">
        <MemberIdCard member={cardMember} />
      </div>

      <VerifiedNote>
        The QR code scans to a public page showing only your name, institution,
        chapter and position — never your email or phone number. Print at 100%
        scale on card stock for the correct physical size.
      </VerifiedNote>
    </div>
  );
}
