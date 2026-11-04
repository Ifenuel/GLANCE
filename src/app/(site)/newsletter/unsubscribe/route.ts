import { NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * One-click unsubscribe from every GLANCE list email.
 *
 * The row is kept (status UNSUBSCRIBED) rather than deleted so the address is
 * not accidentally re-added by a later import, and so the organisation can show
 * that consent was withdrawn.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(new URL("/newsletter?status=invalid", request.url));
  }

  const updated = await db.subscriber
    .updateMany({
      where: { unsubscribeToken: token },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    })
    .catch(() => ({ count: 0 }));

  return NextResponse.redirect(
    new URL(updated.count > 0 ? "/newsletter?status=unsubscribed" : "/newsletter?status=invalid", request.url),
  );
}
