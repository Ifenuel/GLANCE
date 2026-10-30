/**
 * Connectivity check for the configured PostgreSQL server.
 *
 *   npm run db:check
 *
 * Uses DATABASE_URL and prints a one-line health summary without writing
 * anything. DATABASE_URL_DIRECT is honoured when it is set, which is useful
 * when a direct connection is needed for debugging.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const direct = process.env.DATABASE_URL_DIRECT;
const url = direct ?? process.env.DATABASE_URL;

const db = new PrismaClient({
  datasources: url ? { db: { url } } : undefined,
});

async function main() {
  console.log(`Connecting to ${new URL(url ?? "").host} …`);
  const users = await db.user.count();
  const chapters = await db.chapter.count();
  const media = await db.mediaAsset.count().catch(() => -1);
  console.log(`OK: users: ${users}, chapters: ${chapters}, media: ${media}`);
}

main()
  .catch((error) => {
    console.error(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
