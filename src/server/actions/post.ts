"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { parseForm, type FormState } from "@/server/validation";

/**
 * News, stories and announcements. Everything published here renders on the
 * public /news page, so publishing also busts the public cache.
 */

const CMS_ROLES = ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"];

const postSchema = z.object({
  title: z.string().trim().min(4, "Give the story a title").max(160),
  category: z.enum(["NEWS", "STORY", "ANNOUNCEMENT"]),
  excerpt: z
    .string()
    .trim()
    .min(12, "Write a one-sentence summary")
    .max(400),
  body: z.string().trim().min(20, "Write the story itself").max(20000),
  coverImageUrl: z.string().trim().max(600).optional().or(z.literal("")),
  published: z.string().optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "post";
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  if (!(await db.post.findUnique({ where: { slug: base } }))) return base;
  for (let i = 0; i < 6; i += 1) {
    const candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    if (!(await db.post.findUnique({ where: { slug: candidate } }))) {
      return candidate;
    }
  }
  return `${base}-${Date.now()}`;
}

function refreshPublicCache() {
  revalidateTag("posts", "minutes");
  revalidatePath("/news");
  revalidatePath("/");
}

export async function createPostAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (!CMS_ROLES.includes(user.role)) {
    return {
      status: "error",
      error: "Only the communications team can publish stories.",
    };
  }

  const parsed = parseForm(postSchema, formData);
  if (!parsed.success) {
    return { status: "error", error: "Check the highlighted fields.", errors: parsed.errors };
  }

  const { title, category, excerpt, body, coverImageUrl, published } = parsed.data;
  const isPublished = published === "on";

  if (coverImageUrl && !/^(https:\/\/|\/)/.test(coverImageUrl)) {
    return {
      status: "error",
      error: "The cover image must be an https link or an uploaded image.",
    };
  }

  try {
    const slug = await uniqueSlug(title);
    const created = await db.post.create({
      data: {
        slug,
        title,
        excerpt,
        body,
        category,
        status: isPublished ? "PUBLISHED" : "DRAFT",
        coverImageUrl: coverImageUrl || null,
        authorId: user.id,
        authorName: user.name,
        publishedAt: isPublished ? new Date() : null,
      },
      select: { id: true },
    });

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: isPublished ? "content.post_published" : "content.post_created",
      entityType: "Post",
      entityId: created.id,
      ip: await requestIp(),
    });

    refreshPublicCache();

    return {
      status: "success",
      success: isPublished
        ? "Published — it is now live on the website."
        : "Saved as a draft. Publish it when it is ready.",
    };
  } catch {
    return { status: "error", error: "The story could not be saved. Try again." };
  }
}

export async function setPostPublishedAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!CMS_ROLES.includes(user.role)) return;

  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  if (!id) return;

  const post = await db.post.findUnique({ where: { id }, select: { id: true } }).catch(() => null);
  if (!post) return;

  await db.post
    .update({
      where: { id },
      data: {
        status: published ? "PUBLISHED" : "DRAFT",
        publishedAt: published ? new Date() : null,
      },
    })
    .catch(() => undefined);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: published ? "content.post_published" : "content.post_unpublished",
    entityType: "Post",
    entityId: id,
    ip: await requestIp(),
  });

  refreshPublicCache();
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!["SUPER_ADMIN", "AGID_ADMIN"].includes(user.role)) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.post.delete({ where: { id } }).catch(() => undefined);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.post_deleted",
    entityType: "Post",
    entityId: id,
    ip: await requestIp(),
  });

  refreshPublicCache();
}
