import type { Metadata } from "next";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import {
    ButtonLink,
    Card,
    GLANCE,
    SectionHeading,
    VerifiedNote
  } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { InviteForm } from "@/components/portal/forms";

export const metadata: Metadata = {
  title: "Invitations",
  description: "Issue invitations and activation codes for chapter administrators and members.",
};

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string }>;
}) {
  const { role, status } = await searchParams;
  const user = await getCurrentUser();
  const chapters =
    user?.role === "AGID_ADMIN"
      ? await db.chapter.findMany({
          where: { status: "ACTIVE" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, code: true },
        })
      : [];
  const where: Record<string, unknown> = { status: "PENDING" };
  // Chapter administrators only see invitations for their own chapter.
  if (user?.role === "CHAPTER_ADMIN") where.chapterId = user.chapterId;
  if (user && user.role !== "AGID_ADMIN" && user.role !== "CHAPTER_ADMIN") {
    where.chapterId = "__none__";
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const invitations = await db.invitation.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      chapter: { select: { id: true, code: true, name: true } },
      code: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SectionHeading
            eyebrow="Network management"
            title="Invitations & activation codes"
            intro={
              <p>
                Issue invitations or activation codes that let chapter
                administrators and members sign in and build their profiles.
              </p>
            }
          />
        </div>
        <div className="flex gap-3">
          <ButtonLink href="/portal/chapters" variant="outline">
            Back to chapters
          </ButtonLink>
          <ButtonLink href="/portal/invitations/new">Create invite</ButtonLink>
        </div>
      </div>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Invite someone</h3>
        <p className="text-[12.5px] text-ink-500">
          GLANCE and chapter coordinators can issue an invitation for a role in
          a chapter.
        </p>
        <div className="mt-4">
          <InviteForm chapters={chapters} />
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <GLANCE className="h-5 w-5 shrink-0 text-gold-600" />
          <div>
            <h3 className="text-base font-extrabold text-navy-900">How activation codes work</h3>
            <p className="text-[13px] leading-6 text-ink-500">
              An invitation generates a short code. The invitee types it into the
              portal along with a password to create their account. The code is
              single-use and expires according to the expiry date.
            </p>
          </div>
        </div>
        <VerifiedNote>
          Codes are confidential. Share them only with the person being
          invited, and never publish them anywhere public.
        </VerifiedNote>
      </Card>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">
          Pending invitations
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
                <th className="pb-3 pr-3 font-semibold text-navy-900">Invitation code</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Email</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Role</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Chapter</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Expiry</th>
                <th className="pb-3 font-semibold text-navy-900">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td className="pb-3 pr-3 font-mono text-[11.5px] font-semibold text-navy-800">
                    {inv.code}
                  </td>
                  <td className="pb-3 pr-3 font-semibold text-navy-900">{inv.email}</td>
                  <td className="pb-3 pr-3 text-ink-500">
                    {inv.role === "CHAPTER_ADMIN" ? "Chapter coordinator" : "Member"}
                  </td>
                  <td className="pb-3 pr-3 text-ink-500">{inv.chapter?.name ?? "Not set"}</td>
                  <td className="pb-3 pr-3 text-ink-500">{formatDate(inv.expiresAt)}</td>
                  <td className="pb-3 font-mono text-[11.5px] text-ink-500">{formatDate(inv.createdAt)}</td>
                </tr>
              ))}
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-ink-500">
                    <p className="text-base font-bold text-navy-900">No pending invitations</p>
                    <p className="text-[12.5px]">Use the form above to create one.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <VerifiedNote>
          Active invitations are private. Chapter coordinators see only the
          invitations assigned to their own chapter.
        </VerifiedNote>
      </Card>
    </div>
  );
}
