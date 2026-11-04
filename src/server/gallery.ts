import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";

export type GalleryItem = {
  id: string;
  kind: "IMAGE" | "VIDEO";
  url: string;
  providerId: string | null;
  title: string;
  caption: string | null;
};

/**
 * Published gallery entries, ready for the public site. Returns an empty list
 * rather than throwing when the database is unreachable, so the gallery page
 * degrades to an empty state instead of a 500.
 */
export async function listPublishedMedia(): Promise<GalleryItem[]> {
  "use cache";
  cacheTag("gallery");
  cacheLife("minutes");
  try {
    const rows = await db.mediaAsset.findMany({
      where: {
        published: true,
        // Avatars and chapter logos live in Cloudinary too (every upload
        // lands in this table), but they are personal/administration media,
        // never public gallery content. Exclude those folders explicitly so
        // a profile photo can never surface on the public site.
        NOT: [
          { publicId: { startsWith: "glance/member-avatar/" } },
          { publicId: { startsWith: "glance/chapter-logo/" } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        kind: true,
        secureUrl: true,
        providerId: true,
        publicId: true,
        title: true,
        caption: true,
      },
    });

    // Never show the same film twice: entries can be seeded and also added
    // from the portal, so collapse duplicates by provider id / source URL.
    const seen = new Set<string>();
    const items: GalleryItem[] = [];
    for (const row of rows) {
      const item: GalleryItem = {
        id: row.id,
        kind: row.kind === "VIDEO" ? "VIDEO" : "IMAGE",
        url: row.secureUrl,
        providerId: row.providerId,
        title: row.title ?? "GLANCE",
        caption: row.caption,
      };
      const key = item.kind === "VIDEO"
        ? `video:${item.providerId ?? item.url.trim().toLowerCase()}`
        : `image:${item.url.trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}
