import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { removeRsvpAction } from "@/server/actions/rsvp";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Event reservations",
  description: "The guest list for a GLANCE event.",
};

const ROLES = ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"] as const;

export default async function EventRsvpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([...ROLES]);
  const { id } = await params;

  const event = await db.event
    .findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        startsAt: true,
        location: true,
        status: true,
        rsvps: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
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

  if (!event) notFound();

  const confirmed = event.rsvps.filter((rsvp) => rsvp.status === "CONFIRMED");
  // Head count is what the host actually needs for chairs and refreshments.
  const headcount = confirmed.reduce((sum, rsvp) => sum + 1 + rsvp.guests, 0);
  const cancelled = event.rsvps.length - confirmed.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-600 uppercase">
            Events
          </p>
          <h1 className="mt-2 text-[26px] leading-[1.2] font-extrabold tracking-[-0.02em] text-navy-900">
            {event.title}
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-500">
            {formatDateTime(event.startsAt)} · {event.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/api/export/rsvps?eventId=${event.id}`} variant="outline">
            Export CSV
          </ButtonLink>
          <ButtonLink href="/portal/events" variant="navyOutline">
            Back to events
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Reservations", value: confirmed.length },
          { label: "Head count (with guests)", value: headcount },
          { label: "Cancelled", value: cancelled },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-[10.5px] font-bold tracking-[0.16em] text-ink-400 uppercase">
              {item.label}
            </p>
            <p className="mt-2 font-mono text-[30px] leading-none font-extrabold text-navy-900">
              {item.value === 0 ? "—" : item.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeading eyebrow="Guest list" title="Who is coming" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11.5px] font-bold tracking-[0.1em] text-ink-400 uppercase">
                <th className="pb-3 pr-3 font-semibold text-navy-900">Name</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Email</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Phone</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Party</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Status</th>
                <th className="pb-3 font-semibold text-navy-900">Reserved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {event.rsvps.map((rsvp) => (
                <tr key={rsvp.id}>
                  <td className="py-3 pr-3 font-semibold text-navy-900">{rsvp.name}</td>
                  <td className="py-3 pr-3 text-ink-500">{rsvp.email}</td>
                  <td className="py-3 pr-3 text-ink-500">{rsvp.phone ?? "—"}</td>
                  <td className="py-3 pr-3 text-ink-500">
                    {rsvp.guests === 0 ? "Just them" : `+${rsvp.guests}`}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone={rsvp.status === "CONFIRMED" ? "active" : "neutral"}>
                      {rsvp.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11.5px] text-ink-500">
                        {formatDateTime(rsvp.createdAt)}
                      </span>
                      <form action={removeRsvpAction}>
                        <input type="hidden" name="id" value={rsvp.id} />
                        <button
                          type="submit"
                          className="text-[11.5px] font-bold text-rose-600 underline decoration-rose-300 decoration-2 underline-offset-4 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {event.rsvps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-ink-500">
                    <p className="text-base font-bold text-navy-900">No reservations yet</p>
                    <p className="text-[12.5px]">
                      Guests reserve from the public{" "}
                      <Link
                        href="/events"
                        className="font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                      >
                        events page
                      </Link>
                      .
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
