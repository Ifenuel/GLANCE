import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Authorised membership export. GLANCE administrators may export the network or
 * any single chapter; chapter administrators may export only their own
 * chapter. Everyone else is refused, and every export is audited.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chapterIdParam = searchParams.get("chapterId");

  let chapterId: string | null = null;

  if (user.role === "SUPER_ADMIN" || user.role === "AGID_ADMIN") {
    chapterId = chapterIdParam;
  } else if (user.role === "CHAPTER_ADMIN") {
    if (!user.chapterId) {
      return NextResponse.json({ error: "No chapter assigned." }, { status: 403 });
    }
    if (chapterIdParam && chapterIdParam !== user.chapterId) {
      return NextResponse.json(
        { error: "You may only export your own chapter's records." },
        { status: 403 },
      );
    }
    chapterId = user.chapterId;
  } else {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const members = await db.memberProfile.findMany({
    where: {
      status: "ACTIVE",
      ...(chapterId ? { chapterId } : {}),
    },
    orderBy: { registeredAt: "desc" },
    take: 5000,
    select: {
      memberCode: true,
      fullName: true,
      institution: true,
      department: true,
      academicLevel: true,
      membershipCategory: true,
      position: true,
      registeredAt: true,
      chapter: { select: { code: true, name: true } },
      user: { select: { email: true } },
    },
  });

  const header = [
    "Member ID",
    "Full name",
    "Email",
    "Institution",
    "Chapter code",
    "Chapter name",
    "Department",
    "Academic level",
    "Category",
    "Position",
    "Registered at",
  ];

  const rows = members.map((member) =>
    [
      member.memberCode,
      member.fullName,
      member.user.email,
      member.institution,
      member.chapter.code,
      member.chapter.name,
      member.department ?? "",
      member.academicLevel ?? "",
      member.membershipCategory,
      member.position ?? "",
      member.registeredAt.toISOString().slice(0, 10),
    ]
      .map(csvCell)
      .join(","),
  );

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "membership.export",
    entityType: chapterId ? "Chapter" : "MemberProfile",
    entityId: chapterId,
    ip: await requestIp(),
    metadata: { chapterId, count: members.length },
  });

  const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
  const filename = chapterId
    ? `glance-members-${chapterId.slice(0, 8)}.csv`
    : "glance-members-network.csv";

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
