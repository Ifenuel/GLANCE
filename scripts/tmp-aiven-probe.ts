import { PrismaClient } from "@prisma/client";

const url = process.env.AIVEN_URL!;
const db = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const tables = await db.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  );
  console.log("table count:", tables.length);
  console.log(tables.map((t) => t.tablename).join(", "));
  if (tables.length) {
    for (const name of ["User", "Chapter", "MemberProfile", "ActivityReport"]) {
      if (tables.some((t) => t.tablename === name)) {
        const rows = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${name}"`);
        console.log(name, JSON.stringify(rows));
      }
    }
  }
}

main()
  .catch((e) => console.error("PROBE FAILED:", e.message))
  .finally(() => db.$disconnect());
