import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import {
  deleteEventAction,
  setEventPublishedAction,
} from "@/server/actions/event";
import { EventForm } from "@/components/portal/forms/event-form";
import { ActionMenu } from "@/components/portal/action-menu";
import { Badge, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Events",
  description: "Publish upcoming events to the public GLANCE events page.",
};

const EVENT_ROLES = ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"] as const;

export default async function PortalEventsPage() {
  await requireRole([...EVENT_ROLES]);

  const events = await db.event
    .findMany({
      orderBy: [{ startsAt: "desc" }],
      take: 80,
      select: {
        id: true,
        title: true,
        location: true,
        startsAt: true,
        status: true,
        videoUrl: true,
        registrationUrl: true,
        chapter: { select: { name: true } },
      },
    })
    .catch(() => []);

  const now = new Date();
  const upcoming = events.filter((event) => event.startsAt >= now);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-600 uppercase">
            Content
          </p>
          <h1 className="mt-2 text-[26px] leading-[1.2] font-extrabold tracking-[-0.02em] text-navy-900">
            Upcoming events
          </h1>
          <p className="mt-1.5 max-w-[560px] text-[13.5px] leading-[1.7] text-ink-500">
            Publish events to the public site with date, venue, registration
            link and an optional teaser video. Published events appear on the
            events page straight away.
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:bg-navy-50"
        >
          View public events
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[400px_1fr] xl:items-start">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">
            Create an event
          </h2>
          <p className="mt-1 text-[12px] leading-[1.7] text-ink-500">
            The teaser video is optional. Paste a YouTube link and it plays on
            the public page inside the event card.
          </p>
          <div className="mt-5">
            <EventForm />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-[15px] font-extrabold text-navy-900">
                Events on record
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-400">
                {events.length} total · {upcoming.length} upcoming ·{" "}
                {events.filter((event) => event.status === "PUBLISHED").length}{" "}
                published
              </p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No events yet"
                description="Create the first event using the form on the left. Published events appear on the public events page straight away."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13.5px] font-bold text-navy-900">
                        {event.title}
                      </p>
                      <Badge tone={event.status === "PUBLISHED" ? "active" : "pending"}>
                        {event.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Badge>
                      {event.videoUrl ? <Badge tone="navy">Video</Badge> : null}
                      {event.startsAt < now ? <Badge tone="neutral">Past</Badge> : null}
                    </div>
                    <p className="mt-1 text-[12px] text-ink-500">
                      {formatDateTime(event.startsAt)} · {event.location}
                      {event.chapter ? ` · ${event.chapter.name}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <form id={`event-toggle-${event.id}`} action={setEventPublishedAction}>
                      <input type="hidden" name="id" value={event.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={event.status === "PUBLISHED" ? "false" : "true"}
                      />
                    </form>
                    <form id={`event-delete-${event.id}`} action={deleteEventAction}>
                      <input type="hidden" name="id" value={event.id} />
                    </form>
                    <ActionMenu
                      label={`Actions for ${event.title}`}
                      items={[
                        {
                          kind: "submit",
                          label:
                            event.status === "PUBLISHED" ? "Unpublish" : "Publish",
                          formId: `event-toggle-${event.id}`,
                        },
                        {
                          kind: "link",
                          label: "Open public page",
                          href: `/events`,
                        },
                        {
                          kind: "submit",
                          label: "Delete",
                          formId: `event-delete-${event.id}`,
                          danger: true,
                        },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
