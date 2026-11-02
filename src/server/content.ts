import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";

/**
 * Runs a database read and falls back to a safe value when the server is
 * unreachable, so a public page always renders instead of throwing. The
 * fallback is logged; visitors never see engine text.
 */
export async function safeQuery<T>(
  label: string,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[content] ${label} failed; serving fallback`, error);
    return fallback;
  }
}

export type PublicChapter = {
  id: string;
  code: string;
  name: string;
  institution: string;
  city: string;
  state: string;
  description: string | null;
  logoUrl: string | null;
  activatedAt: Date | null;
  memberCount: number;
};

export async function listPublicChapters(): Promise<PublicChapter[]> {
  "use cache";
  cacheTag("chapters");
  cacheLife("minutes");

  return safeQuery(
    "chapters",
    async () => {
      const chapters = await db.chapter.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ institution: "asc" }, { name: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          institution: true,
          city: true,
          state: true,
          description: true,
          logoUrl: true,
          activatedAt: true,
          _count: { select: { members: true } },
        },
      });

      return chapters.map((chapter) => ({
        id: chapter.id,
        code: chapter.code,
        name: chapter.name,
        institution: chapter.institution,
        city: chapter.city,
        state: chapter.state,
        description: chapter.description,
        logoUrl: chapter.logoUrl,
        activatedAt: chapter.activatedAt,
        memberCount: chapter._count.members,
      }));
    },
    [],
  );
}

export async function getPublicChapterByCode(
  code: string,
): Promise<PublicChapter | null> {
  "use cache";
  cacheTag("chapters", `chapter-${code}`);
  cacheLife("minutes");

  return safeQuery(
    `chapter-${code}`,
    async () => {
      const chapter = await db.chapter.findFirst({
        where: { code, status: "ACTIVE" },
        select: {
          id: true,
          code: true,
          name: true,
          institution: true,
          city: true,
          state: true,
          description: true,
          logoUrl: true,
          activatedAt: true,
          _count: { select: { members: true } },
        },
      });

      if (!chapter) return null;

      return {
        id: chapter.id,
        code: chapter.code,
        name: chapter.name,
        institution: chapter.institution,
        city: chapter.city,
        state: chapter.state,
        description: chapter.description,
        logoUrl: chapter.logoUrl,
        activatedAt: chapter.activatedAt,
        memberCount: chapter._count.members,
      };
    },
    null,
  );
}

export async function listPublishedPosts(limit = 12) {
  "use cache";
  cacheTag("posts");
  cacheLife("minutes");

  return safeQuery(
    "posts",
    () =>
      db.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          coverImageUrl: true,
          publishedAt: true,
          authorName: true,
        },
      }),
    [],
  );
}

/** Shared row shape for paginated published posts. */
type PublishedPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  authorName: string | null;
};

const POSTS_PER_PAGE = 9;

/**
 * Paged published posts for the /news page. Filtering and slicing happen in
 * the database, so the page stays fast even when hundreds of posts exist.
 */
export async function listPublishedPostsPaged(
  rawPage: number,
  category: "NEWS" | "STORY" | "ANNOUNCEMENT" | null,
) {
  "use cache";
  cacheTag("posts");
  cacheLife("minutes");

  const page = Math.min(200, Math.max(1, rawPage || 1));
  return safeQuery(
    `posts-page-${page}-${category ?? "all"}`,
    async (): Promise<{
      rows: PublishedPostRow[];
      total: number;
      page: number;
      perPage: number;
    }> => {
      const where = {
        status: "PUBLISHED" as const,
        ...(category ? { category } : {}),
      };
      const [rows, total] = await Promise.all([
        db.post.findMany({
          where,
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * POSTS_PER_PAGE,
          take: POSTS_PER_PAGE,
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            category: true,
            coverImageUrl: true,
            publishedAt: true,
            authorName: true,
          },
        }),
        db.post.count({ where }),
      ]);
      return { rows, total, page, perPage: POSTS_PER_PAGE };
    },
    { rows: [], total: 0, page: 1, perPage: POSTS_PER_PAGE },
  );
}

const PAST_EVENTS_PER_PAGE = 10;

/** Paged past events for the /events page — the list can grow indefinitely. */
export async function listPastEventsPaged(rawPage: number) {
  "use cache";
  cacheTag("events");
  cacheLife("minutes");

  const page = Math.min(200, Math.max(1, rawPage || 1));
  return safeQuery(
    `past-events-page-${page}`,
    async (): Promise<{
      rows: Awaited<ReturnType<typeof listPastEvents>>;
      total: number;
      page: number;
      perPage: number;
    }> => {
      const now = new Date();
      const where = { status: "PUBLISHED" as const, startsAt: { lt: now } };
      const [rows, total] = await Promise.all([
        db.event.findMany({
          where,
          orderBy: { startsAt: "desc" },
          skip: (page - 1) * PAST_EVENTS_PER_PAGE,
          take: PAST_EVENTS_PER_PAGE,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            startsAt: true,
            location: true,
            chapter: { select: { name: true } },
          },
        }),
        db.event.count({ where }),
      ]);
      return { rows, total, page, perPage: PAST_EVENTS_PER_PAGE };
    },
    { rows: [], total: 0, page: 1, perPage: PAST_EVENTS_PER_PAGE },
  );
}

export async function getPublishedPost(slug: string) {
  "use cache";
  cacheTag("posts", `post-${slug}`);
  cacheLife("minutes");

  return safeQuery(
    `post-${slug}`,
    () =>
      db.post.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          body: true,
          category: true,
          coverImageUrl: true,
          publishedAt: true,
          authorName: true,
        },
      }),
    null,
  );
}

export async function listUpcomingEvents(limit = 12) {
  "use cache";
  cacheTag("events");
  cacheLife("minutes");

  const now = new Date();
  return safeQuery(
    "upcoming-events",
    () =>
      db.event.findMany({
        where: { status: "PUBLISHED", startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          location: true,
          registrationUrl: true,
          coverImageUrl: true,
          videoUrl: true,
          chapter: { select: { name: true, code: true } },
        },
      }),
    [],
  );
}

export async function listPastEvents(limit = 6) {
  "use cache";
  cacheTag("events");
  cacheLife("minutes");

  const now = new Date();
  return safeQuery(
    "past-events",
    () =>
      db.event.findMany({
        where: { status: "PUBLISHED", startsAt: { lt: now } },
        orderBy: { startsAt: "desc" },
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          startsAt: true,
          location: true,
          chapter: { select: { name: true } },
        },
      }),
    [],
  );
}

export type SiteSections = {
  events: { intro: string | null; background: string | null };
  news: { intro: string | null };
};

/** The editable public sections, one row per field in the SiteContent store. */
export async function getSiteSections(): Promise<SiteSections> {
  "use cache";
  cacheTag("site-content");
  cacheLife("minutes");

  return safeQuery(
    "site-sections",
    async (): Promise<SiteSections> => {
      const rows = await db.siteContent.findMany({
        where: { key: { startsWith: "section." } },
        select: { key: true, value: true },
      });
      const byKey = new Map(rows.map((row) => [row.key, row.value]));
      return {
        events: {
          intro: byKey.get("section.events.intro") ?? null,
          background: byKey.get("section.events.background") ?? null,
        },
        news: {
          intro: byKey.get("section.news.intro") ?? null,
        },
      };
    },
    {
      events: { intro: null, background: null },
      news: { intro: null },
    },
  );
}

/**
 * Stored copy for one editable page (`page.<key>.<field>` rows), keyed by
 * field name. Missing fields are simply absent — callers fall back to the
 * built-in copy, so a page renders identically until someone edits it.
 */
export async function getPageContent(
  page: string,
): Promise<Record<string, string>> {
  "use cache";
  cacheTag("site-content");
  cacheLife("minutes");

  const prefix = `page.${page}.`;
  return safeQuery(
    `page-content:${page}`,
    async () => {
      const rows = await db.siteContent.findMany({
        where: { key: { startsWith: prefix } },
        select: { key: true, value: true },
      });
      const values: Record<string, string> = {};
      for (const row of rows) values[row.key.slice(prefix.length)] = row.value;
      return values;
    },
    {},
  );
}

/** Every stored page override, grouped by page — feeds the portal editor. */
export async function getAllPageContent(): Promise<
  Record<string, Record<string, string>>
> {
  "use cache";
  cacheTag("site-content");
  cacheLife("minutes");

  return safeQuery(
    "all-page-content",
    async () => {
      const rows = await db.siteContent.findMany({
        where: { key: { startsWith: "page." } },
        select: { key: true, value: true },
      });
      const grouped: Record<string, Record<string, string>> = {};
      for (const row of rows) {
        const [, page, ...rest] = row.key.split(".");
        if (!page || rest.length === 0) continue;
        grouped[page] ??= {};
        grouped[page][rest.join(".")] = row.value;
      }
      return grouped;
    },
    {},
  );
}

export type BannerSettings = {
  /** `banner.enabled` = "0" hides the ribbon; absent or anything else shows it. */
  enabled: boolean;
  /** Empty = automatic (the soonest upcoming published event). */
  eventId: string;
};

/** Countdown-banner controls, edited from the portal's Website content screen. */
export async function getBannerSettings(): Promise<BannerSettings> {
  "use cache";
  cacheTag("site-content");
  cacheLife("minutes");

  return safeQuery(
    "banner-settings",
    async (): Promise<BannerSettings> => {
      const rows = await db.siteContent.findMany({
        where: { key: { in: ["banner.enabled", "banner.eventId"] } },
        select: { key: true, value: true },
      });
      const byKey = new Map(rows.map((row) => [row.key, row.value]));
      return {
        enabled: byKey.get("banner.enabled") !== "0",
        eventId: byKey.get("banner.eventId") ?? "",
      };
    },
    { enabled: true, eventId: "" },
  );
}

/** Live counts from this platform's own records (never presented as GLANCE results). */
export async function platformSnapshot() {
  "use cache";
  cacheTag("chapters", "members");
  cacheLife("minutes");

  return safeQuery(
    "platform-snapshot",
    async () => {
      const [activeChapters, activeMembers, institutions, states] = await Promise.all([
        db.chapter.count({ where: { status: "ACTIVE" } }),
        db.memberProfile.count({ where: { status: "ACTIVE" } }),
        db.chapter.findMany({
          where: { status: "ACTIVE" },
          select: { institution: true },
          distinct: ["institution"],
        }),
        db.chapter.findMany({
          where: { status: "ACTIVE" },
          select: { state: true },
          distinct: ["state"],
        }),
      ]);

      return {
        activeChapters,
        activeMembers,
        institutions: institutions.length,
        states: states.length,
      };
    },
    { activeChapters: 0, activeMembers: 0, institutions: 0, states: 0 },
  );
}
