import type { MetadataRoute } from "next";
import {
  listPublicChapters,
  listPublishedPosts,
} from "@/server/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/about",
    "/impact",
    "/pathway",
    "/leading-at-27",
    "/chapters",
    "/news",
    "/events",
    "/gallery",
    "/partners",
    "/join",
    "/start-a-chapter",
    "/contact",
    "/privacy",
    "/terms",
    "/portal/login",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  // Live detail pages: published chapters and news posts. If the database is
  // unreachable at build time the queries fall back safely; the sitemap just
  // ships with the static pages rather than failing the build.
  try {
    const [chapters, posts] = await Promise.all([
      listPublicChapters(),
      listPublishedPosts(),
    ]);
    for (const chapter of chapters) {
      entries.push({
        url: `${SITE_URL}/chapters/${chapter.code}`,
        lastModified: chapter.activatedAt ?? new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const post of posts) {
      const slug = (post as { slug?: string }).slug;
      if (!slug) continue;
      entries.push({
        url: `${SITE_URL}/news/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // keep the static pages; nothing here is worth blocking a deploy over
  }

  return entries;
}
