import { NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * Cancel a reservation from the confirmation email.
 *
 * Cancelling keeps the row and its history (so the host chapter can see that a
 * guest withdrew) instead of deleting it; the same person can reserve again.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(new URL("/events?rsvp=invalid", request.url));
  }

  const updated = await db.eventRsvp
    .updateMany({
      where: { token, status: "CONFIRMED" },
      data: { status: "CANCELLED" },
    })
    .catch(() => ({ count: 0 }));

  return NextResponse.redirect(
    new URL(
      updated.count > 0 ? "/events?rsvp=cancelled" : "/events?rsvp=invalid",
      request.url,
    ),
  );
}
