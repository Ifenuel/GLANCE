import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Guest list export for one event. Event managers only, and audited. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required." }, { status: 400 });
  }

  const event = await db.event
    .findUnique({
      where: { id: eventId },
      select: {
        title: true,
        startsAt: true,
        location: true,
        rsvps: {
          orderBy: { createdAt: "asc" },
          select: {
            name: true,
            email: true,
            phone: true,
            guests: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })
    .catch(() => null);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const header = ["Name", "Email", "Phone", "Guests", "Status", "Reserved at"];
  const rows = event.rsvps.map((rsvp) =>
    [
      rsvp.name,
      rsvp.email,
      rsvp.phone ?? "",
      rsvp.guests,
      rsvp.status,
      rsvp.createdAt.toISOString(),
    ]
      .map(csvCell)
      .join(","),
  );

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "event.rsvp.export",
    entityType: "Event",
    entityId: eventId,
    ip: await requestIp(),
    metadata: { count: event.rsvps.length },
  });

  const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
  const safeName = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="glance-rsvps-${safeName || "event"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
