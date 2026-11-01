import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import insightAudience from "@/assets/chapter-audience.jpg";
import insightCheer from "@/assets/chapter-cheer.jpg";
import insightLecture from "@/assets/chapter-lecture.jpg";
import { Container } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listPublishedPostsPaged } from "@/server/content";

export const metadata: Metadata = {
  title: "News & Updates | GLANCE",
  description: "Stay informed with our latest stories, events, and updates across all chapters.",
};

const SAMPLE_POSTS = [
  {
    id: "summit-2025",
    title: "GLANCE Nigerian Leadership Summit 2025",
    category: "Events",
    date: "Apr 25, 2025",
    excerpt: "Annual gathering of student leaders and chapter executives discussing governance, civic policy, and grassroots transformation.",
    image: insightLecture,
  },
  {
    id: "futa-launch",
    title: "New Chapter Launched at FUTA",
    category: "News",
    date: "Apr 18, 2025",
    excerpt: "Federal University of Technology Akure becomes the newest accredited GLANCE chapter with over 120 founding members.",
    image: insightAudience,
  },
  {
    id: "oyo-outreach",
    title: "Community Outreach in Oyo State",
    category: "News",
    date: "Apr 04, 2025",
    excerpt: "GLANCE fellows embark on civic sensitization and voter awareness initiatives in local secondary schools and trade hubs.",
    image: insightCheer,
  },
  {
    id: "fellowship-apps",
    title: "Applications Open for 2025 Fellowship",
    category: "Announcements",
    date: "Mar 15, 2025",
    excerpt: "Undergraduates with passion for civic governance can now apply for the 30-week intensive GLANCE leadership program.",
    image: insightLecture,
  },
];

const TAB_CATEGORIES: Record<string, "NEWS" | "STORY" | "ANNOUNCEMENT" | null> = {
  all: null,
  news: "NEWS",
  stories: "STORY",
  announcements: "ANNOUNCEMENT",
};

/** What a news card may hold: published rows from the database, or the
    sample fallback posts while nothing is published yet. */
type NewsCard = {
  id: string;
  slug?: string;
  title: string;
  category?: string;
  date?: string;
  excerpt?: string | null;
  image?: string | StaticImageData | null;
  coverImageUrl?: string | null;
  publishedAt?: Date | null;
  createdAt?: Date | string | null;
  content?: string | null;
};

export default function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  return (
    <div className="bg-white min-h-screen py-12 lg:py-16">
      <Container>
        {/* Header matching board 04 — static shell, no URL data awaited here. */}
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-gold-600">
            Insights & Press
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-navy-950 sm:text-4xl">
            Latest News
          </h1>
          <p className="mt-2 text-xs text-ink-500">
            Stay informed with our latest stories, events, and announcements from across our national footprint.
          </p>
        </div>

        {/* The filter tabs, grid and pagination read the URL, so they stream
            inside a boundary: the page shell renders instantly on navigation. */}
        <Suspense fallback={<NewsGridSkeleton />}>
          <NewsResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

async function NewsResults({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { tab = "all", page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const category = TAB_CATEGORIES[tab] ?? null;

  const result = await listPublishedPostsPaged(page, category);
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  // Sample posts are only a fallback while nothing is published yet.
  const displayPosts =
    result.rows.length === 0 && result.total === 0 && !category && page === 1
      ? SAMPLE_POSTS
      : result.rows;

  const filteredPosts = displayPosts;

  return (
    <>
      {/* Filter Tabs matching board 04 */}
      <div className="mb-10 flex flex-wrap gap-2 border-b border-line pb-4">
        {[
          { id: "all", label: "All" },
          { id: "news", label: "News" },
          { id: "stories", label: "Impact stories" },
          { id: "announcements", label: "Announcements" },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/news?tab=${t.id}`}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              tab === t.id
                ? "bg-navy-950 text-gold-400"
                : "bg-gray-100 text-ink-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Posts Grid matching board 04 layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {filteredPosts.map((post: NewsCard) => (
          <article
            key={post.id}
            className="lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm sm:flex-row hover:border-navy-200"
          >
            <div className="relative h-48 shrink-0 overflow-hidden bg-navy-100 sm:h-auto sm:w-48">
              <Image
                src={post.image || post.coverImageUrl || insightLecture}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-50 bg-gradient-to-r from-gold-400 to-gold-300 transition-transform duration-500 group-hover:scale-x-100"
              />
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gold-50 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-600">
                    {post.category || "News"}
                  </span>
                  <span className="text-[11px] text-ink-400">
                    {typeof post.date === "string" ? post.date : formatDate(post.publishedAt || post.createdAt)}
                  </span>
                </div>

                <h2 className="mt-2 text-base font-bold text-navy-950 leading-snug">
                  <Link href={`/news/${post.slug || post.id}`} className="hover:text-gold-600 transition-colors">
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-2 line-clamp-2 text-xs text-ink-500 leading-relaxed">
                  {post.excerpt || post.content || "Read the latest update from GLANCE Nigeria."}
                </p>
              </div>

              <div className="mt-4 border-t border-line/60 pt-3">
                <Link
                  href={`/news/${post.slug || post.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 transition-all group-hover:gap-2.5 hover:text-gold-600"
                >
                  Read Story
                  <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && displayPosts.length > 0 ? (
        <nav
          aria-label="News pages"
          className="mt-10 flex items-center justify-between border-t border-line pt-6"
        >
          {page > 1 ? (
            <Link
              href={`/news?tab=${tab}&page=${page - 1}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
            >
              ← Newer posts
            </Link>
          ) : (
            <span aria-hidden className="text-xs font-semibold text-ink-400" />
          )}
          <span className="text-[11.5px] text-ink-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/news?tab=${tab}&page=${page + 1}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
            >
              Older posts →
            </Link>
          ) : (
            <span aria-hidden className="text-xs font-semibold text-ink-400" />
          )}
        </nav>
      ) : null}
    </>
  );
}

/** Quiet placeholder shown while the streaming Article list resolves. */
function NewsGridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading stories">
      <div className="mb-10 flex flex-wrap gap-2 border-b border-line pb-4">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-8 w-24 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-white shadow-sm sm:flex-row"
          >
            <div className="h-48 w-full animate-pulse bg-navy-100 sm:h-auto sm:w-48" />
            <div className="flex-1 space-y-3 p-5">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
