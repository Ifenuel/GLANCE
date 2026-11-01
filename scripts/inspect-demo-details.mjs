/** Inspect demo-linked posts, invitations and join applications in detail.
 *  Read-only. Run: node --env-file=.env scripts/inspect-demo-details.mjs */
import { makeClient } from "./db-shell.mjs";

const p = makeClient();
const demoUsers = [
  "cmvryw0zx0005hczs2iiganr2",
  "cmv9fdv8a000l03dqyk9m03b1",
  "cmvuxxamx0000hcl89dyeixch",
];

try {
  const posts = await p.post.findMany({
    where: { authorId: { in: demoUsers } },
    select: { id: true, title: true, slug: true, category: true, status: true, publishedAt: true },
  });
  console.log("POSTS", posts.length);
  posts.forEach((x) => console.log(" ", x.status, x.slug, "|", x.title));

  const inv = await p.invitation.findMany({
    where: {
      OR: [
        { email: { contains: "example.com" } },
        { email: { contains: "glance.test" } },
        { email: { contains: "demo.glance.org.ng" } },
      ],
    },
    select: { id: true, email: true, status: true, chapterId: true, createdById: true, role: true },
  });
  console.log("INVITATIONS", inv.length);
  inv.forEach((x) => console.log(" ", x.email, x.role, x.status, "chapter:" + (x.chapterId ?? "-")));

  const apps = await p.joinApplication.findMany({
    where: { email: { contains: "example.com" } },
    select: { id: true, email: true, fullName: true, status: true, createdAt: true },
  });
  console.log("JOINAPPS", apps.length);
  apps.forEach((x) => console.log(" ", x.email, x.fullName, x.status, x.createdAt));

  const chapterApps = await p.chapterApplication.findMany({
    where: { reviewedById: { in: demoUsers } },
    select: { id: true, institution: true, status: true, reviewedById: true, reviewedAt: true },
  });
  console.log("CHAPTERAPPS", chapterApps.length);
  chapterApps.forEach((x) => console.log(" ", x.institution, x.status, "reviewer:" + x.reviewedById));
} finally {
  await p.$disconnect();
}
