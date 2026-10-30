import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { GlanceLogo } from "@/components/glance-logo";
import { SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Members",
  description: "Search and manage members across the network.",
};

const LEVEL_LABEL: Record<string, string> = {
  YEAR_1: "Y1",
  YEAR_2: "Y2",
  YEAR_3: "Y3",
  YEAR_4: "Y4",
  YEAR_5: "Y5",
  ND: "ND",
  HND: "HND",
  PGD: "PGD",
  MASTERS: "MSc",
  DOCTORATE: "PhD",
  OTHER: "Other",
};

const CATEGORY_LABEL: Record<string, string> = {
  STUDENT: "Student",
  NON_STUDENT: "Non-student",
  ALUMNI: "Alumni",
};

const PAGE_SIZE = 25;

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    level?: string;
    chapter?: string;
    page?: string;
  }>;
}) {
  const { q, category, level, chapter, page } = await searchParams;
  const viewer = await requireUser();

  const isOfficer = viewer.role === "SUPER_ADMIN" || viewer.role === "AGID_ADMIN";
  if (!isOfficer && viewer.role !== "CHAPTER_ADMIN") {
    redirect("/portal/profile");
  }

  const where: {
    status: "ACTIVE";
    chapterId?: string;
    membershipCategory?: "STUDENT" | "NON_STUDENT" | "ALUMNI";
    academicLevel?: string;
    OR?: unknown[];
  } = { status: "ACTIVE" };

  if (viewer.role === "CHAPTER_ADMIN") {
    where.chapterId = viewer.chapterId ?? "__none__";
  } else if (chapter) {
    where.chapterId = chapter;
  }
  if (category === "STUDENT" || category === "NON_STUDENT" || category === "ALUMNI") {
    where.membershipCategory = category;
  }
  if (level) where.academicLevel = level;
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { memberCode: { contains: q, mode: "insensitive" } },
      { matricNo: { contains: q, mode: "insensitive" } },
      { institution: { contains: q, mode: "insensitive" } },
      { user: { is: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const [members, total] = await Promise.all([
    db.memberProfile.findMany({
      where: where as never,
      orderBy: [{ registeredAt: "desc" }],
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        memberCode: true,
        matricNo: true,
        institution: true,
        department: true,
        academicLevel: true,
        position: true,
        isExecutive: true,
        membershipCategory: true,
        registeredAt: true,
        user: { select: { email: true, phone: true } },
        chapter: { select: { id: true, code: true, name: true } },
      },
    }),
    db.memberProfile.count({ where: where as never }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (next: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (level) params.set("level", level);
    if (chapter) params.set("chapter", chapter);
    params.set("page", String(next));
    return `/portal/members?${params.toString()}`;
  };

  const chaptersForFilter = isOfficer
    ? await db.chapter.findMany({
        orderBy: [{ institution: "asc" }],
        select: { id: true, code: true, name: true, institution: true },
      })
    : [];

  const ownChapterId = viewer.role === "CHAPTER_ADMIN" ? viewer.chapterId : null;

  // Executives by chapter for quick context on who runs each chapter.
  const breakdown = await db.memberProfile.groupBy({
    by: ["membershipCategory"],
    where: where as never,
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Network management"
          title="Members"
          intro={
            <p>
              {isOfficer
                ? "Every registered member across the network, each with a permanent GLANCE ID and digital card."
                : "Your chapter's members. Register new ones and generate their official ID cards."}
            </p>
          }
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href={ownChapterId ? `/portal/members/id-cards/${ownChapterId}` : "/portal/chapters"}
            className={`inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-[13px] font-bold text-navy-900 transition-colors hover:bg-navy-50 ${
              ownChapterId ? "" : "pointer-events-none opacity-50"
            }`}
          >
            {ownChapterId ? "Generate all ID cards" : "ID cards via chapters"}
          </Link>
          <Link
            href="/portal/members/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gold-400 px-5 text-[13px] font-bold text-navy-900 shadow-sm transition-all hover:bg-gold-500 hover:shadow-lg"
          >
            Register member
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Members here", value: total },
          { label: "This page", value: members.length },
          {
            label: "Executive positions",
            value: members.filter((m) => m.isExecutive).length,
          },
          {
            label: "Newest ID",
            value: members[0]?.memberCode ?? "—",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="lift rounded-2xl border border-line bg-white p-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-ink-400 uppercase">
              {kpi.label}
            </p>
            <p className="font-data mt-2 truncate text-[20px] font-bold text-navy-900">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {/* Filter bar */}
        <form
          action="/portal/members"
          method="get"
          className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4"
        >
          <div className="min-w-[210px] flex-1">
            <label htmlFor="q" className="text-[11.5px] font-semibold text-ink-600">
              Search
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Name, GLANCE ID, matric no, email…"
              defaultValue={q ?? ""}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
            />
          </div>
          {isOfficer ? (
            <div className="min-w-[220px]">
              <label htmlFor="chapter" className="text-[11.5px] font-semibold text-ink-600">
                Chapter
              </label>
              <select
                id="chapter"
                name="chapter"
                defaultValue={chapter ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13px] text-navy-900 focus:border-navy-500 focus:outline-none"
              >
                <option value="">All chapters</option>
                {chaptersForFilter.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label htmlFor="category" className="text-[11.5px] font-semibold text-ink-600">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category ?? ""}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13px] text-navy-900 focus:border-navy-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="STUDENT">Student</option>
              <option value="NON_STUDENT">Non-student</option>
              <option value="ALUMNI">Alumni</option>
            </select>
          </div>
          <div>
            <label htmlFor="level" className="text-[11.5px] font-semibold text-ink-600">
              Level
            </label>
            <select
              id="level"
              name="level"
              defaultValue={level ?? ""}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13px] text-navy-900 focus:border-navy-500 focus:outline-none"
            >
              <option value="">All</option>
              {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-lg bg-navy-900 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-navy-800"
          >
            Apply
          </button>
          {q || category || level || chapter ? (
            <Link
              href="/portal/members"
              className="h-10 px-4 py-2.5 text-[12.5px] font-bold text-ink-500 hover:text-navy-900"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <GlanceLogo className="h-8 opacity-60" />
            <p className="text-[15px] font-bold text-navy-900">
              {q || category || level ? "No matching members" : "No members yet"}
            </p>
            <p className="text-[12.5px] text-ink-500">
              {q || category || level
                ? "Try a different search or clear the filters."
                : "Register the first member with the gold button above."}
            </p>
            <Link
              href="/portal/members/new"
              className="mt-2 inline-flex h-10 items-center rounded-lg bg-navy-900 px-5 text-[12.5px] font-bold text-white"
            >
              Register a member
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400">
                  <th className="px-5 py-3">GLANCE ID</th>
                  <th className="py-3 pr-3">Member</th>
                  <th className="py-3 pr-3">Contact</th>
                  <th className="py-3 pr-3">Chapter</th>
                  <th className="py-3 pr-3">Academic</th>
                  <th className="py-3 pr-3">Position</th>
                  <th className="py-3 pr-3">Registered</th>
                  <th className="py-3 pr-5 text-right">Card · actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-navy-50/50"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11.5px] font-bold text-navy-800">
                        {member.memberCode}
                      </span>
                      {member.isExecutive ? (
                        <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-700">
                          Exec
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/portal/members/${member.id}`}
                        className="font-semibold text-navy-900 hover:underline decoration-gold-400 decoration-2 underline-offset-2"
                      >
                        {member.fullName}
                      </Link>
                      <p className="text-[11px] text-ink-400">
                        {member.matricNo ? `Matric ${member.matricNo}` : "No matric no"}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-[12px] text-ink-500">
                      <p className="truncate max-w-[190px]">{member.user.email}</p>
                      {member.user.phone ? (
                        <p className="truncate text-[11px]">{member.user.phone}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded-md bg-navy-950 px-2 py-0.5 font-mono text-[10.5px] font-bold text-gold-300">
                        {member.chapter?.code ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[12px] text-ink-500">
                      {member.academicLevel ? LEVEL_LABEL[member.academicLevel] : "—"}
                      {member.department ? ` · ${member.department}` : ""}
                    </td>
                    <td className="py-3 pr-3 text-[12px] text-ink-500">
                      {member.position ?? "Member"}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-ink-400">
                      {formatDate(member.registeredAt)}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <Link
                        href={`/portal/members/${member.id}/id-card`}
                        className="inline-flex h-8 items-center rounded-lg border border-line bg-white px-3 text-[11.5px] font-bold text-navy-900 transition-colors hover:bg-navy-50"
                      >
                        ID card
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE ? (
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
            <p className="text-[12px] text-ink-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Link
                href={pageHref(Math.max(1, currentPage - 1))}
                className="rounded-lg border border-line px-3 py-2 text-[12px] font-bold text-navy-900 transition-colors hover:bg-navy-50"
              >
                ← Previous
              </Link>
              <span className="px-2 py-2 text-[12px] font-bold text-ink-500">
                {currentPage} / {totalPages}
              </span>
              <Link
                href={pageHref(Math.min(totalPages, currentPage + 1))}
                className="rounded-lg border border-line px-3 py-2 text-[12px] font-bold text-navy-900 transition-colors hover:bg-navy-50"
              >
                Next →
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-line bg-white px-5 py-4">
        <h3 className="text-[13px] font-bold text-navy-900">Category breakdown</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {breakdown.map((row) => (
            <span
              key={row.membershipCategory}
              className="rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-600"
            >
              {CATEGORY_LABEL[row.membershipCategory]}:{" "}
              <span className="font-data font-bold text-navy-900">{row._count}</span>
            </span>
          ))}
          {breakdown.length === 0 ? (
            <p className="text-[12px] text-ink-500">No members in this scope yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
