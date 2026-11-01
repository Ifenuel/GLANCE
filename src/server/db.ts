import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Per-instance connection limit. Defaults to 2 because pooled Postgres
 * (Supabase/Supavisor and friends) admits a small, hard-capped number of
 * CLIENTS — session-mode poolers allow 15 — while a serverless deployment
 * runs many instances at once. A high default exhausts the pool and every
 * query starts failing with "max clients reached"; two per instance keeps
 * bursty function multiplexing well inside that budget.
 */
const connectionLimit = Math.max(
  1,
  Math.min(20, Number.parseInt(process.env.DB_CONNECTION_LIMIT ?? "2", 10) || 2),
);
const databaseUrl = process.env.DATABASE_URL;
const pooledDatabaseUrl = databaseUrl
  ? // A URL that already carries connection_limit (our serverless settings
    // recommend it) must win; never append a second, conflicting value.
    // We always make sure pgbouncer=true is present because transaction-mode
    // pooling (Supavisor port 6543 and other PgBouncer-style pools) drops
    // server-side prepared statements between queries; with the flag Prisma
    // stops preparing them and every query stays safe through the pool.
    `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}${
      connectionLimitParamPresent(databaseUrl)
        ? "pool_timeout=30"
        : `connection_limit=${connectionLimit}&pool_timeout=30`
    }
      ${pgbouncerParamPresent(databaseUrl) ? "" : "&pgbouncer=true"}`
    .replace(/\s/g, "")
  : undefined;

function pgbouncerParamPresent(url: string): boolean {
  try {
    return new URL(url).searchParams.get("pgbouncer") !== null;
  } catch {
    return /([?&])pgbouncer=/.test(url);
  }
}

/** Tag every connection with this app so the pool can be diagnosed later. */
function withApplicationName(url: string): string {
  const applicationName = "glance-prisma";
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("application_name")) {
      parsed.searchParams.set("application_name", applicationName);
      return parsed.toString();
    }
  } catch {
    // Not a parseable URL; leave it as-is.
  }
  return url;
}

function connectionLimitParamPresent(url: string): boolean {
  try {
    return new URL(url).searchParams.has("connection_limit");
  } catch {
    return /([?&])connection_limit=/.test(url);
  }
}

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(pooledDatabaseUrl
      ? {
          datasources: { db: { url: withApplicationName(pooledDatabaseUrl) } },
        }
      : {}),
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = base;
}

/**
 * Connection errors worth retrying. A hosted PostgreSQL server can drop an
 * idle connection or briefly refuse a new one; one retry turns that blip into
 * a success instead of an error on the page.
 */
function isTransient(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("ECONNRESET") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ENOTFOUND") ||
    message.includes("EHOSTUNREACH") ||
    message.includes("EAI_AGAIN") ||
    message.includes("socket hang up") ||
    message.includes("TLS handshake") ||
    message.includes("P1001") ||
    message.includes("P1002") ||
    message.includes("P1017") ||
    message.includes("P1008") ||
    message.includes("prepared statement") ||
    message.includes("too many connections") ||
    message.includes("endpoint is disabled")
  );
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Only connection-shaped failures are worth retrying; constraint
      // violations and auth errors must fail immediately.
      if (!isTransient(error) || attempt === attempts) throw error;
      // Exponential backoff (256ms → 512ms → 1024ms): a pooler that briefly
      // refuses connections is usually back within a second or two, but a
      // fixed 150ms retry can hit the same dead connection three times.
      await new Promise((resolve) => setTimeout(resolve, 256 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

/** Wraps every model delegate so reads and writes inherit the retry. */
function wrapDelegate(delegate: Record<string, unknown>): void {
  for (const key of Object.keys(delegate)) {
    const original = delegate[key];
    if (typeof original !== "function") continue;
    delegate[key] = (...args: unknown[]) =>
      withRetry(() => (original as (...a: unknown[]) => Promise<unknown>)(...args));
  }
}

try {
  const known = base as unknown as Record<string, Record<string, unknown>>;
  for (const key of Object.keys(known)) {
    const value = known[key];
    if (value && typeof value === "object" && typeof value.findMany === "function") {
      wrapDelegate(value);
    }
  }
} catch {
  // Never let wrapping itself break the client.
}

export const db = new Proxy(base, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(target);
    }
    return value;
  },
}) as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * One calm sentence for any failure a form or page should surface. The
 * database is a paid, always-on server now, so the wording never mentions
 * plans, free tiers or sleeping services.
 */
export function dbFriendlyMessage(error: unknown): string {
  if (isTransient(error)) {
    return "We couldn't complete that just now. Please try again in a moment.";
  }
  return "Something didn't go through. Please try again, or contact the GLANCE secretariat if it keeps happening.";
}

/** Quick check whether the database is reachable. Returns false on any failure. */
export async function dbIsAvailable(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
