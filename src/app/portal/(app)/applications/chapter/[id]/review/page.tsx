import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { auditEntry, auditMetadataDecision } from "@/server/audit";
import {
    Container,
    Card,
    SectionHeading,
    VerifiedNote,
    GLANCE
  } from "@/components/ui";

export const metadata: Metadata = {
  title: "Review chapter application",
};

export default async function ChapterApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);
  const { id } = await params;
  const application = await db.chapterApplication.findUnique({ where: { id } });
  if (!application) notFound();

  const entries = await auditEntry({ limit: 6 });

  return (
    <Container>
      <a
        href="/portal/applications"
        className="text-[12.5px] font-semibold text-navy-900 hover:underline underline-offset-4 decoration-gold-400 decoration-2"
      >
        ← Back to applications
      </a>

      <SectionHeading
        eyebrow="Network management"
        title="Review chapter application"
        intro={
          <p>
            Check the details before approving or rejecting. Approved
            institutions receive a unique chapter code.
          </p>
        }
      />

      <Card className="border-border">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white">
            <GLANCE className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-navy-900">{application.proposedName}</p>
            <p className="text-[13.5px] text-ink-500">
              {application.institution} · {application.city}, {application.state}
            </p>
            <p className="text-[11.5px] font-mono text-ink-400">Application {application.id.slice(0, 8)}</p>
            <p className="mt-2 text-[12.5px] leading-6 text-ink-500">{application.motivation}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Contact</dt>
            <dd className="text-[13px] font-semibold text-white">{application.contactName} · {application.contactEmail}</dd>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Account status</dt>
            <dd className="text-[13px] font-semibold text-white">
              {application.status === "PENDING" ? "Pending" : application.status === "APPROVED" ? "Approved" : "Rejected"}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="flex gap-3">
        <form action={`/portal/applications/chapter/${application.id}/review`} method="post">
          <input type="hidden" name="id" value={application.id} />
          <input type="hidden" name="decision" value="approve" />
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-5 text-[13px] font-bold text-white hover:bg-navy-950">Approve</button>
        </form>
        <form action={`/portal/applications/chapter/${application.id}/review`} method="post">
          <input type="hidden" name="id" value={application.id} />
          <input type="hidden" name="decision" value="reject" />
          <button type="submit" name="decision" value="reject" className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-5 text-[13px] font-bold text-navy-700 hover:bg-navy-50">Reject</button>
        </form>
      </div>

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
          GLANCE administrators must record a decision for every chapter
          application. Pending chapters do not appear in public directories.
        </VerifiedNote>
      </Card>
    </Container>
  );
}
