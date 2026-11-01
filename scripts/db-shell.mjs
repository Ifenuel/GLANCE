/**
 * One-off database scripts use the same pooler safety flags the app applies in
 * src/server/db.ts: Supabase's transaction-mode pooler (port 6543) drops
 * prepared statements between queries, so standalone node scripts must ask
 * Prisma to make the same adjustment. Import with node --env-file=.env.
 */
import { PrismaClient } from "@prisma/client";

function pooledUrl() {
  const url = process.env.DATABASE_URL ?? "";
  const params = new URLSearchParams();
  params.set("connection_limit", "2");
  params.set("pool_timeout", "30");
  params.set("pgbouncer", "true");
  params.set("application_name", "glance-db-script");
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}${params.toString()}`;
}

export function makeClient() {
  return new PrismaClient({
    datasources: { db: { url: pooledUrl() } },
    log: ["error"],
  });
}
