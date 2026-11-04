import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { emailDeliveryConfigured } from "@/server/email";

/**
 * The single endpoint anything external should watch.
 *
 * It actually opens the database rather than just answering 200, so a site that
 * renders its shell while every query fails is reported as degraded. No secrets
 * and no personal data are returned: only which dependency is up and how long
 * the round trip took.
 */
export async function GET() {
  const started = Date.now();

  let database: "up" | "down" = "down";
  try {
    await db.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  const healthy = database === "up";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: {
        database,
        email: emailDeliveryConfigured() ? "configured" : "not-configured",
        storage: process.env.CLOUDINARY_CLOUD_NAME ? "configured" : "not-configured",
        rateLimit: process.env.REDIS_ENABLED === "true" ? "redis" : "memory",
      },
      latencyMs: Date.now() - started,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      time: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
