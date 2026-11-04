import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { RsvpForm } from "@/components/forms/rsvp-form";
import { ClockIcon, PinIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, EmptyState, Section, SectionHeading } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  getSiteSections,
  listPastEventsPaged,
  listUpcomingEvents,
} from "@/server/content";

/**
 * Turns a stored event video URL into something safe to embed. Only two origins
 * are ever accepted: YouTube (rewritten to a clean embed URL) and this
 * platform's own Cloudinary video uploads — anything else renders as text.
 */
function resolveEventVideo(
  videoUrl: string | null,
): { kind: "youtube"; id: string } | { kind: "file"; url: string } | null {
  if (!videoUrl) return null;

  const youtubePatterns = [
    /youtu\.be\/([\w-]{6,})/i,
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/i,
    /youtube\.com\/embed\/([\w-]{6,})/i,
    /youtube\.com\/shorts\/([\w-]{6,})/i,
  ];
  for (const pattern of youtubePatterns) {
    const match = videoUrl.match(pattern);
    if (match?.[1]) return { kind: "youtube", id: match[1] };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (
    cloudName &&
    videoUrl.startsWith(`https://res.cloudinary.com/${cloudName}/video/upload/`)
  ) {
    return { kind: "file", url: videoUrl };
  }

  return null;
}

/** The teaser itself: native <video> for uploads, a privacy-safe iframe for YouTube. */
function EventVideoTeaser({
  video,
  title,
  poster,
}: {
  video: NonNullable<ReturnType<typeof resolveEventVideo>>;
  title: string;
  poster?: string | null;
}) {
  if (video.kind === "file") {
    return (
      <video
        controls
        preload="metadata"
        poster={poster ?? undefined}
        className="aspect-video w-full rounded-lg bg-navy-950"
        src={video.url}
      />
    );
  }
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
      title={`${title} — teaser video`}
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className="aspect-video w-full rounded-lg bg-navy-950"
    />
  );
}

export const metadata: Metadata = {
  title: "Events",
  description:
    "Sessions, roundtables and campus activations published by GLANCE chapters and GLANCE.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; rsvp?: string }>;
}) {
  // The secretariat's editable intro and header photograph; nulls fall back to
  // the built-in copy and still below.
  const sections = await getSiteSections();

  return (
    <>
      <PageHeader
        background={sections.events.background ?? pageBackgrounds.events.image}
        backgroundAlt={sections.events.background ? "" : pageBackgrounds.events.alt}
        eyebrow="Events"
        title="Sessions, roundtables and campus activations"
        intro={
          <p>
            {sections.events.intro ??
              "Events are published by chapters and the GLANCE team. Each listing shows the host chapter, location and date."}
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
  searchParams: Promise<{ page?: string; rsvp?: string }>;
}) {
  const { page: pageParam, rsvp } = await searchParams;
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
          {rsvp === "cancelled" ? (
            <p
              role="status"
              className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800"
            >
              Your reservation has been cancelled. You can reserve again at any
              time.
            </p>
          ) : null}
          {rsvp === "invalid" ? (
            <p
              role="alert"
              className="mb-8 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
            >
              That cancellation link has already been used or has expired.
            </p>
          ) : null}
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
                    {resolveEventVideo(event.videoUrl) ? (
                      <div className="mb-4">
                        <EventVideoTeaser
                          video={resolveEventVideo(event.videoUrl)!}
                          title={event.title}
                          poster={event.coverImageUrl}
                        />
                      </div>
                    ) : null}
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
                    ) : (
                      <RsvpForm eventId={event.id} eventTitle={event.title} />
                    )}
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
