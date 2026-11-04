"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";

const SUBSCRIBER_ROLES = ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"] as const;

/**
 * Secretariat control over the mailing list.
 *
 * Confirming is only ever the visitor's job (via the emailed link), so this
 * action exists for the other direction: removing an address on request or
 * restoring one that left by mistake. The row is never deleted, so consent
 * history survives.
 */
export async function setSubscriberStatusAction(formData: FormData): Promise<void> {
  const user = await requireRole([...SUBSCRIBER_ROLES]);

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "UNSUBSCRIBED" && status !== "CONFIRMED")) return;

  await db.subscriber
    .update({
      where: { id },
      data: {
        status,
        unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null,
        confirmedAt: status === "CONFIRMED" ? new Date() : null,
      },
    })
    .catch(() => undefined);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: status === "UNSUBSCRIBED" ? "newsletter.remove" : "newsletter.restore",
    entityType: "Subscriber",
    entityId: id,
    ip: await requestIp(),
  });

  revalidatePath("/portal/subscribers");
}
