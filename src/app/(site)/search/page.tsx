import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button-link";

export const instant = false;
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, EmptyState, Section } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listPublishedPosts, listPublicChapters, listUpcomingEvents } from "@/server/content";

export const metadata: Metadata = {
  title: "Search",
  description: "Search GLANCE chapters, stories and events.",
};

type SearchParams = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchParams) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const [chapters, posts, events] = await Promise.all([
    listPublicChapters(),
    listPublishedPosts(24),
    listUpcomingEvents(12),
  ]);

  const matchedChapters = query
    ? chapters.filter((chapter) =>
        [chapter.name, chapter.institution, chapter.city, chapter.state, chapter.code]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : [];

  const matchedPosts = query
    ? posts.filter((post) =>
        [post.title, post.excerpt].join(" ").toLowerCase().includes(query),
      )
    : [];

  const matchedEvents = query
    ? events.filter((event) =>
        [event.title, event.description, event.location]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : [];

  const total = matchedChapters.length + matchedPosts.length + matchedEvents.length;

  return (
    <>
      <PageHeader
        background={pageBackgrounds.search.image}
        backgroundAlt={pageBackgrounds.search.alt}
        eyebrow="Search"
        title={query ? `Results for “${q}”` : "Search GLANCE"}
        intro={
          <p>
            Search activated chapters, published stories and upcoming events
            across the network.
          </p>
        }
      />

      <Section>
        <Container>
          <form action="/search" method="get" className="max-w-[560px]">
            <label htmlFor="q" className="block text-[12.5px] font-bold text-navy-900">
              Search term
            </label>
            <div className="mt-2 flex gap-3">
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q ?? ""}
                placeholder="Chapter, institution, city or story"
                className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center rounded-lg bg-navy-900 px-6 text-[13px] font-bold text-white transition-colors hover:bg-navy-950"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-10 space-y-10">
            {query ? (
              <p className="text-[13px] text-ink-500">
                {total} {total === 1 ? "result" : "results"} found
              </p>
            ) : null}

            {query && total === 0 ? (
              <EmptyState
                title="Nothing matched your search"
                description="Try a chapter code such as GLN-UI-001, an institution name, a city or a keyword from a story title."
                action={
                  <ButtonLink href="/chapters" variant="outline" size="sm">
                    Browse all chapters
                  </ButtonLink>
                }
              />
            ) : null}

            {matchedChapters.length > 0 ? (
              <div>
                <h2 className="text-[15px] font-extrabold tracking-[0.06em] text-navy-900 uppercase">
                  Chapters
                </h2>
                <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
                  {matchedChapters.map((chapter) => (
                    <li key={chapter.id} className="px-5 py-4">
                      <Link
                        href={`/chapters/${chapter.code}`}
                        className="text-[15px] font-bold text-navy-900 hover:text-navy-500"
                      >
                        {chapter.name}
                      </Link>
                      <p className="mt-1 text-[12.5px] text-ink-500">
                        {chapter.code} · {chapter.institution} · {chapter.city},{" "}
                        {chapter.state}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {matchedPosts.length > 0 ? (
              <div>
                <h2 className="text-[15px] font-extrabold tracking-[0.06em] text-navy-900 uppercase">
                  News &amp; stories
                </h2>
                <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
                  {matchedPosts.map((post) => (
                    <li key={post.id} className="px-5 py-4">
                      <Link
                        href={`/news/${post.slug}`}
                        className="text-[15px] font-bold text-navy-900 hover:text-navy-500"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 text-[12.5px] text-ink-500">
                        {formatDate(post.publishedAt)} · {post.excerpt}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {matchedEvents.length > 0 ? (
              <div>
                <h2 className="text-[15px] font-extrabold tracking-[0.06em] text-navy-900 uppercase">
                  Events
                </h2>
                <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
                  {matchedEvents.map((event) => (
                    <li key={event.id} className="px-5 py-4">
                      <p className="text-[15px] font-bold text-navy-900">
                        {event.title}
                      </p>
                      <p className="mt-1 text-[12.5px] text-ink-500">
                        {formatDate(event.startsAt)} · {event.location}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  );
}
