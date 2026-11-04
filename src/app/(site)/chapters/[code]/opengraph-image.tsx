import { db } from "@/server/db";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "GLANCE chapter";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * The share card for one chapter: the chapter's own name and its institution,
 * so a student posting the link shows a real place rather than the homepage
 * logo card.
 */
export default async function ChapterShareImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const chapter = await db.chapter
    .findFirst({
      where: { code: code.toUpperCase(), status: "ACTIVE" },
      select: { name: true, institution: true, city: true, state: true },
    })
    .catch(() => null);

  return ogCard({
    eyebrow: "GLANCE Chapter",
    title: chapter?.name ?? "GLANCE Chapters",
    subtitle: chapter
      ? `${chapter.institution} · ${chapter.city}, ${chapter.state}`
      : "A network of leadership and civic engagement clubs across Nigeria.",
  });
}
