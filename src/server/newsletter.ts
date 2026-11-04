import "server-only";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import {
  emailDeliveryConfigured,
  sendTransactionalEmail,
  newsletterConfirmEmail,
} from "@/server/email";
import { SITE_URL } from "@/lib/site";
import { subscribeSchema } from "@/server/validation";

/**
 * The "keep me informed" list.
 *
 * Double opt-in is deliberate: a PENDING row is created on submit, and only the
 * click in the confirmation email turns it into CONFIRMED. That protects the
 * list from typo'd addresses and from anyone adding a person who did not ask.
 *
 * Kept as a plain server module (not a server action) because the form lives in
 * the site footer, which every page shares: a server action there changes how
 * the whole site is rendered, while a route-handler form leaves the layout
 * static and still works with JavaScript disabled.
 */

export type SubscribeOutcome =
  | "pending"
  | "pending_no_email"
  | "already"
  | "invalid"
  | "rate_limited"
  | "error";

function token() {
  return randomBytes(24).toString("base64url");
}

export async function subscribeEmail(input: {
  formData: FormData;
  ip: string | null;
}): Promise<SubscribeOutcome> {
  const parsed = subscribeSchema.safeParse({
    email: String(input.formData.get("email") ?? ""),
    name: String(input.formData.get("name") ?? ""),
    source: String(input.formData.get("source") ?? ""),
  });
  if (!parsed.success) return "invalid";

  const { email, name, source } = parsed.data;

  const existing = await db.subscriber
    .findUnique({ where: { email }, select: { id: true, status: true } })
    .catch(() => null);

  if (existing?.status === "CONFIRMED") return "already";

  const confirmToken = token();
  const unsubscribeToken = token();

  let subscriberId: string;
  if (existing) {
    // Re-subscribing after leaving, or asking for a fresh confirmation link.
    const updated = await db.subscriber
      .update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          name: name || null,
          source: source || "site",
          confirmToken,
          unsubscribeToken,
          confirmedAt: null,
          unsubscribedAt: null,
          consentAt: new Date(),
          ip: input.ip,
        },
        select: { id: true },
      })
      .catch(() => null);
    if (!updated) return "error";
    subscriberId = updated.id;
  } else {
    const created = await db.subscriber
      .create({
        data: {
          email,
          name: name || null,
          source: source || "site",
          confirmToken,
          unsubscribeToken,
          ip: input.ip,
        },
        select: { id: true },
      })
      .catch(() => null);
    if (!created) return "error";
    subscriberId = created.id;
  }

  await writeAudit({
    action: "newsletter.subscribe",
    entityType: "Subscriber",
    entityId: subscriberId,
    ip: input.ip,
    metadata: { source: source || "site", reSubscribed: Boolean(existing) },
  });

  updateTag("subscribers");

  // Honest when email is not configured yet: the address is stored pending and
  // the page says the confirmation will follow once delivery is switched on.
  if (!emailDeliveryConfigured()) return "pending_no_email";

  const sent = await sendTransactionalEmail(
    newsletterConfirmEmail({
      to: email,
      url: `${SITE_URL}/newsletter/confirm?token=${confirmToken}`,
    }),
  );

  return sent.delivered ? "pending" : "error";
}
