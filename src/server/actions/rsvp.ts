"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { requestIp, writeAudit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { emailDeliveryConfigured, rsvpConfirmedEmail, sendTransactionalEmail } from "@/server/email";
import { SITE_URL } from "@/lib/site";
import { formatDateTime } from "@/lib/format";
import { parseForm, rsvpSchema, type FormState } from "@/server/validation";

/**
 * Public RSVP to a published event.
 *
 * The event is re-read on the server so a visitor cannot reserve a place at a
 * draft, an unpublished or an already-finished event by posting an id. One row
 * per email per event: repeating an RSVP updates it rather than duplicating the
 * guest on the host chapter's list.
 */
export async function submitRsvpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await rateLimit(`rsvp:${ip ?? "unknown"}`, 10, 60 * 60 * 1000);
  if (!guard.ok) {
    return {
      status: "error",
      error: `Too many reservations from this network. Try again in ${Math.ceil(
        guard.retryAfterSeconds / 60,
      )} minutes.`,
      reason: "rate_limited",
    };
  }

  const parsed = parseForm(rsvpSchema, formData);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Check the highlighted fields.",
      errors: parsed.errors,
      reason: "invalid_fields",
    };
  }

  const { eventId, name, email, phone, guests } = parsed.data;

  const event = await db.event
    .findFirst({
      where: { id: eventId, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        location: true,
      },
    })
    .catch(() => null);

  if (!event) {
    return { status: "error", error: "That event is not open for reservations." };
  }

  if (event.startsAt.getTime() < Date.now()) {
    return {
      status: "error",
      error: "This event has already taken place. See upcoming events for what is next.",
    };
  }

  const existing = await db.eventRsvp.findUnique({
    where: { eventId_email: { eventId: event.id, email } },
    select: { id: true, status: true },
  });

  const token = randomBytes(20).toString("base64url");

  let reference: string;
  if (existing) {
    const updated = await db.eventRsvp.update({
      where: { id: existing.id },
      data: { name, phone: phone || null, guests, status: "CONFIRMED", token, ip },
      select: { id: true },
    });
    reference = updated.id.slice(-8).toUpperCase();
  } else {
    const created = await db.eventRsvp
      .create({
        data: {
          eventId: event.id,
          name,
          email,
          phone: phone || null,
          guests,
          token,
          ip,
        },
        select: { id: true },
      })
      .catch(() => null);

    if (!created) {
      return { status: "error", error: "That reservation could not be saved. Try again." };
    }
    reference = created.id.slice(-8).toUpperCase();
  }

  await writeAudit({
    action: existing ? "event.rsvp.update" : "event.rsvp.create",
    entityType: "EventRsvp",
    entityId: event.id,
    ip,
    metadata: { eventId: event.id, guests, repeated: Boolean(existing) },
  });

  if (emailDeliveryConfigured()) {
    await sendTransactionalEmail(
      rsvpConfirmedEmail({
        to: email,
        name,
        eventTitle: event.title,
        when: formatDateTime(event.startsAt),
        where: event.location,
        cancelUrl: `${SITE_URL}/events/rsvp/cancel?token=${token}`,
      }),
    );
  }

  revalidatePath("/events");
  revalidatePath("/portal/events");

  return {
    status: "success",
    success: emailDeliveryConfigured()
      ? "Your place is reserved — a confirmation email is on its way."
      : "Your place is reserved.",
    result: { reference },
  };
}

const RSVP_ROLES = ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"] as const;

/** Secretariat removal of a guest row (duplicate, test entry, or a request to
 * be forgotten). Chapter hosts read the list; only the secretariat edits it. */
export async function removeRsvpAction(formData: FormData): Promise<void> {
  const user = await requireRole([...RSVP_ROLES]);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const removed = await db.eventRsvp
    .delete({ where: { id }, select: { eventId: true } })
    .catch(() => null);
  if (!removed) return;

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "event.rsvp.delete",
    entityType: "EventRsvp",
    entityId: id,
    ip: await requestIp(),
    metadata: { eventId: removed.eventId },
  });

  revalidatePath("/portal/events");
  revalidatePath(`/portal/events/${removed.eventId}/rsvps`);
}
