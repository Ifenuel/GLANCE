"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { parseForm, type FormState } from "@/server/validation";
import { isEditablePage } from "@/lib/site-pages";

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

/**
 * Saves one page's editable copy from the registry in src/lib/site-pages.ts.
 * Fields arrive as `f.<name>`; an empty value clears the row so the page
 * falls back to its built-in copy — the same contract as the sections above.
 */
export async function savePageContentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole(["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"]);

  const pageKey = String(formData.get("page") ?? "");
  const page = isEditablePage(pageKey);
  if (!page) {
    return { status: "error", error: "That page cannot be edited here." };
  }

  const values = new Map<string, string>();
  for (const field of page.fields) {
    const raw = formData.get(`f.${field.name}`);
    const value = (typeof raw === "string" ? raw : "")
      .trim()
      .slice(0, field.max ?? 1200);
    values.set(field.name, value);
  }

  try {
    await db.$transaction(
      Array.from(values, ([field, value]) => {
        const key = `page.${page.key}.${field}`;
        return value
          ? db.siteContent.upsert({
              where: { key },
              create: { key, value, updatedBy: user.id },
              update: { value, updatedBy: user.id },
            })
          : db.siteContent.deleteMany({ where: { key } });
      }),
    );

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "page_content.update",
      entityType: "SiteContent",
      entityId: null,
      ip: await requestIp(),
      metadata: {
        page: page.key,
        edited: Array.from(values)
          .filter(([, value]) => value !== "")
          .map(([field]) => field),
        cleared: Array.from(values)
          .filter(([, value]) => value === "")
          .map(([field]) => field),
      },
    });

    revalidateTag("site-content", "minutes");
    revalidatePath(page.path);

    return {
      status: "success",
      success: `${page.label} updated — it appears on the website right away.`,
    };
  } catch {
    return { status: "error", error: "The page copy could not be saved. Try again." };
  }
}

/** Show/hide the top countdown ribbon and choose which event it advertises. */
export async function saveBannerSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole(["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"]);

  const enabled = formData.get("show") === "on";
  const eventId = String(formData.get("eventId") ?? "").trim();

  if (eventId) {
    const event = await db.event.findFirst({
      where: { id: eventId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!event) {
      return {
        status: "error",
        error: "Choose an upcoming published event, or switch back to automatic.",
      };
    }
  }

  try {
    await db.$transaction([
      db.siteContent.upsert({
        where: { key: "banner.enabled" },
        create: {
          key: "banner.enabled",
          value: enabled ? "1" : "0",
          updatedBy: user.id,
        },
        update: { value: enabled ? "1" : "0", updatedBy: user.id },
      }),
      eventId
        ? db.siteContent.upsert({
            where: { key: "banner.eventId" },
            create: { key: "banner.eventId", value: eventId, updatedBy: user.id },
            update: { value: eventId, updatedBy: user.id },
          })
        : db.siteContent.deleteMany({ where: { key: "banner.eventId" } }),
    ]);

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "banner_settings.update",
      entityType: "SiteContent",
      entityId: null,
      ip: await requestIp(),
      metadata: { enabled, eventId: eventId || "automatic" },
    });

    revalidateTag("site-content", "minutes");
    // The ribbon lives in the (site) layout, so every public page re-renders.
    revalidatePath("/", "layout");

    return {
      status: "success",
      success: enabled
        ? "Countdown banner saved — it shows across the website."
        : "Countdown banner is now hidden across the website.",
    };
  } catch {
    return { status: "error", error: "The banner settings could not be saved. Try again." };
  }
}
