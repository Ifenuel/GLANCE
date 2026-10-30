"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  requireUser,
  revokeAllSessions,
  verifyPassword,
} from "@/server/auth";
import { requestIp, requestUserAgent, writeAudit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import {
  passwordResetEmail,
  sendTransactionalEmail,
} from "@/server/email";
import { generateMemberCode } from "@/server/ids";
import {
  activateSchema,
  loginSchema,
  parseForm,
  resetRequestSchema,
  resetSchema,
  type FormState,
} from "@/server/validation";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";

function hashToken(token: string) {
  return createHash("sha256")
    .update(`${token}.${process.env.SESSION_SECRET ?? "glance-dev-pepper"}`)
    .digest("hex");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await rateLimit(`login:${ip ?? "unknown"}`, 20, 15 * 60 * 1000);
  if (!guard.ok) {
    const waitMinutes = Math.max(1, Math.ceil(guard.retryAfterSeconds / 60));
    return {
      status: "error",
      message: `Too many sign-in attempts from this network. Please wait about ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"} and try again.`,
    };
  }

  const parsed = parseForm(loginSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Enter your email and password." };
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      role: true,
      name: true,
      chapter: { select: { code: true } },
    },
  });

  // Constant-ish response regardless of whether the account exists.
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    await writeAudit({
      action: "auth.login_failed",
      entityType: "User",
      entityId: user?.id ?? null,
      ip,
      metadata: { email },
    });
    return { status: "error", message: "Invalid email or password." };
  }

  if (user.status !== "ACTIVE") {
    return {
      status: "error",
      message:
        "This account is not active. Contact your chapter's coordinators or the GLANCE secretariat.",
    };
  }

  // Only the four working roles sign in to the portal: super admin, GLANCE
  // network team, communications manager and chapter coordinators. Members and
  // alumni do not need a login — their chapter coordinator keeps their record
  // up to date, and anyone can verify a member ID card publicly.
  if (user.role === "MEMBER" || user.role === "ALUMNI") {
    await writeAudit({
      action: "auth.login_blocked_member_role",
      entityType: "User",
      entityId: user.id,
      ip,
      actorRole: user.role,
    });
    return {
      status: "error",
      message:
        "Members do not sign in to the portal. Your chapter coordinator keeps your record up to date. To verify your membership, use the GLANCE ID verification link on your card.",
    };
  }

  await createSession(user.id, {
    ip,
    userAgent: await requestUserAgent(),
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    ip,
  });

  redirect("/portal/dashboard");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.logout",
      entityType: "User",
      entityId: user.id,
    });
  }
  await destroySession();
  redirect("/portal/login");
}

