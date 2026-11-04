import { beforeEach, describe, expect, it } from "vitest";
import { pruneRateLimits, rateLimit } from "@/server/rate-limit";

/**
 * The limiter protects login, password reset, applications, RSVPs and the
 * newsletter form. When Redis is absent it must still enforce the window —
 * otherwise every sensitive endpoint is open on a deployment without Redis.
 */

beforeEach(() => {
  // Keep tests isolated: unique keys per test, and no lingering Redis config.
  delete process.env.REDIS_ENABLED;
  delete process.env.REDIS_URL;
  pruneRateLimits();
});

describe("fixed-window rate limiting (in-memory fallback)", () => {
  it("allows requests up to the limit", async () => {
    const key = `test-allow-${Math.random()}`;
    for (let i = 0; i < 5; i += 1) {
      const result = await rateLimit(key, 5, 60_000);
      expect(result.ok).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it("blocks the request after the limit and reports a retry window", async () => {
    const key = `test-block-${Math.random()}`;
    for (let i = 0; i < 3; i += 1) await rateLimit(key, 3, 60_000);

    const blocked = await rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("keeps separate buckets per key", async () => {
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;

    for (let i = 0; i < 2; i += 1) await rateLimit(a, 2, 60_000);

    expect((await rateLimit(a, 2, 60_000)).ok).toBe(false);
    expect((await rateLimit(b, 2, 60_000)).ok).toBe(true);
  });

  it("starts a fresh window once the old one expires", async () => {
    const key = `test-expiry-${Math.random()}`;
    await rateLimit(key, 1, 50);
    expect((await rateLimit(key, 1, 50)).ok).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect((await rateLimit(key, 1, 50)).ok).toBe(true);
  });
});
