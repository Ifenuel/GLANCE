"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { verifyUploadedAsset } from "@/server/cloudinary";
import { accountSchema, parseForm, profileSchema, type FormState } from "@/server/validation";
import {
  sendTransactionalEmail,
  emailChangeConfirmationEmail,
  emailChangedNoticeEmail,
} from "@/server/email";
import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { generateStaffCode } from "@/server/ids";

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

  // Only a first-time completion run demands the full set; the everyday
  // "account details" save only carries the fields the form actually shows
  // (name, email, phone, gender), and leaves department/level/position as
  // stored. Requiring hidden fields here used to block every save forever.
  const errors: Record<string, string[]> = {};
  if (completing) {
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

  // Staff accounts (GLANCE team, communications, secretariat) are not chapter
  // members, so they carry their GLANCE reference on the account itself. It is
  // minted once, at first completion — or on this very save — never again.
  let staffCode = user.staffCode;
  if (!staffCode && (user.role === "SUPER_ADMIN" || user.role === "AGID_ADMIN" || user.role === "COMM_MANAGER")) {
    staffCode = await generateStaffCode();
  }

  const result = await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      // An email change is only PERMISSION to switch — the address itself
      // follows the confirmed link, so a mistyped request can never lock
      // the account out of its own portal.
      email: emailChanged ? undefined : data.email,
      phone: data.phone || null,
      gender: data.gender || user.gender || "PREFER_NOT_TO_SAY",
      department: data.department || user.department || null,
      academicLevel: data.academicLevel || user.academicLevel || null,
      position: data.position || user.position || null,
      profileCompletedAt: user.profileCompletedAt ?? new Date(),
      staffCode,
    },
  });

  // The user should never be left wondering whether a mail went out: the new
  // address receives a confirmation LINK, the old one receives a security
  // notice, and the delivery outcome is reported back into the form.
  let confirmations = "";
  if (emailChanged) {
    // Stateless confirmation token: signed with the account's current
    // password hash, so it expires on its own and is voided the moment the
    // password changes. No pending-change table required.
    const row = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    const expiresIn = 24;
    const expiresAt = Date.now() + expiresIn * 60 * 60 * 1000;
    const payload = `${user.id}|${data.email}|${expiresAt}`;
    const signature = createHmac("sha256", row?.passwordHash ?? "")
      .update(payload)
      .digest("base64url");
    const token = `${Buffer.from(payload).toString("base64url")}.${signature}`;

    const headerList = await headers();
    const host =
      headerList.get("x-forwarded-host") ??
      headerList.get("host") ??
      "localhost:3000";
    const proto =
      headerList.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    const link = `${proto}://${host}/portal/confirm-email?token=${encodeURIComponent(token)}`;

    const [toNew, toOld] = await Promise.all([
      sendTransactionalEmail(
        emailChangeConfirmationEmail({
          to: data.email,
          name: data.name,
          link,
          expiresInHours: expiresIn,
        }),
      ),
      sendTransactionalEmail(
        emailChangedNoticeEmail({
          to: user.email,
          name: result.name,
          newEmail: data.email,
        }),
      ),
    ]);
    confirmations = toNew.delivered
      ? ` A confirmation link was sent to ${data.email} — click it to switch. Your account and your sign-in stay exactly as they are until you do.`
      : toOld.delivered
        ? ` The confirmation link could not be delivered, so your address has not changed. A security notice still went to your old address. Please try again later.`
        : " The email service could not deliver the confirmation link, so your address has not changed — nothing was silently dropped. Check the sender address configuration and try again.";
  }

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
    message:
      (completing
        ? "Your profile is complete. The portal is open."
        : "Account details updated.") +
      (staffCode && !user.staffCode
        ? ` Your GLANCE reference is ${result.staffCode}.`
        : "") +
      confirmations,
    success:
      (completing
        ? "Your profile is complete. The portal is open."
        : "Account details updated.") +
      (staffCode && !user.staffCode
        ? ` Your GLANCE reference is ${result.staffCode}.`
        : "") +
      confirmations,
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

/**
 * Applies a signed, unexpired email change — the click behind the
 * confirmation link. Public by design: the link in the account holder's
 * inbox is the proof, no session required. The signature is re-derived from
 * the account's CURRENT password hash, so a password change voids
 * outstanding links.
 */
export async function confirmEmailChangeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const invalid: FormState = {
    status: "error",
    message:
      "This confirmation link is not valid. Open the portal, save your account details again and a fresh link will be sent.",
    error: "This confirmation link is not valid.",
  };

  const token = String(formData.get("token") ?? "");
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return invalid;

  let payload: string;
  try {
    payload = Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
  } catch {
    return invalid;
  }
  const given = token.slice(dot + 1);

  const [userId, newEmail, expiresRaw] = payload.split("|");
  const expiresAt = Number.parseInt(expiresRaw ?? "", 10);
  if (!userId || !newEmail || !Number.isFinite(expiresAt)) return invalid;
  if (expiresAt < Date.now()) {
    return {
      status: "error",
      message:
        "This confirmation link has expired. Save your account details in the portal again and a fresh link will be sent.",
      error: "This confirmation link has expired.",
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  if (!user) return invalid;

  // The signature only matches the account's current password digest.
  const expected = createHmac("sha256", user.passwordHash ?? "")
    .update(`${userId}|${newEmail}|${expiresRaw}`)
    .digest("base64url");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return invalid;

  const taken = await db.user.findFirst({
    where: { email: newEmail, id: { not: user.id } },
    select: { id: true },
  });
  if (taken) {
    return {
      status: "error",
      message:
        "That email address already belongs to another GLANCE account.",
      error: "That email address already belongs to another GLANCE account.",
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: { email: newEmail },
  });

  await writeAudit({
    actorId: user.id,
    action: "member.email_confirmed",
    entityType: "User",
    entityId: user.id,
    ip: await requestIp(),
    metadata: { newEmail },
  });

  return {
    status: "success",
    success: `Confirmed — ${newEmail} is now the address on your GLANCE account. Sign in with it from now on.`,
    message: "Email address confirmed.",
  };
}
