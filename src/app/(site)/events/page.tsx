import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { ClockIcon, PinIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, EmptyState, Section, SectionHeading } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { listPastEventsPaged, listUpcomingEvents } from "@/server/content";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Sessions, roundtables and campus activations published by GLANCE chapters and GLANCE.",
};

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <>
      <PageHeader
        background={pageBackgrounds.events.image}
        backgroundAlt={pageBackgrounds.events.alt}
        eyebrow="Events"
        title="Sessions, roundtables and campus activations"
        intro={
          <p>
            Events are published by chapters and the GLANCE team. Each listing
            shows the host chapter, location and date.
          </p>
        }
        actions={
          <ButtonLink href="/contact" variant="navyOutline" size="lg">
            Host an event with us
          </ButtonLink>
        }
      />

      {/* The "past events" section reads the ?page URL param, so it streams
          inside a boundary while the shell renders instantly. */}
      <Suspense fallback={<EventsSkeleton />}>
        <EventsResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EventsResults({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [upcoming, past] = await Promise.all([
    listUpcomingEvents(12),
    listPastEventsPaged(page),
  ]);
  const pastTotalPages = Math.max(1, Math.ceil(past.total / past.perPage));

  return (
    <>
      <Section>
        <Container>
          <SectionHeading eyebrow="Upcoming" title="What is coming up" />
          <div className="mt-8">
            {upcoming.length === 0 ? (
              <EmptyState
                title="No published events at the moment"
                description="When chapters and GLANCE publish events they appear here with date, venue and registration details."
                action={
                  <ButtonLink href="/contact" variant="outline" size="sm">
                    Contact the secretariat
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <li
                    key={event.id}
                    className="lift group flex h-full flex-col rounded-xl border border-line bg-white p-6 hover:border-navy-200"
                  >
                    <p className="text-[12px] font-bold tracking-[0.1em] text-gold-600 uppercase">
                      {formatDate(event.startsAt)}
                    </p>
                    <h3 className="mt-3 text-[17px] leading-snug font-bold text-navy-900">
                      {event.title}
                    </h3>
                    <p className="mt-3 text-[13.5px] leading-[1.8] text-ink-500">
                      {event.description}
                    </p>
                    <p className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-500">
                      <ClockIcon className="h-4 w-4 shrink-0 text-navy-400 transition-colors group-hover:text-gold-600" />
                      {formatDateTime(event.startsAt)}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-500">
                      <PinIcon className="h-4 w-4 shrink-0 text-navy-400 transition-colors group-hover:text-gold-600" />
                      {event.location}
                    </p>
                    {event.chapter ? (
                      <p className="mt-3 text-[12.5px] font-semibold text-navy-800">
                        Hosted by {event.chapter.name}
                      </p>
                    ) : null}
                    {event.registrationUrl ? (
                      <ButtonLink
                        href={event.registrationUrl}
                        external
                        size="sm"
                        className="mt-auto self-start !px-0"
                        withArrow={false}
                      >
                        Registration details
                      </ButtonLink>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </Section>

      {past.rows.length > 0 ? (
        <Section tone="tint">
          <Container>
            <SectionHeading eyebrow="Past events" title="Recently held" />
            <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-white">
              {past.rows.map((event) => (
                <li
                  key={event.id}
                  className="group flex flex-wrap items-center justify-between gap-3 border-l-[3px] border-transparent px-5 py-4 transition-all duration-300 hover:border-gold-400 hover:bg-navy-50/40"
                >
                  <div>
                    <p className="text-[14.5px] font-bold text-navy-900">
                      {event.title}
                    </p>
                    <p className="mt-1 text-[12.5px] text-ink-500">
                      {formatDate(event.startsAt)} · {event.location}
                    </p>
                  </div>
                  {event.chapter ? (
                    <p className="text-[12.5px] font-semibold text-navy-800">
                      {event.chapter.name}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {pastTotalPages > 1 ? (
              <nav
                aria-label="Past event pages"
                className="mt-6 flex items-center justify-between"
              >
                {page > 1 ? (
                  <Link
                    href={`/events?page=${page - 1}`}
                    className="text-xs font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                  >
                    ← Newer
                  </Link>
                ) : (
                  <span aria-hidden className="text-xs font-semibold text-ink-400" />
                )}
                <span className="text-[11.5px] text-ink-400">
                  Page {past.page} of {pastTotalPages}
                </span>
                {page < pastTotalPages ? (
                  <Link
                    href={`/events?page=${page + 1}`}
                    className="text-xs font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                  >
                    Older →
                  </Link>
                ) : (
                  <span aria-hidden className="text-xs font-semibold text-ink-400" />
                )}
              </nav>
            ) : null}
          </Container>
        </Section>
      ) : null}
    </>
  );
}

/** Quiet placeholder while the events lists stream in. */
function EventsSkeleton() {
  return (
    <Section aria-busy="true" aria-label="Loading events">
      <Container>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
