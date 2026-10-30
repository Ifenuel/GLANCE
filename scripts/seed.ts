/**
 * GLANCE database seed.
 *
 * Creates the first AGID administrator (required to use the portal) and, when
 * GLANCE_SEED_DEMO=true, a demo activated chapter with one member record so
 * the portal and public directory can be explored immediately.
 *
 * Usage:
 *   npm run db:setup     (migrate + generate + seed)
 *
 * Override credentials with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

/** Default staff credentials (override with STAFF_SEED_* env vars). */
const OFFICER_EMAIL = "officer@glance.org.ng";
const COMMS_EMAIL = "comms@glance.org.ng";
const CHAPTER_ADMIN_EMAIL = "chapteradmin@demo.glance.org.ng";

async function upsertStaffUser(input: {
  email: string;
  name: string;
  role: "AGID_ADMIN" | "COMM_MANAGER" | "CHAPTER_ADMIN";
  password: string;
  chapterId?: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.user.upsert({
    where: { email: input.email },
    update: {
      role: input.role,
      status: "ACTIVE",
      chapterId: input.chapterId ?? null,
      // The seed owns these working accounts' passwords: re-running refreshes
      // them even if an earlier run created the account differently.
      passwordHash,
      // Seeded staff arrive ready to work, not blocked by the profile gate.
      profileCompletedAt: new Date(),
    },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      status: "ACTIVE",
      passwordHash,
      emailVerifiedAt: new Date(),
      profileCompletedAt: new Date(),
      chapterId: input.chapterId,
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`staff account ready: ${user.email} (${user.role})`);
  return user;
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@glance.org.ng").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "AGID_ADMIN", status: "ACTIVE" },
    create: {
      email: adminEmail,
      name: "GLANCE Administrator",
      role: "AGID_ADMIN",
      status: "ACTIVE",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true },
  });
  console.log(`AGID administrator ready: ${admin.email}`);

  /* The three working staff accounts used day-to-day:
     - The GLANCE network officer (AGID_ADMIN): creates chapters, approves
       applications and issues the chapter-administrator invitations.
     - The communications manager (COMM_MANAGER): content, media, events.
     - A chapter administrator (CHAPTER_ADMIN): scoped to the demo chapter. */
  const seedDemo = process.env.GLANCE_SEED_DEMO === "true";

  await upsertStaffUser({
    email: OFFICER_EMAIL,
    name: "GLANCE Network Officer",
    role: "AGID_ADMIN",
    password: process.env.STAFF_OFFICER_PASSWORD ?? "Glance!Officer2026",
  });

  await upsertStaffUser({
    email: COMMS_EMAIL,
    name: "GLANCE Communications",
    role: "COMM_MANAGER",
    password: process.env.STAFF_COMMS_PASSWORD ?? "Glance!Comms2026",
  });

  if (seedDemo) {
    const demoChapter = await db.chapter.findUnique({ where: { code: "GLNDEMO1" }, select: { id: true } });
    if (demoChapter) {
      await upsertStaffUser({
        email: CHAPTER_ADMIN_EMAIL,
        name: "Demo Chapter Admin",
        role: "CHAPTER_ADMIN",
        password: process.env.STAFF_CHAPTER_ADMIN_PASSWORD ?? "Glance!ChapterAdmin2026",
        chapterId: demoChapter.id,
      });
    } else {
      console.log("chapter admin skipped: demo chapter not present (set GLANCE_SEED_DEMO=true)");
    }
  }

  if (process.env.GLANCE_SEED_DEMO !== "true") return;

  const chapter = await db.chapter.upsert({
    where: { code: "GLNDEMO1" },
    update: { status: "ACTIVE" },
    create: {
      code: "GLNDEMO1",
      name: "GLANCE Club, Demo University",
      institution: "Demo University",
      city: "Ibadan",
      state: "Oyo State",
      status: "ACTIVE",
      activatedAt: new Date(),
      contactEmail: adminEmail,
      description:
        "A demonstration chapter created by the seed script. Replace it with a real approved chapter before launch.",
      createdById: admin.id,
    },
  });
  console.log(`Demo chapter ready: ${chapter.code} (${chapter.name})`);

  const memberEmail = "member@demo.glance.org.ng";
  const memberUser = await db.user.upsert({
    where: { email: memberEmail },
    update: {},
    create: {
      email: memberEmail,
      name: "Demo Member",
      role: "MEMBER",
      status: "ACTIVE",
      chapterId: chapter.id,
      emailVerifiedAt: new Date(),
    },
  });

  await db.memberProfile.upsert({
    where: { userId: memberUser.id },
    update: {},
    create: {
      userId: memberUser.id,
      fullName: "Demo Member",
      memberCode: "GLN-DEMO-000001",
      institution: chapter.institution,
      chapterId: chapter.id,
      department: "Political Science",
      academicLevel: "YEAR_2",
      gender: "PREFER_NOT_TO_SAY",
      membershipCategory: "STUDENT",
      status: "ACTIVE",
    },
  });
  console.log(`Demo member ready: ${memberEmail} (GLN-DEMO-000001)`);

  const inviteCode = "GLNDEMO2";
  await db.invitation.upsert({
    where: { code: inviteCode },
    update: {},
    create: {
      code: inviteCode,
      tokenHash: createHash("sha256")
        .update(`${inviteCode}.${memberEmail}`)
        .digest("hex"),
      email: memberEmail,
      role: "MEMBER",
      chapterId: chapter.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  });
  console.log(`Demo invitation ready: ${inviteCode}`);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
