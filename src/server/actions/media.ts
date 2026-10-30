"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { parseForm, type FormState } from "@/server/validation";

/**
 * Gallery moderation. Every published asset is rendered inside a fixed-ratio
 * frame on the public site, so an oversized photo or a long video can never
 * break the layout.
 */

const youtubePatterns = [
  /youtu\.be\/([\w-]{6,})/i,
  /youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/i,
  /youtube\.com\/embed\/([\w-]{6,})/i,
  /youtube\.com\/shorts\/([\w-]{6,})/i,
];

function youtubeId(url: string): string | null {
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

const mediaSchema = z.object({
  kind: z.enum(["IMAGE", "VIDEO"]),
  title: z.string().trim().min(3, "Give the item a short title").max(140),
  caption: z.string().trim().max(400).optional().or(z.literal("")),
  url: z.string().trim().min(4, "Add a link or an uploaded image URL").max(600),
  published: z.string().optional(),
});

function isSafeMediaUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createMediaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN" && user.role !== "AGID_ADMIN" && user.role !== "COMM_MANAGER") {
    return {
      status: "error",
      error: "Only the GLANCE team and communications can publish gallery items.",
    };
  }

  const parsed = parseForm(mediaSchema, formData);
  if (!parsed.success) {
    return { status: "error", error: "Check the highlighted fields.", errors: parsed.errors };
  }

  const { kind, title, caption, url, published } = parsed.data;

  if (!isSafeMediaUrl(url)) {
    return {
      status: "error",
      error: "Use an https link, or an image already uploaded to this site.",
    };
  }

  const videoId = kind === "VIDEO" ? youtubeId(url) : null;
  if (kind === "VIDEO" && !videoId) {
    return {
      status: "error",
      error: "Paste a YouTube link so the video can play inside the page.",
    };
  }

  const secureUrl =
    kind === "VIDEO" && videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : url;

  try {
    const created = await db.mediaAsset.create({
      data: {
        publicId: `gallery_${randomUUID()}`,
        secureUrl,
        kind,
        provider: kind === "VIDEO" ? "YOUTUBE" : "LINK",
        providerId: videoId,
        title,
        caption: caption || null,
        published: published === "on",
        ownerId: user.id,
        sortOrder: 0,
      },
      select: { id: true },
    });

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "media.create",
      entityType: "MediaAsset",
      entityId: created.id,
      ip: await requestIp(),
    });

    revalidatePath("/portal/media");
    revalidatePath("/gallery");

    return {
      status: "success",
      success: published === "on" ? "Published to the gallery." : "Saved as a draft.",
    };
  } catch {
    return { status: "error", error: "That link could not be saved. Try again." };
  }
}

export async function setMediaPublishedAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN" && user.role !== "AGID_ADMIN" && user.role !== "COMM_MANAGER") return;

  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  if (!id) return;

  await db.mediaAsset.update({ where: { id }, data: { published } }).catch(() => undefined);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: published ? "media.publish" : "media.unpublish",
    entityType: "MediaAsset",
    entityId: id,
    ip: await requestIp(),
  });

  revalidatePath("/portal/media");
  revalidatePath("/gallery");
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN" && user.role !== "AGID_ADMIN") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.mediaAsset.delete({ where: { id } }).catch(() => undefined);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "media.delete",
    entityType: "MediaAsset",
    entityId: id,
    ip: await requestIp(),
  });

  revalidatePath("/portal/media");
  revalidatePath("/gallery");
}
