/**
 * Seed the first batch of activated chapters.
 *
 * The founder supplies these schools directly, so they are created as
 * ACTIVE chapters in the portal database and appear everywhere live data
 * is read — the chapter directory, the homepage counters, the impact page
 * and the admin dashboard.
 *
 * Safe to re-run: each chapter is keyed on its unique code, so the script
 * only creates what is missing and refreshes the activation of what is
 * already there.
 *
 * Usage: npx tsx scripts/seed-chapters.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Institution names exactly as they appear in src/lib/institutions.ts, so
 *  the chapter list, the application forms and the factsheet never disagree.
 *  Codes are explicit: theautomatic initials rule collapses
 *  "University of Ilorin, Ilorin" and "University of Ibadan, Ibadan" to the
 *  same GLN-II-001, so each school carries its own stable code. */
const SCHOOLS: Array<{
  code: string;
  name: string;
  institution: string;
  city: string;
  state: string;
}> = [
  {
    code: "GLN-OE-001",
    name: "GLANCE Club, Federal University Oye-Ekiti",
    institution: "Federal University, Oye-Ekiti",
    city: "Oye-Ekiti",
    state: "Ekiti State",
  },
  {
    code: "GLN-LCI-001",
    name: "GLANCE Club, Lead City University",
    institution: "Lead City University, Ibadan",
    city: "Ibadan",
    state: "Oyo State",
  },
  {
    code: "GLN-AAT-001",
    name: "GLANCE Club, Abiola Ajimobi Technical University",
    institution: "Abiola Ajimobi Technical University, Ibadan",
    city: "Ibadan",
    state: "Oyo State",
  },
  {
    code: "GLN-UNIL-001",
    name: "GLANCE Club, University of Ilorin",
    institution: "University of Ilorin, Ilorin",
    city: "Ilorin",
    state: "Kwara State",
  },
  {
    code: "GLN-UNN-001",
    name: "GLANCE Club, University of Nigeria",
    institution: "University of Nigeria, Nsukka",
    city: "Nsukka",
    state: "Enugu State",
  },
  {
    code: "GLN-UIB-001",
    name: "GLANCE Club, University of Ibadan",
    institution: "University of Ibadan, Ibadan",
    city: "Ibadan",
    state: "Oyo State",
  },
  {
    code: "GLN-FUL-001",
    name: "GLANCE Club, Federal University Lokoja",
    institution: "Federal University, Lokoja",
    city: "Lokoja",
    state: "Kogi State",
  },
];



async function main() {
  // An earlier run collided the Ilorin/Ibadan initials into one GLN-II-001
  // record; re-home it to the explicit Ilorin code before seeding.
  const legacyIlorin = await db.chapter.findFirst({
    where: { code: "GLN-II-001", institution: { contains: "Ilorin" } },
    select: { id: true },
  });
  if (legacyIlorin) {
    await db.chapter.update({
      where: { id: legacyIlorin.id },
      data: { code: "GLN-UNIL-001" },
    });
    console.log("Re-homed legacy GLN-II-001 to GLN-UNIL-001 (Ilorin)");
  }

  const admin = await db.user.findFirst({
    where: { role: "AGID_ADMIN", status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });
  if (!admin) {
    throw new Error("No active AGID_ADMIN found — run scripts/seed.ts first.");
  }
  console.log(`Creating ${SCHOOLS.length} chapters by ${admin.email}`);

  for (const school of SCHOOLS) {
    const code = school.code;
    const chapter = await db.chapter.upsert({
      where: { code },
      update: { status: "ACTIVE", activatedAt: new Date() },
      create: {
        code,
        name: school.name,
        institution: school.institution,
        city: school.city,
        state: school.state,
        status: "ACTIVE",
        activatedAt: new Date(),
        contactEmail: admin.email,
        description:
          "A GLANCE campus chapter: student leaders practising governance, civic engagement and leadership on their school's campus.",
        createdById: admin.id,
      },
    });
    console.log(`Activated: ${chapter.code} — ${chapter.institution}`);
  }

  const total = await db.chapter.count({ where: { status: "ACTIVE" } });
  console.log(`Active chapters in database: ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
