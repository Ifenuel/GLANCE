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
import { UpdateChapterForm } from "@/components/portal/forms";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chapter = await findChapter(id || "");
  return {
    title: chapter ? `${chapter.name} | chapter detail` : "Chapter detail",
    description: chapter
      ? `${chapter.name} | ${chapter.institution}, ${chapter.city}, ${chapter.state}. Code ${chapter.code}.`
      : undefined,
  };
}

/**
 * Chapters are linked to by their internal id, but the human-readable code
 * (e.g. GLN-AAT-001) is popular outside the dashboard — accept either so a
 * code never renders as "Chapter not found".
 */
async function findChapter(idOrCode: string) {
  return (
    (await db.chapter.findUnique({ where: { id: idOrCode } })) ??
    (await db.chapter.findUnique({
      where: { code: idOrCode.toUpperCase() },
    }))
  );
}

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chapter = await findChapter(id);

  if (!chapter) return <div>Chapter not found.</div>;

  // Server-side scoping: only GLANCE or this chapter's administrators may view.
  const viewer = await getCurrentUser();
  const mayView =
    viewer &&
    (viewer.role === "SUPER_ADMIN" ||
      viewer.role === "AGID_ADMIN" ||
      (viewer.role === "CHAPTER_ADMIN" && viewer.chapterId === chapter.id));
  if (!mayView) return <div>Chapter not found.</div>;

  const memberCounts = await db.memberProfile.count({
    where: { chapterId: chapter.id, status: "ACTIVE" },
  });

  const statusLabel =
    chapter.status === "ACTIVE"
      ? "Active"
      : chapter.status === "PENDING"
        ? "Pending approval"
        : chapter.status === "SUSPENDED"
          ? "Suspended"
          : "Deactivated";

  const entries = await auditEntry({ limit: 4 });

  return (
    <div className="space-y-8">
      <Link
        href="/portal/chapters"
        className="text-[12.5px] font-semibold text-navy-900 hover:underline underline-offset-4 decoration-gold-400 decoration-2"
      >
        ← Chapters
      </Link>

      <Card className="border-0 bg-navy-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white">
              <GLANCE className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-white">{chapter.name}</CardTitle>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  {statusLabel}
                </span>
              </div>
              <p className="text-[13.5px] text-navy-100/80">
                {chapter.institution} · {chapter.city}, {chapter.state}
              </p>
              <p className="font-mono text-[12px] font-semibold text-white/70">
                Code {chapter.code}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">Members</p>
              <dd className="text-lg font-extrabold text-white">{memberCounts}</dd>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">Institution</p>
              <dd className="text-[13px] font-semibold text-white">{chapter.institution}</dd>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">Contact</p>
              <dd className="text-[13px] font-semibold text-white">{chapter.contactEmail ?? "Not set"}</dd>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">City</p>
            <dd className="text-[13px] font-semibold text-white">{chapter.city}</dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">State</p>
            <dd className="text-[13px] font-semibold text-white">{chapter.state}</dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">Created</p>
            <dd className="text-[13px] font-semibold text-white">{formatDate(chapter.createdAt)}</dd>
          </div>
        </div>

        {chapter.description ? (
          <p className="mt-4 text-[13.5px] leading-6 text-navy-100/80">{chapter.description}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/portal/chapters/${id}/members`}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-[13px] font-bold text-navy-900 hover:bg-white/90"
          >
            View members ({memberCounts})
          </a>
          <a
            href={`/portal/chapters/${id}/status`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 px-5 text-[13px] font-bold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Change status
          </a>
          <a
            href={`/portal/chapters/${id}/invite`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 px-5 text-[13px] font-bold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Create administrator invite
          </a>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h4 className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-400">
            Recent audit entries
          </h4>
          <dl className="mt-3 grid gap-2 text-[12.5px]">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                <div>
                  <p className="text-[12.5px] font-semibold text-white">{entry.action}</p>
                  <p className="text-[11.5px] text-ink-400">{entry.entityType} · {formatDate(entry.createdAt)}</p>
                </div>
              </div>
            ))}
            {entries.length === 0 ? (
              <p className="text-[12px] text-ink-400">No audit entries yet.</p>
            ) : null}
          </dl>
        </div>
      </Card>

      <Card>
        <UpdateChapterForm
          chapter={{
            id: chapter.id,
            status: chapter.status,
            name: chapter.name,
            institution: chapter.institution,
            code: chapter.code,
            city: chapter.city,
            state: chapter.state,
            contactEmail: chapter.contactEmail,
            description: chapter.description,
            members: memberCounts,
            activatedAt: chapter.activatedAt?.toISOString() ?? null,
          }}
        />
        <VerifiedNote>
          Only the chapter coordinator and the GLANCE team can change
          status, contact details and description.
        </VerifiedNote>
      </Card>
    </div>
  );
}
