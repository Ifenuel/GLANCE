import "server-only";

import Redis from "ioredis";

/**
 * Shared Redis (Upstash) client.
 *
 * Enabled only when both `REDIS_ENABLED=true` and `REDIS_URL` are present, so
 * an instance without the service falls back silently to the in-memory
 * limiters. The client is created lazily on first use and reused for the
 * process lifetime; `getRedis` awaits a connected socket (capped at 3s) so the
 * first limiter call never races the TLS handshake. Upstash's TCP endpoint
 * serves TLS even when the URL is written with a plain `redis://` scheme, so
 * the TLS option is enforced for that provider and skipped for local dev URLs.
 */
let client: Redis | null = null;
let readyPromise: Promise<Redis | null> | null = null;

export async function getRedis(): Promise<Redis | null> {
  if (process.env.REDIS_ENABLED !== "true") return null;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (readyPromise) return readyPromise;
  if (client) return client;

  try {
    const isLocal = /^(redis(s)?:\/\/)(localhost|127\.0\.0\.1)/.test(url);
    const created = new Redis(url, {
      // A limiter must never stall an action on Redis latency: one retry at
      // most, then fall back to in-memory for that request.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 800)),
      ...(isLocal ? {} : { tls: {} }),
    });
    created.on("error", () => {
      // Connection-level failures degrade to the in-memory limiter; the
      // ioredis default would otherwise crash the process on a blip.
    });
    client = created;

    readyPromise = new Promise<Redis | null>((resolve) => {
      created.once("ready", () => resolve(created));
      created.once("end", () => {
        // Retry strategy gave up (e.g. network down): reset so a later call
        // can build a fresh connection instead of caching a dead client.
        if (client === created) {
          client = null;
          readyPromise = null;
        }
        created.disconnect();
        resolve(null);
      });
      // Still handshaking after 3s: hand the socket back and let the caller's
      // try/catch fall back to memory rather than blocking the request.
      setTimeout(() => resolve(created), 3000);
    });
    return readyPromise;
  } catch {
    return null;
  }
}
