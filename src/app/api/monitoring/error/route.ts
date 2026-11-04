import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/audit";

const errorSchema = z.object({
  message: z.string().trim().min(1).max(600),
  stack: z.string().max(3500).optional().nullable(),
  path: z.string().max(300).optional().nullable(),
  source: z.enum(["site", "portal", "global", "server"]).default("site"),
});

/** First stack frame is where the error actually happened; useful for grouping. */
function fingerprintOf(source: string, message: string, stack?: string | null) {
  const frame = (stack ?? "").split("\n").find((line) => line.includes(" at ")) ?? "";
  return createHash("sha256")
    .update(`${source}|${message}|${frame.trim()}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Collects runtime errors the browser boundary catches.
 *
 * Anonymous by necessity (a visitor may hit an error while signed out), so it is
 * rate limited per address, strictly validated, and stores no cookies, user
 * agents beyond a short string, or request bodies. Repeats bump a counter
 * instead of creating rows: during an incident one page failing 500 times is
 * one line in the log.
 */
export async function POST(request: Request) {
  const ip = await requestIp();
  const guard = await rateLimit(`error-report:${ip ?? "unknown"}`, 40, 60 * 60 * 1000);
  if (!guard.ok) {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = errorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { message, stack, path, source } = parsed.data;
  const fingerprint = fingerprintOf(source, message, stack);

  try {
    await db.errorLog.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        message,
        stack: stack ?? null,
        path: path ?? null,
        source,
        userAgent: request.headers.get("user-agent")?.slice(0, 180) ?? null,
      },
      update: {
        count: { increment: 1 },
        lastSeenAt: new Date(),
        path: path ?? null,
      },
    });
  } catch {
    // Never let monitoring failures surface to the visitor.
  }

  return new NextResponse(null, { status: 204 });
}
