import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Mailing-list export. Only the roles that manage communications may take a
 * copy, only confirmed or pending rows are included unless asked otherwise, and
 * every export is audited — this is personal data leaving the platform.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const includeAll = status === "all";

  const subscribers = await db.subscriber.findMany({
    where: includeAll
      ? undefined
      : status && status !== ""
        ? { status: status as never }
        : { status: { in: ["CONFIRMED", "PENDING"] } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      email: true,
      name: true,
      status: true,
      source: true,
      createdAt: true,
      confirmedAt: true,
      unsubscribedAt: true,
    },
  });

  const header = [
    "Email",
    "Name",
    "Status",
    "Source",
    "Joined",
    "Confirmed at",
    "Unsubscribed at",
  ];

  const rows = subscribers.map((subscriber) =>
    [
      subscriber.email,
      subscriber.name ?? "",
      subscriber.status,
      subscriber.source ?? "site",
      subscriber.createdAt.toISOString().slice(0, 10),
      subscriber.confirmedAt?.toISOString().slice(0, 10) ?? "",
      subscriber.unsubscribedAt?.toISOString().slice(0, 10) ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "newsletter.export",
    entityType: "Subscriber",
    ip: await requestIp(),
    metadata: { count: subscribers.length, status: status ?? "active" },
  });

  const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="glance-subscribers.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
