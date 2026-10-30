import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { Card, SectionHeading, VerifiedNote } from "@/components/ui";
import { RegisterMemberForm } from "@/components/portal/forms";

export const metadata: Metadata = {
  title: "Register a member",
  description: "Add a member to your chapter and issue their invitation.",
};

export default async function RegisterMemberPage() {
  const user = await requireRole("CHAPTER_ADMIN");
  if (!user.chapterId) redirect("/portal/profile");

  const chapter = await db.chapter.findUnique({
    where: { id: user.chapterId },
    select: { name: true, code: true, institution: true },
  });
  if (!chapter) redirect("/portal/profile");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Members"
        title="Register a member"
        intro={
          <p>
            Enter the details for a new member of {chapter.name}. They receive
            an invitation to set their own password, and the secretariat
            approves the record before an ID card is issued.
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
            href="/portal/members"
            className="text-[12px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
          >
            View roster
          </Link>
        </div>

        <div className="mt-5">
          <RegisterMemberForm />
        </div>
      </Card>

      <VerifiedNote>
        The member sets their own password from the invitation email. You never
        see or choose it.
      </VerifiedNote>
    </div>
  );
}
