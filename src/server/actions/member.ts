"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { verifyUploadedAsset } from "@/server/cloudinary";
import { accountSchema, parseForm, profileSchema, type FormState } from "@/server/validation";

/**
 * Name, email, phone and, for staff accounts created by invitation, the
 * completion set (gender, department, academic level, position).
 *
 * Saving this form is what releases the portal gate for a new staff account,
 * so `profileCompletedAt` is stamped once every required field is present. The
 * rules live here on the server, not in the form, so the gate cannot be
 * skipped from the browser.
 */
export async function updateAccountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const ip = await requestIp();

  const parsed = parseForm(accountSchema, formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: parsed.errors,
    };
  }

  const data = parsed.data;
  const staffRole =
    user.role === "SUPER_ADMIN" || user.role === "AGID_ADMIN" || user.role === "COMM_MANAGER" || user.role === "CHAPTER_ADMIN";
  const completing = staffRole && !user.profileCompletedAt;

  const errors: Record<string, string[]> = {};
  if (!data.phone) errors.phone = ["A phone number is required"];
  if (!data.gender) errors.gender = ["Select your gender"];
  if (!data.department) errors.department = ["Enter your department or field"];
  if (!data.academicLevel) errors.academicLevel = ["Select your academic level"];
  if (!data.position) errors.position = ["Enter your position"];
  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Complete every field so your account can be activated.",
      errors,
    };
  }

  const emailChanged = data.email !== user.email.toLowerCase();
  if (emailChanged) {
    const taken = await db.user.findFirst({
      where: { email: data.email, id: { not: user.id } },
      select: { id: true },
    });
    if (taken) {
      return {
        status: "error",
        message: "That email address already has an account.",
        errors: { email: ["Already in use"] },
      };
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      gender: data.gender || "PREFER_NOT_TO_SAY",
      department: data.department || null,
      academicLevel: data.academicLevel || null,
      position: data.position || null,
      profileCompletedAt: user.profileCompletedAt ?? new Date(),
    },
  });

  if (user.profile) {
    await db.memberProfile.update({
      where: { id: user.profile.id },
      data: {
        fullName: data.name,
        gender: data.gender || "PREFER_NOT_TO_SAY",
        department: data.department || null,
        academicLevel: data.academicLevel || null,
      },
    });
  }

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: completing ? "user.profile_completed" : "member.self_update",
    entityType: "User",
    entityId: user.id,
    ip,
    metadata: emailChanged ? { emailChanged: true } : null,
  });

  revalidatePath("/portal/profile");
  revalidatePath("/portal/dashboard");

  return {
    status: "success",
    message: completing ? "Your profile is complete. The portal is open." : "Account details updated.",
    success: completing ? "Your profile is complete. The portal is open." : "Account details updated.",
  };
}

/**
 * Members maintain their own descriptive record. Chapter, position, executive
 * status and account status are administrative fields and are never taken from
 * the client here.
 */
export async function updateOwnProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const ip = await requestIp();

  if (!user.profile) {
    return {
      status: "error",
      message:
        "Your member record has not been created yet. Contact your chapter's coordinators.",
    };
  }

  const parsed = parseForm(profileSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", errors: parsed.errors };
  }

  const data = parsed.data;

  await db.$transaction([
    db.memberProfile.update({
      where: { id: user.profile.id },
      data: {
        fullName: data.fullName,
        institution: data.institution,
        department: data.department || null,
        academicLevel: data.academicLevel || null,
        gender: data.gender,
        membershipCategory: data.membershipCategory,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: { name: data.fullName, phone: data.phone || null },
    }),
  ]);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "member.self_update",
    entityType: "MemberProfile",
    entityId: user.profile.id,
    ip,
  });

  revalidatePath("/portal/profile");
  revalidatePath("/portal/dashboard");

  return { status: "success", message: "Your profile has been updated." };
}

export async function attachAvatarAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const ip = await requestIp();

  const publicId = String(formData.get("publicId") ?? "").trim();

  const asset = await verifyUploadedAsset({
    publicId,
    expectedFolder: "member-avatar",
  });

  // Staff accounts carry their photo on the account itself; members carry it
  // on the member record. Either way the upload must reference this user.
  const ownerRef = user.profile?.id ?? user.id;
  if (!asset || !asset.publicId.includes(ownerRef)) {
    return { status: "error", message: "That upload could not be verified." };
  }

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  if (user.profile) {
    writes.push(
      db.memberProfile.update({
        where: { id: user.profile.id },
        data: { avatarUrl: asset.secureUrl, avatarPublicId: asset.publicId },
      }),
    );
  } else {
    writes.push(
      db.user.update({
        where: { id: user.id },
        data: { avatarUrl: asset.secureUrl, avatarPublicId: asset.publicId },
      }),
    );
  }
  writes.push(
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
        chapterId: user.chapterId,
      },
    }),
  );

  await db.$transaction(writes);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "member.avatar_update",
    entityType: user.profile ? "MemberProfile" : "User",
    entityId: user.profile?.id ?? user.id,
    ip,
    metadata: { publicId: asset.publicId },
  });

  revalidatePath("/portal/profile");
  return { status: "success", message: "Profile photo updated." };
}

/** Members may keep their gender preference private; this hides it on display. */
export async function setGenderVisibilityAction(formData: FormData) {
  const user = await requireUser();
  if (!user.profile) return;

  const visible = formData.get("visible") === "on";

  await db.memberProfile.update({
    where: { id: user.profile.id },
    data: { gender: visible ? user.profile.gender : "PREFER_NOT_TO_SAY" },
  });

  revalidatePath("/portal/profile");
}
