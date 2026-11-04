import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sendTransactionalEmail, newsletterWelcomeEmail } from "@/server/email";
import { SITE_URL } from "@/lib/site";

/**
 * Confirmation link from the newsletter email.
 *
 * GET because it is a link in an email. The token is single-purpose and
 * unguessable; an unknown or already-used token simply lands the visitor on the
 * newsletter page, which explains the state instead of showing a raw error.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(new URL("/newsletter?status=invalid", request.url));
  }

  const subscriber = await db.subscriber
    .findUnique({
      where: { confirmToken: token },
      select: { id: true, email: true, status: true, unsubscribeToken: true },
    })
    .catch(() => null);

  if (!subscriber) {
    return NextResponse.redirect(new URL("/newsletter?status=invalid", request.url));
  }

  if (subscriber.status !== "CONFIRMED") {
    await db.subscriber
      .update({
        where: { id: subscriber.id },
        data: { status: "CONFIRMED", confirmedAt: new Date(), unsubscribedAt: null },
      })
      .catch(() => undefined);

    await sendTransactionalEmail(
      newsletterWelcomeEmail({
        to: subscriber.email,
        unsubscribeUrl: `${SITE_URL}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`,
      }),
    ).catch(() => undefined);
  }

  return NextResponse.redirect(new URL("/newsletter?status=confirmed", request.url));
}
