/**
 * Seeds the public gallery with GLANCE's approved media: the flagship YouTube
 * film, the Instagram reel, and the five event photographs.
 *
 * Idempotent: each entry is keyed by its publicId and upserted, so re-running
 * updates rather than duplicating. Photos live in /public/media and are served
 * from the site origin.
 *
 * Usage: npx tsx scripts/seed-media.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** YouTube id from https://www.youtube.com/watch?v=7QL_ywcnh7E */
const YT_ID = "7QL_ywcnh7E";
const IG_REEL = "https://www.instagram.com/reel/DY5bU84sP4e/";

const entries: Array<{
  publicId: string;
  secureUrl: string;
  kind: "IMAGE" | "VIDEO";
  provider: string;
  providerId: string | null;
  title: string;
  caption: string;
  sortOrder: number;
}> = [
  {
    publicId: "glance-youtube-flagship",
    secureUrl: `https://www.youtube.com/watch?v=${YT_ID}`,
    kind: "VIDEO",
    provider: "YOUTUBE",
    providerId: YT_ID,
    title: "The founder's word — “When they don't want you to succeed”",
    caption:
      "Seyi Adisa on why young Nigerians must move when the room is against them — the film that set the tone for GLANCE's campus sessions.",
    sortOrder: 0,
  },
  {
    publicId: "glance-instagram-reel",
    secureUrl: IG_REEL,
    kind: "VIDEO",
    provider: "LINK",
    providerId: null,
    title: "Watch: the movement on Instagram",
    caption: "Highlights from our sessions, straight from the GLANCE Instagram reel.",
    sortOrder: 1,
  },
  {
    publicId: "glance-audience-qna",
    secureUrl: "/media/glance-audience-qna.jpg",
    kind: "IMAGE",
    provider: "UPLOAD",
    providerId: null,
    title: "Questions from the floor",
    caption: "Members engage the panel during an open Q&A segment.",
    sortOrder: 2,
  },
  {
    publicId: "glance-member-speaking",
    secureUrl: "/media/glance-member-speaking.jpg",
    kind: "IMAGE",
    provider: "UPLOAD",
    providerId: null,
    title: "A member takes the floor",
    caption: "Civic dialogue in practice — every voice gets its turn.",
    sortOrder: 3,
  },
  {
    publicId: "glance-audience-applause",
    secureUrl: "/media/glance-audience-applause.jpg",
    kind: "IMAGE",
    provider: "UPLOAD",
    providerId: null,
    title: "The room responds",
    caption: "Peers celebrate a contribution during the session.",
    sortOrder: 4,
  },
  {
    publicId: "glance-panelists",
    secureUrl: "/media/glance-panelists.jpg",
    kind: "IMAGE",
    provider: "UPLOAD",
    providerId: null,
    title: "In conversation",
    caption: "Leaders and members exchange ideas between sessions.",
    sortOrder: 5,
  },
  {
    publicId: "glance-session",
    secureUrl: "/media/glance-session.jpg",
    kind: "IMAGE",
    provider: "UPLOAD",
    providerId: null,
    title: "A GLANCE session in progress",
    caption: "A member addresses the hall during a leadership session.",
    sortOrder: 6,
  },
];

async function main() {
  for (const entry of entries) {
    await db.mediaAsset.upsert({
      where: { publicId: entry.publicId },
      update: {
        secureUrl: entry.secureUrl,
        kind: entry.kind,
        provider: entry.provider,
        providerId: entry.providerId,
        title: entry.title,
        caption: entry.caption,
        sortOrder: entry.sortOrder,
        published: true,
      },
      create: {
        publicId: entry.publicId,
        secureUrl: entry.secureUrl,
        kind: entry.kind,
        provider: entry.provider,
        providerId: entry.providerId,
        title: entry.title,
        caption: entry.caption,
        sortOrder: entry.sortOrder,
        published: true,
      },
    });
    console.log(`media ready: ${entry.publicId}`);
  }
  console.log("Gallery media seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
