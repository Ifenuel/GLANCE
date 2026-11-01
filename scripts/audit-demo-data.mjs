/**
 * Read-only audit of demo/test rows. Prints counts; changes nothing.
 * Run: node --env-file=.env scripts/audit-demo-data.mjs
 */
import { makeClient } from "./db-shell.mjs";

const p = makeClient();

const demoChapterIds = ["cmvryw0gd0003hczszhxhln38"];
const demoUserIds = [
  "cmvryw0zx0005hczs2iiganr2", // member@demo.glance.org.ng
  "cmv9fdv8a000l03dqyk9m03b1", // chapteradmin@demo.glance.org.ng
  "cmvuxxamx0000hcl89dyeixch", // buffy.temp.admin@glance.test
];
const staffUserIds = [
  "cmv81dfek0000033zegl9qj52",
  "cmvp9yspx0001hcwckybkq2e6",
  "cmvp9yrv90000hcwcogqs4wob",
  "cmvryumhb0001hctw248cq7g0",
];
const everyDemoUser = [...demoUserIds, ...staffUserIds];

const chaptersNamedLikeDemo = {
  OR: [{ name: { contains: "Demo" } }, { institution: { contains: "Demo" } }],
};

const usersOnDemoTestEmails = {
  OR: [
    { email: { contains: "glance.test" } },
    { email: { contains: "demo.glance.org.ng" } },
    { email: { contains: "example.com" } },
    { email: { contains: "@test." } },
  ],
};

const invitationsToDemoTestEmails = {
  OR: [
    { email: { contains: "example.com" } },
    { email: { contains: "glance.test" } },
    { email: { contains: "demo.glance.org.ng" } },
  ],
};

const contactMessagesFromDemoTestEmails = {
  OR: [{ email: { contains: "example.com" } }, { email: { contains: "@test" } }],
};

async function count(model, label, where) {
  const n = await model.count({ where });
  console.log(label + ":", n);
  return n;
}

try {
  await count(p.memberProfile, "demoChapter profiles", { chapterId: { in: demoChapterIds } });
  await count(p.invitation, "demoChapter invitations", { chapterId: { in: demoChapterIds } });
  await count(p.event, "demoChapter events", { chapterId: { in: demoChapterIds } });
  await count(p.mediaAsset, "demoChapter media", { chapterId: { in: demoChapterIds } });
  await count(p.activityReport, "demoChapter reports", { chapterId: { in: demoChapterIds } });
  await count(p.session, "demoUser sessions", { userId: { in: demoUserIds } });
  await count(p.passwordReset, "demoUser passwordResets", { userId: { in: demoUserIds } });

  for (const id of demoUserIds) {
    const u = await p.user.findUnique({
      where: { id },
      select: { email: true, profile: { select: { id: true } } },
    });
    console.log("demoUser", id, u ? `${u.email} profile:${u.profile ? u.profile.id : "-"}` : "(gone)");
  }

  const dupPairs = [
    ["GLN-NN-001", "cmvrtm5s80004hco05k2zits2"],
    ["GLN-UNN-001", "cmvrtnr0v0004hcf04c6p38np"],
    ["GLN-L-001", "cmvrtm60n0006hco05meuvwht"],
    ["GLN-FUL-001", "cmvrtnrdy0006hcf0x93158ln"],
  ];
  for (const [code, id] of dupPairs) {
    console.log(
      code,
      "users:", await p.user.count({ where: { chapterId: id } }),
      "profiles:", await p.memberProfile.count({ where: { chapterId: id } }),
      "invitations:", await p.invitation.count({ where: { chapterId: id } }),
      "reports:", await p.activityReport.count({ where: { chapterId: id } }),
    );
  }

  await count(p.user, "users on demo/test emails", usersOnDemoTestEmails);
  await count(p.chapter, "chapters named demo", chaptersNamedLikeDemo);
  await count(p.invitation, "invitations to demo/test emails", invitationsToDemoTestEmails);
  await count(p.joinApplication, "joinApps from demo/test emails", { email: { contains: "example.com" } });
  await count(p.contactMessage, "contact msgs from demo/test emails", contactMessagesFromDemoTestEmails);
  await count(p.post, "posts authored by demo users", { authorId: { in: everyDemoUser } });
  await count(p.chapterApplication, "chapter apps reviewed by demo users", { reviewedById: { in: everyDemoUser } });
} finally {
  await p.$disconnect();
}
