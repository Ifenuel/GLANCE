import { db } from "@/server/db";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "GLANCE article";
export const size = OG_SIZE;
export const contentType = "image/png";

const categoryLabels: Record<string, string> = {
  NEWS: "News",
  INSIGHT: "Insight",
  STORY: "Story",
  ANNOUNCEMENT: "Announcement",
};

/**
 * The share card for one article. Reads the post directly (never through the
 * cached page loader) and falls back to the generic GLANCE card if the article
 * cannot be read, so a share preview never shows an error.
 */
export default async function ArticleShareImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await db.post
    .findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { title: true, excerpt: true, category: true },
    })
    .catch(() => null);

  return ogCard({
    eyebrow: categoryLabels[post?.category ?? "NEWS"] ?? "News",
    title: post?.title ?? "GLANCE",
    subtitle: post?.excerpt,
  });
}
