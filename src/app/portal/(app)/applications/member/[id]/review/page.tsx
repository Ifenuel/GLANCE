import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { auditEntry, auditMetadataDecision } from "@/server/audit";
import { JoinApplicationReviewForm } from "@/components/portal/forms";
import {
    Container,
    Card,
    SectionHeading,
    VerifiedNote,
    GLANCE
  } from "@/components/ui";

export const metadata: Metadata = {
  title: "Review membership application",
};

export default async function MembershipApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);
  const { id } = await params;
  const application = await db.joinApplication.findUnique({ where: { id } });
  if (!application) notFound();

  const entries = await auditEntry({ limit: 6 });

  return (
    <Container>
      <Link
        href="/portal/applications"
        className="text-[12.5px] font-semibold text-navy-900 hover:underline underline-offset-4 decoration-gold-400 decoration-2"
      >
        ← Back to applications
      </Link>

      <SectionHeading
        eyebrow="Network management"
        title="Review membership application"
        intro={
          <p>
            Approve or reject the application. Approved members receive an
            activation code and can set up their account in the portal.
          </p>
        }
      />

      <Card className="border-border">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white">
              <GLANCE className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy-900">{application.fullName}</p>
              <p className="text-[13.5px] text-ink-500">
                {application.institution} · {application.email}
              </p>
              <p className="text-[11.5px] font-mono text-ink-400">Application {application.id.slice(0, 8)}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] ${
            application.status === "PENDING"
              ? "bg-amber-100 text-amber-700"
              : application.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
          }`}>
            {application.status === "PENDING" ? "Pending" : application.status === "APPROVED" ? "Approved" : "Rejected"}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Contact</dt>
            <dd className="text-[13px] font-semibold text-white">
              {application.email} · {application.phone}
            </dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Category</dt>
            <dd className="text-[13px] font-semibold text-white">{application.membershipCategory}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Department</dt>
            <dd className="text-[13px] font-semibold text-white">{application.department ?? "Not set"}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Level</dt>
            <dd className="text-[13px] font-semibold text-white">{application.academicLevel ?? "Not set"}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4 sm:col-span-2">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Motivation</dt>
            <dd className="text-[13.5px] leading-6 text-ink-200">{application.motivation}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <JoinApplicationReviewForm
          application={{
            id: application.id,
            status: application.status,
            chapterCode: application.chapterCode,
          }}
        />
      </Card>

      <Card>
        <h3 className="text-base font-extrabold text-navy-900">Decisions recorded</h3>
        <div className="mt-3 space-y-2 text-[12.5px] text-ink-500">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
              <p>
                <span className="font-semibold text-navy-900">{entry.action}</span>
                {" · "}{auditMetadataDecision(entry.metadata)}
              </p>
            </div>
          ))}
          {entries.length === 0 ? (
            <p className="text-[12px] text-ink-400">No decisions yet.</p>
          ) : null}
        </div>
        <VerifiedNote>
          Only GLANCE administrators can approve or reject membership applications.
        </VerifiedNote>
      </Card>
    </Container>
  );
}
