/**
 * Copies the whole GLANCE database from one PostgreSQL server to another.
 *
 *   SOURCE_URL="postgres://…(old)" TARGET_URL="postgres://…(new)" npx tsx scripts/migrate-data.ts
 *
 * Every row keeps its original id, so sessions, member codes, QR links and
 * audit history stay valid after the move. The script is safe to re-run: rows
 * already present are skipped, never duplicated.
 */
import { PrismaClient } from "@prisma/client";

const sourceUrl = process.env.SOURCE_URL;
const targetUrl = process.env.TARGET_URL;

if (!sourceUrl || !targetUrl) {
  console.error("Set SOURCE_URL and TARGET_URL before running this script.");
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

type Any = Record<string, unknown>;

// Reference tables first, then people, then records that point at people.
const ORDER = [
  "academicYear",
  "chapterKind",
  "state",
  "institution",
  "chapter",
  "user",
  "memberProfile",
  "invitation",
  "session",
  "passwordReset",
  "activityReport",
  "post",
  "event",
  "contactMessage",
  "mediaAsset",
  "auditLog",
  "joinApplication",
  "chapterApplication",
] as const;

/** True when the error is "that table does not exist on this server". */
function isMissingTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2021"
  );
}

/** Reads every row, or an empty list when the older server never had the table. */
async function readAll(name: (typeof ORDER)[number]): Promise<Any[]> {
  try {
    // @ts-expect-error dynamic model access
    return (await source[name].findMany()) as Any[];
  } catch (error) {
    if (isMissingTable(error)) {
      console.log(`${name}: table does not exist on the source, skipping`);
      return [];
    }
    throw error;
  }
}

async function copyModel(name: (typeof ORDER)[number], rows: Any[]) {
  if (!rows.length) return 0;
  // @ts-expect-error dynamic model access across two generated clients
  const created = await target[name].createMany({ data: rows, skipDuplicates: true });
  return created.count;
}

async function main() {
  console.log("Reading the source database…");

  // Users reference a chapter, and chapters reference the officer who created
  // them. Insert users without the chapter link, then stitch it afterwards.
  const users = (await source.user.findMany()) as Any[];
  const chapters = (await source.chapter.findMany()) as Any[];
  const chaptersWithoutUserLink = chapters.map((chapter) => ({
    ...chapter,
    createdById: null,
  }));

  console.log(`chapters: ${chapters.length}, users: ${users.length}`);

  for (const model of ORDER) {
    const rows = await readAll(model);
    if (!rows.length) continue;
    if (model === "user") {
      const created = await copyModel(
        "user",
        rows.map((user) => ({ ...user, chapterId: null })),
      );
      console.log(`user: ${created}/${rows.length}`);
      continue;
    }
    if (model === "chapter") {
      const created = await copyModel("chapter", chaptersWithoutUserLink);
      console.log(`chapter: ${created}/${rows.length}`);
      // Restore who created each chapter now that both tables exist.
      for (const chapter of chapters) {
        if (!chapter.createdById) continue;
        await target.chapter.update({
          where: { id: chapter.id as string },
          data: { createdById: chapter.createdById as string },
        });
      }
      continue;
    }
    const created = await copyModel(model, rows);
    console.log(`${model}: ${created}/${rows.length}`);
  }

  // Now attach each user to their chapter again.
  const withChapter = users.filter((user) => user.chapterId);
  for (const user of withChapter) {
    await target.user.update({
      where: { id: user.id as string },
      data: { chapterId: user.chapterId as string },
    });
  }
  console.log(`user chapter links restored: ${withChapter.length}`);

  console.log("\nVerifying counts…");
  let mismatch = 0;
  for (const model of ORDER) {
    let from = 0;
    try {
      // @ts-expect-error dynamic model access
      from = await source[model].count();
    } catch (error) {
      if (!isMissingTable(error)) throw error;
    }
    // @ts-expect-error dynamic model access
    const to = await target[model].count();
    const ok = from === to;
    if (!ok) mismatch += 1;
    console.log(`${ok ? "ok " : "MISMATCH"} ${model}: ${from} -> ${to}`);
  }

  if (mismatch) {
    console.error(`\n${mismatch} table(s) did not match. Re-run to copy what is missing.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll tables copied and verified.");
  }
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  });
