"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { parseForm, type FormState } from "@/server/validation";

/**
 * Editable public site sections (intros and header photographs for the events
 * and news pages). Values live in the SiteContent key/value store; an empty
 * value means "use the built-in default again" and removes the stored row.
 */

/** Hidden + visible fields, all submitted together on every save. */
const sectionSchema = z.object({
  eventsIntro: z.string().trim().max(600, "Keep the intro under 600 characters"),
  eventsBackground: z.string().trim().max(600),
  newsIntro: z.string().trim().max(600, "Keep the intro under 600 characters"),
});

const FIELD_TO_KEY = {
  eventsIntro: "section.events.intro",
  eventsBackground: "section.events.background",
  newsIntro: "section.news.intro",
} as const;

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveSiteSectionsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole(["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"]);

  const parsed = parseForm(sectionSchema, formData);
  if (!parsed.success) {
    return { status: "error", error: "Check the highlighted fields.", errors: parsed.errors };
  }

  const { eventsIntro, eventsBackground, newsIntro } = parsed.data;

  if (eventsBackground && !isHttpsUrl(eventsBackground)) {
    return { status: "error", error: "The events header image must be an https:// URL." };
  }

  const values = {
    eventsIntro,
    eventsBackground,
    newsIntro,
  } as const;

  try {
    // Rejected uploads and cleared fields become "back to the built-in copy":
    // an empty value removes the row instead of writing an empty string.
    await db.$transaction(
      (Object.entries(values) as [keyof typeof FIELD_TO_KEY, string][]).map(
        ([field, value]) => {
          const key = FIELD_TO_KEY[field];
          return value
            ? db.siteContent.upsert({
                where: { key },
                create: { key, value, updatedBy: user.id },
                update: { value, updatedBy: user.id },
              })
            : db.siteContent.deleteMany({ where: { key } });
        },
      ),
    );

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "site_content.update",
      entityType: "SiteContent",
      entityId: null,
      ip: await requestIp(),
      metadata: {
        touched: Object.entries(values)
          .filter(([, value]) => value !== "")
          .map(([field]) => field),
        cleared: Object.entries(values)
          .filter(([, value]) => value === "")
          .map(([field]) => field),
      },
    });

    revalidateTag("site-content", "minutes");
    revalidatePath("/events");
    revalidatePath("/news");

    return { status: "success", success: "Site sections updated on the website." };
  } catch {
    return { status: "error", error: "The sections could not be saved. Try again." };
  }
}
