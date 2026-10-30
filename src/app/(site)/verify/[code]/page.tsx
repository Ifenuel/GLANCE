import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { GlanceMark } from "@/components/glance-logo";
import { formatDate, academicLevelLabel } from "@/lib/format";
import { safeQuery } from "@/server/content";

// A scanned card is checked against live records, so this route renders per
// request rather than being prerendered at build time.
export const instant = false;

export const metadata: Metadata = {
  title: "Verify a GLANCE member",
  description: "Confirm a GLANCE membership code.",
};

/**
 * Public landing page for a scanned GLANCE ID card.
 *
 * The QR code on every card encodes /verify/<member code>. This page proves
 * the code is real and shows only what a verifier needs: the person's name,
 * institution, chapter and position. No email, phone number or internal
 * record id is ever published here.
 */
export default async function VerifyMemberPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const memberCode = decodeURIComponent(code).trim().toUpperCase();

  const member = await safeQuery(
    "verifyMember",
    () =>
      db.memberProfile.findFirst({
        where: { memberCode },
        select: {
          fullName: true,
          memberCode: true,
          institution: true,
          department: true,
          academicLevel: true,
          position: true,
          membershipCategory: true,
          status: true,
          registeredAt: true,
          chapter: { select: { name: true, code: true } },
        },
      }),
    null,
  );

  if (!member) notFound();

  const isActive = member.status === "ACTIVE";

  return (
    <section className="bg-navy-50/60 py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[520px] px-5">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_70px_-45px_rgba(5,42,92,0.5)]">
          {/* ------------------------------------------------------ header */}
          <div className="navy-wash flex items-center gap-4 px-6 py-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <GlanceMark tone="light" height={30} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-400 uppercase">
                GLANCE member verification
              </p>
              <h1 className="mt-1 text-[19px] leading-tight font-extrabold text-white">
                {isActive ? "Verified member" : "Record not active"}
              </h1>
            </div>
          </div>

          {/* -------------------------------------------------------- body */}
          <div className="px-6 py-6">
            <p className="text-[10.5px] font-bold tracking-[0.14em] text-ink-400 uppercase">
              Member
            </p>
            <p className="mt-1.5 text-[22px] leading-tight font-extrabold text-navy-900">
              {member.fullName}
            </p>

            <dl className="mt-5 grid gap-3">
              <Row label="Member code">
                <span className="font-mono font-bold tracking-[0.06em] text-navy-900">
                  {member.memberCode}
                </span>
              </Row>
              <Row label="Institution">{member.institution}</Row>
              <Row label="Chapter">
                {member.chapter.name} ({member.chapter.code})
              </Row>
              {member.department ? <Row label="Department">{member.department}</Row> : null}
              {member.academicLevel ? (
                <Row label="Level">{academicLevelLabel(member.academicLevel)}</Row>
              ) : null}
              <Row label="Position">
                {member.position ??
                  (member.membershipCategory === "STUDENT" ? "Student member" : "Member")}
              </Row>
              <Row label="Member since">{formatDate(member.registeredAt)}</Row>
              <Row label="Status">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                    isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {isActive ? "Active member" : member.status.toLowerCase()}
                </span>
              </Row>
            </dl>

            <p className="mt-6 rounded-lg border border-line bg-navy-50/60 px-4 py-3 text-[12px] leading-[1.7] text-ink-500">
              This record was confirmed against the official GLANCE network
              register. Member personal details beyond what is shown here are
              private.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-ink-400">
          Not the code you expected? Check the card or contact your
          chapter&apos;s coordinators. ·{" "}
          <Link
            href="/"
            className="font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
          >
            theglanceproject
          </Link>
        </p>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-line px-4 py-3">
      <dt className="text-[11.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">
        {label}
      </dt>
      <dd className="text-right text-[13px] font-semibold text-navy-900">{children}</dd>
    </div>
  );
}