export async function activateAccountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await rateLimit(`activate:${ip ?? "unknown"}`, 10, 60 * 60 * 1000);
  if (!guard.ok) {
    return { status: "error", message: "Too many activation attempts. Try again later." };
  }

  const parsed = parseForm(activateSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the form and try again.", errors: parsed.errors };
  }

  const code = parsed.data.code.toUpperCase();

  const invitation = await db.invitation.findFirst({
    where: {
      OR: [{ code }, { tokenHash: hashToken(code) }],
    },
    select: {
      id: true,
      email: true,
      role: true,
      chapterId: true,
      status: true,
      expiresAt: true,
      chapter: { select: { id: true, name: true, status: true } },
    },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return { status: "error", message: "That activation code is not valid." };
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return {
      status: "error",
      message: "This activation code has expired. Ask your administrator for a new invitation.",
    };
  }

  if (invitation.role === "MEMBER" && invitation.chapter?.status !== "ACTIVE") {
    return {
      status: "error",
      message:
        "Membership can only be activated for a chapter that GLANCE has activated.",
    };
  }

  const existingUser = await db.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.$transaction(async (tx) => {
    const account = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            name: invitation.email.split("@")[0]!,
            role: invitation.role as any,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
            chapterId: invitation.chapterId,
          },
          select: { id: true, role: true, chapterId: true, name: true },
        })
      : await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash,
            name: invitation.email.split("@")[0]!,
            role: invitation.role === "CHAPTER_ADMIN" ? "CHAPTER_ADMIN" : "MEMBER",
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
            chapterId: invitation.chapterId,
          },
          select: { id: true, role: true, chapterId: true, name: true },
        });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedById: account.id,
      },
    });

    if (invitation.role === "MEMBER" && invitation.chapterId) {
      const existingProfile = await tx.memberProfile.findUnique({
        where: { userId: account.id },
        select: { id: true },
      });
      if (!existingProfile) {
        const chapter = await tx.chapter.findUniqueOrThrow({
          where: { id: invitation.chapterId },
          select: { institution: true },
        });
        await tx.memberProfile.create({
          data: {
            userId: account.id,
            fullName: account.name,
            memberCode: await generateMemberCode(),
            institution: chapter.institution,
            chapterId: invitation.chapterId,
            membershipCategory: "STUDENT",
            status: "ACTIVE",
          },
        });
      }
    }

    return account;
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "account.activate",
    entityType: "User",
    entityId: user.id,
    ip,
    metadata: { invitationId: invitation.id, role: invitation.role },
  });

  await createSession(user.id, { ip, userAgent: await requestUserAgent() });

  redirect("/portal/dashboard?welcome=1");
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await rateLimit(`reset-request:${ip ?? "unknown"}`, 5, 60 * 60 * 1000);
  if (!guard.ok) {
    return { status: "error", message: "Too many requests. Please try again later." };
  }

  const parsed = parseForm(resetRequestSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Enter the email address on your account." };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true },
  });

  // Always report success so the endpoint cannot be used to enumerate accounts.
  if (!user) {
    return {
      status: "success",
      message: "If that email is registered, a reset link has been sent.",
    };
  }

  const token = randomBytes(32).toString("base64url");
  await db.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const url = `${APP_ORIGIN}/portal/reset-password?token=${token}`;
  const delivery = await sendTransactionalEmail(
    passwordResetEmail({ to: user.email, name: user.name, url }),
  );

  await writeAudit({
    actorId: user.id,
    action: "auth.password_reset_requested",
    entityType: "User",
    entityId: user.id,
    ip,
    metadata: { delivered: delivery.delivered },
  });

  return {
    status: "success",
    message: delivery.delivered
      ? "If that email is registered, a reset link has been sent."
      : "Reset requested. Email delivery is not configured on this environment, so ask the GLANCE secretariat to complete the reset.",
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await rateLimit(`reset:${ip ?? "unknown"}`, 10, 60 * 60 * 1000);
  if (!guard.ok) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = parseForm(resetSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the form and try again.", errors: parsed.errors };
  }

  const record = await db.passwordReset.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return { status: "error", message: "This reset link is no longer valid." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await revokeAllSessions(record.userId);

  await writeAudit({
    actorId: record.userId,
    action: "auth.password_reset",
    entityType: "User",
    entityId: record.userId,
    ip,
  });

  return {
    status: "success",
    message: "Password updated. You can now sign in with your new password.",
  };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const ip = await requestIp();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 10 || next !== confirm) {
    return {
      status: "error",
      message: "New password must be at least 10 characters and match the confirmation.",
    };
  }

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!record?.passwordHash || !(await verifyPassword(current, record.passwordHash))) {
    return { status: "error", message: "Your current password is incorrect." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.password_changed",
    entityType: "User",
    entityId: user.id,
    ip,
  });

  return { status: "success", message: "Password updated." };
}

/**
 * Re-checks the signed-in user's password for the blackout lock screen.
 *
 * Deliberately narrow: it never creates, extends or rotates the session, so
 * unlocking cannot be used to prolong an expiring login. Rate-limited per IP
 * so the lock screen cannot be brute-forced either.
 */
export async function verifyPasswordAction(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const ip = await requestIp();
  const guard = await rateLimit(`unlock:${user.id}:${ip ?? "unknown"}`, 10, 15 * 60 * 1000);
  if (!guard.ok) {
    return {
      ok: false,
      error: "Too many attempts. Wait a few minutes before trying again.",
    };
  }

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record?.passwordHash || !(await verifyPassword(password, record.passwordHash))) {
    return { ok: false, error: "That password is incorrect." };
  }

  return { ok: true };
}
