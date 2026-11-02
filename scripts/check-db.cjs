const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const c = await p.chapter.count();
  const u = await p.user.count();
  const s = await p.siteContent.count();
  console.log({ chapters: c, users: u, siteContent: s });
  await p.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
