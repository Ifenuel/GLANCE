/**
 * One-off cleanup: removes fake demo accounts, their sessions and profiles,
 * test applications and invitations, and the demo + duplicate chapters.
 * Real university chapters and the four glance.org.ng staff accounts stay.
 * Run: node --env-file=.env scripts/remove-demo-data.mjs
 */
import { makeClient } from "./db-shell.mjs";

const p = makeClient();

// member@demo.glance.org.ng · chapteradmin@demo.glance.org.ng
const demoUserIds = ["cmvryw0zx0005hczs2iiganr2", "cmv9fdv8a000l03dqyk9m03b1"];
const demoChapterId = "cmvryw0gd0003hczszhxhln38"; // Demo University
// Later-seeded duplicates of real universities that already have a chapter:
const duplicateChapterIds = [
  "cmvrtnr0v0004hcf04c6p38np", // GLN-UNN-001 (same institution as GLN-NN-001)
  "cmvrtnrdy0006hcf0x93158ln", // GLN-FUL-001 (same institution as GLN-L-001)
];

async function assertZero(label, promise) {
  const n = await promise;
  if (n !== 0) throw new Error(`Expected no ${label} left, found ${n} — aborting`);
}

try {
  // Re-verify invariants before touching anything.
  await assertZero("duplicate-chapter users", p.user.count({ where: { chapterId: { in: duplicateChapterIds } } }));
  await assertZero("duplicate-chapter profiles", p.memberProfile.count({ where: { chapterId: { in: duplicateChapterIds } } }));
  await assertZero("duplicate-chapter invitations", p.invitation.count({ where: { chapterId: { in: duplicateChapterIds } } }));
  await assertZero("demo-chapter events", p.event.count({ where: { chapterId: demoChapterId } }));
  await assertZero("demo-chapter media", p.mediaAsset.count({ where: { chapterId: demoChapterId } }));
  await assertZero("demo-chapter reports", p.activityReport.count({ where: { chapterId: demoChapterId } }));

  // 1 · Test applications to join / public forms
  const joinApps = await p.joinApplication.deleteMany({
    where: { OR: [{ email: { contains: "example.com" } }, { email: { contains: "@test" } }] },
  });
  console.log("joinApplications deleted:", joinApps.count);

  // 2 · Demo/test invitations (none linked to a real chapter)
  const inv = await p.invitation.deleteMany({
    where: {
      OR: [
        { email: { contains: "glance.test" } },
        { email: { contains: "demo.glance.org.ng" } },
        { email: { contains: "example.com" } },
      ],
    },
  });
  console.log("invitations deleted:", inv.count);

  // 3 · Demo user sessions, then direct-owned extras, then the accounts
  await p.session.deleteMany({ where: { userId: { in: demoUserIds } } });
  const media = await p.mediaAsset.deleteMany({ where: { ownerId: { in: demoUserIds } } });
  console.log("media deleted:", media.count);
  const reports = await p.activityReport.deleteMany({ where: { reportedById: { in: demoUserIds } } });
  console.log("activityReports deleted:", reports.count);

  // 4 · Demo chapter (profile rows first), then demo users
  await p.memberProfile.deleteMany({ where: { chapterId: demoChapterId } });
  await p.memberProfile.deleteMany({ where: { userId: { in: demoUserIds } } });
  await p.chapter.deleteMany({ where: { id: { in: [demoChapterId, ...duplicateChapterIds] } } });
  const users = await p.user.deleteMany({ where: { id: { in: demoUserIds } } });
  console.log("demo users deleted:", users.count);
  console.log("chapters deleted: 3 (Demo University + 2 duplicates)");

  // Final verification
  const remainingUsers = await p.user.count();
  const remainingChapters = await p.chapter.count();
  const strayDemo = await p.user.count({
    where: {
      OR: [
        { email: { contains: "glance.test" } },
        { email: { contains: "demo.glance.org.ng" } },
        { email: { contains: "example.com" } },
      ],
    },
  });
  console.log(`REMAINING users: ${remainingUsers} · chapters: ${remainingChapters} · stray demo accounts: ${strayDemo}`);
} finally {
  await p.$disconnect();
}
