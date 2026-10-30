import "server-only";

import { getRedis } from "@/server/redis";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window limiter for sensitive endpoints (login, applications, resets).
 *
 * When Redis is enabled the window is shared by every server instance through
 * Upstash; when Redis is disabled or momentarily unreachable it falls back to
 * the in-memory bucket map so a service blip can never take the form down.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (redis) {
    try {
      // One key per fixed window start; simple to reason about and cheap.
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      const rk = `glance:rl:${key}:${windowStart}`;
      const count = await redis.incr(rk);
      if (count === 1) {
        await redis.pexpire(rk, windowMs);
      }
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfterSeconds:
          count > limit
            ? Math.max(1, Math.ceil((windowStart + windowMs - Date.now()) / 1000))
            : 0,
      };
    } catch {
      // Redis unreachable or still connecting — fall through to the
      // in-memory fallback.
    }
  }

  return memoryRateLimit(key, limit, windowMs);
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** Housekeeping so the in-memory fallback cannot grow without bound. */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
