"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { parseForm, type FormState } from "@/server/validation";
import { verifyUploadedAsset } from "@/server/cloudinary";

/** Folder every event-video upload must live in (relative to the upload root). */
const EVENT_VIDEO_FOLDER = "event-video";

/**
 * Upcoming-event publishing for the secretariat (GLANCE Network Officers and
 * communication managers). Events are what the public /events page renders,
 * so every write revalidates that page as well as the portal list.
 */

const youtubePatterns = [
  /youtu\.be\/([\w-]{6,})/i,
  /youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/i,
  /youtube\.com\/embed\/([\w-]{6,})/i,
  /youtube\.com\/shorts\/([\w-]{6,})/i,
];

// Not exported: "use server" files may only export async actions, and the
// public events page keeps its own copy for rendering.
function youtubeId(url: string): string | null {
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Roles allowed to publish and manage events. */
const EVENT_ROLES = ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"] as const;

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "event"}-${randomUUID().slice(0, 8)}`;
}

const eventSchema = z.object({
  title: z.string().trim().min(4, "Give the event a clear title").max(140),
  description: z.string().trim().min(10, "Describe the event in a sentence or two").max(1200),
  location: z.string().trim().min(3, "Where is it happening?").max(200),
  startsAt: z.string().min(1, "Pick a start date and time"),
  endsAt: z.string().optional().or(z.literal("")),
  registrationUrl: z.string().trim().max(600).optional().or(z.literal("")),
  videoUrl: z.string().trim().max(600).optional().or(z.literal("")),
  videoPublicId: z.string().trim().max(300).optional().or(z.literal("")),
  publish: z.string().optional(),
});

function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function createEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole([...EVENT_ROLES]);

  const parsed = parseForm(eventSchema, formData);
  if (!parsed.success) {
    return { status: "error", error: "Check the highlighted fields.", errors: parsed.errors };
  }

  const {
    title,
    description,
    location,
    startsAt,
    endsAt,
    registrationUrl,
    videoUrl: rawVideoUrl,
    videoPublicId,
    publish,
  } = parsed.data;

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return { status: "error", error: "That start date could not be read. Try again." };
  }

  let end: Date | null = null;
  if (endsAt) {
    end = new Date(endsAt);
    if (Number.isNaN(end.getTime()) || end < start) {
      return { status: "error", error: "The end time must be after the start time." };
    }
  }

  if (registrationUrl && !isSafeUrl(registrationUrl)) {
    return { status: "error", error: "The registration link must be a full https:// URL." };
  }

  // A device upload is verified against our Cloudinary account before any
  // reference is stored; a pasted video link is still only ever a YouTube one.
  let videoToStore: string | null = null;
  if (videoPublicId) {
    const verified = await verifyUploadedAsset({
      publicId: videoPublicId,
      expectedFolder: EVENT_VIDEO_FOLDER,
      kind: "video",
    });
    if (!verified) {
      return {
        status: "error",
        error: "The uploaded video could not be verified on the media server. Try again.",
      };
    }
    // Verified on the media server, so its stable secure URL is safe to store.
    videoToStore = verified.secureUrl;
  } else if (rawVideoUrl) {
    const videoId = youtubeId(rawVideoUrl);
    if (!videoId) {
      return {
        status: "error",
        error: "Paste a YouTube link or upload a video file from this device.",
      };
    }
    videoToStore = `https://www.youtube.com/watch?v=${videoId}`;
  }

  try {
    const created = await db.event.create({
      data: {
        slug: slugify(title),
        title,
        description,
        location,
        startsAt: start,
        endsAt: end,
        registrationUrl: registrationUrl || null,
        videoUrl: videoToStore,
        coverImageUrl: null,
        status: publish === "on" ? "PUBLISHED" : "DRAFT",
      },
      select: { id: true },
    });

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "event.create",
      entityType: "Event",
      entityId: created.id,
      ip: await requestIp(),
      metadata: { title, published: publish === "on" },
    });

    revalidatePath("/portal/events");
    revalidatePath("/events");

    return {
      status: "success",
      success: publish === "on" ? "Event published to the site." : "Event saved as a draft.",
    };
  } catch {
    return { status: "error", error: "That event could not be saved. Try again." };
  }
}

export async function setEventPublishedAction(formData: FormData): Promise<void> {
  const user = await requireRole([...EVENT_ROLES]);

  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  if (!id) return;

  await db.event
    .update({ where: { id }, data: { status: published ? "PUBLISHED" : "DRAFT" } })
    .catch(() => undefined);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: published ? "event.publish" : "event.unpublish",
    entityType: "Event",
    entityId: id,
    ip: await requestIp(),
  });

  revalidatePath("/portal/events");
  revalidatePath("/events");
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const user = await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.event.delete({ where: { id } }).catch(() => undefined);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "event.delete",
    entityType: "Event",
    entityId: id,
    ip: await requestIp(),
  });

  revalidatePath("/portal/events");
  revalidatePath("/events");
}
