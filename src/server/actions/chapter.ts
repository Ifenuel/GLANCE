"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { issueInvitation } from "@/server/lifecycle";
import { generateMemberCode } from "@/server/ids";
import { verifyUploadedAsset } from "@/server/cloudinary";
import {
  invitationSchema,
  parseForm,
  reportSchema,
  type FormState,
} from "@/server/validation";
import { sendTransactionalEmail, chapterActivityReportEmail } from "@/server/email";

/** Resolves the chapter a chapter administrator is allowed to manage. */
async function requireOwnChapter() {
  const user = await requireRole("CHAPTER_ADMIN");
  if (!user.chapterId) {
    throw new Error("This administrator is not assigned to a chapter.");
  }
  const chapter = await db.chapter.findUnique({
    where: { id: user.chapterId },
    select: { id: true, code: true, name: true, status: true, institution: true },
  });
  if (!chapter) throw new Error("Assigned chapter not found.");
  return { user, chapter };
}

export async function inviteChapterMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, chapter } = await requireOwnChapter();
  const ip = await requestIp();

  const parsed = parseForm(invitationSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the invitation details.", errors: parsed.errors };
  }

  // A chapter administrator can only invite members, and only to their chapter.
  try {
    const invitation = await issueInvitation({
      email: parsed.data.email,
      role: "MEMBER",
      chapterId: chapter.id,
      name: parsed.data.name || null,
      actor: user,
      ip,
    });

    revalidatePath("/portal/members");
    revalidatePath("/portal/invitations");

    return {
      status: "success",
      message: invitation.delivered
        ? `Invitation sent to ${parsed.data.email}.`
        : `Invitation created for ${chapter.name}. ${invitation.deliveryNote}`,
      result: {
        code: invitation.code,
        url: invitation.url,
        expires: invitation.expiresAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to issue the invitation.",
    };
  }
}

export async function updateOwnChapterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, chapter } = await requireOwnChapter();
  const ip = await requestIp();

  // Chapter administrators may update descriptive fields only. Status, code and
  // institution are controlled by GLANCE.
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();

  if (!city || !state) {
    return { status: "error", message: "City and state are required." };
  }

  await db.chapter.update({
    where: { id: chapter.id },
    data: {
      city,
      state,
      description: description || null,
      contactEmail: contactEmail || null,
    },
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "chapter.update_self",
    entityType: "Chapter",
    entityId: chapter.id,
    ip,
  });

  revalidatePath("/portal/chapter");
  return { status: "success", message: "Chapter information updated." };
}

export async function submitActivityReportAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, chapter } = await requireOwnChapter();
  const ip = await requestIp();

  const parsed = parseForm(reportSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the report details.", errors: parsed.errors };
  }

  const report = await db.activityReport.create({
    data: {
      chapterId: chapter.id,
      reportedById: user.id,
      title: parsed.data.title,
      summary: parsed.data.summary,
      activityDate: new Date(`${parsed.data.activityDate}T00:00:00.000Z`),
      attendeeCount: parsed.data.attendeeCount ?? null,
    },
    select: { id: true },
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "report.submit",
    entityType: "ActivityReport",
    entityId: report.id,
    ip,
    metadata: { chapterId: chapter.id },
  });

  // The secretariat receives every submitted chapter report by email so the
  // offline inbox mirrors the portal. Delivery failure never blocks the save.
  await sendTransactionalEmail(
    chapterActivityReportEmail({
      chapterName: chapter.name,
      chapterCode: chapter.code,
      reportedBy: user.name,
      title: parsed.data.title,
      summary: parsed.data.summary,
      activityDate: parsed.data.activityDate,
      attendeeCount: parsed.data.attendeeCount ?? null,
    }),
  );

  revalidatePath("/portal/reports");
  return {
    status: "success",
    message: "Activity report submitted. GLANCE has been notified and can see it in the portal.",
    success: "Activity report submitted. GLANCE has been notified and can see it in the portal.",
  };
}

export async function registerChapterMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, chapter } = await requireOwnChapter();
  const ip = await requestIp();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const academicLevel = String(formData.get("academicLevel") ?? "").trim();

  if (!email || !fullName) {
    return { status: "error", message: "Full name and email are required." };
  }

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { status: "error", message: "A user with that email already exists." };
  }

  const memberCode = await generateMemberCode();

  await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        name: fullName,
        role: "MEMBER",
        status: "PENDING",
        chapterId: chapter.id,
      },
      select: { id: true },
    });

    await tx.memberProfile.create({
      data: {
        userId: created.id,
        fullName,
        memberCode,
        institution: chapter.institution,
        chapterId: chapter.id,
        department: department || null,
        academicLevel: (academicLevel || null) as
          | "YEAR_1"
          | "YEAR_2"
          | "YEAR_3"
          | "YEAR_4"
          | "YEAR_5"
          | "ND"
          | "HND"
          | "PGD"
          | "MASTERS"
          | "DOCTORATE"
          | "OTHER"
          | null,
        status: "PENDING",
      },
    });
  });

  const invitation = await issueInvitation({
    email,
    role: "MEMBER",
    chapterId: chapter.id,
    name: fullName,
    actor: user,
    ip,
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "member.register",
    entityType: "MemberProfile",
    ip,
    metadata: { email, memberCode, chapterId: chapter.id },
  });

  revalidatePath("/portal/members");

  return {
    status: "success",
    message: `Member ${memberCode} registered. Invitation code ${invitation.code}.`,
    result: { memberCode, code: invitation.code, url: invitation.url },
  };
}

/**
 * Persists a Cloudinary asset that the server has verified exists inside this
 * chapter's folder. A client-supplied URL alone is never accepted.
 */
export async function attachChapterLogoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, chapter } = await requireOwnChapter();
  const ip = await requestIp();

  const publicId = String(formData.get("publicId") ?? "").trim();

  const asset = await verifyUploadedAsset({
    publicId,
    expectedFolder: "chapter-logo",
  });

  if (!asset || !asset.publicId.includes(chapter.id)) {
    return {
      status: "error",
      message: "That upload could not be verified against this chapter.",
    };
  }

  await db.$transaction([
    db.chapter.update({
      where: { id: chapter.id },
      data: { logoUrl: asset.secureUrl, logoPublicId: asset.publicId },
    }),
    db.mediaAsset.upsert({
      where: { publicId: asset.publicId },
      update: { secureUrl: asset.secureUrl },
      create: {
        publicId: asset.publicId,
        assetId: asset.assetId,
        secureUrl: asset.secureUrl,
        format: asset.format,
        bytes: asset.bytes,
        width: asset.width,
        height: asset.height,
        ownerId: user.id,
        chapterId: chapter.id,
      },
    }),
  ]);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "chapter.logo_update",
    entityType: "Chapter",
    entityId: chapter.id,
    ip,
    metadata: { publicId: asset.publicId },
  });

  revalidatePath("/portal/chapter");
  return { status: "success", message: "Chapter logo updated." };
}
