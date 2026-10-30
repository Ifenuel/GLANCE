import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { DirectMemberForm } from "@/components/portal/forms/direct-member-form";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Register a member",
  description: "Register a new GLANCE member with an instant unique member ID.",
};

export default async function NewMemberPage() {
  const viewer = await requireUser();

  if (!["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN"].includes(viewer.role)) {
    redirect("/portal/profile");
  }

  const isOfficer = viewer.role !== "CHAPTER_ADMIN";
  const chapters = isOfficer
    ? await db.chapter.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ institution: "asc" }, { name: "asc" }],
        select: { id: true, name: true, code: true, institution: true },
      })
    : [];

  const fixedChapterLabel = !isOfficer && viewer.chapter
    ? `${viewer.chapter.name} (${viewer.chapter.code})`
    : null;

  if (isOfficer && chapters.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Members"
          title="Register a member"
          intro={<p>There is no active chapter to place this member into yet.</p>}
        />
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="text-[15px] font-bold text-navy-900">Create a chapter first</p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            Members always belong to an active chapter with its own code.
          </p>
          <Link
            href="/portal/chapters/new"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-navy-900 px-5 text-[12.5px] font-bold text-white"
          >
            Create a chapter
          </Link>
        </div>
      </div>
    );
  }

  if (!isOfficer && !viewer.chapterId) {
    redirect("/portal/chapter");
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <SectionHeading
        eyebrow="Members"
        title="Register a member"
        intro={
          <p>
            Collect the essentials — name, email, phone, matriculation number,
            department, level and position. Each member keeps their permanent
            GLANCE member ID for life, and their digital ID card is always
            available from the member page.
          </p>
        }
      />
      <DirectMemberForm
        chapters={isOfficer ? chapters : []}
        fixedChapterLabel={fixedChapterLabel}
        idCardHref="/portal/members"
      />
    </div>
  );
}
