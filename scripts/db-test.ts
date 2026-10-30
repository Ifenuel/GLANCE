/** Quick reachability + row-count check against the configured database. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const [users, chapters, profiles, invites, apps, posts] = await Promise.all([
    db.user.count(), db.chapter.count(), db.memberProfile.count(),
    db.invitation.count(), db.chapterApplication.count(), db.post.count(),
  ]);
  console.log(JSON.stringify({ users, chapters, profiles, invites, apps, posts }));
}
main().catch((e) => { console.error("DB_ERROR:", String(e.message).slice(0, 400)); process.exit(1); }).finally(() => db.$disconnect());
