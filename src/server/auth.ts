import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { db } from "./db";

export const SESSION_COOKIE = "glance_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

/** What each role is for, shown on the roles page and in the sidebar. */
export const ROLES: Readonly<Record<Role, { label: string; description: string }>> = {
  SUPER_ADMIN: {
    label: "Administrator",
    description:
      "Full access to everything on the platform: records, content, settings " +
      "and the audit trail.",
  },
  AGID_ADMIN: {
    label: "GLANCE team",
    description:
      "Runs the platform day to day. Activate chapters, review " +
      "applications, manage members and publish content. This is the " +
      "secretariat account.",
  },
  COMM_MANAGER: {
    label: "Communications",
    description:
      "Publishes events, gallery items and news for the network. No chapter " +
      "or member administration.",
  },
  CHAPTER_ADMIN: {
    label: "Chapter coordinator",
    description:
      "Runs one campus chapter. Register its members, invite them, update the " +
      "chapter record and submit activity reports. Other chapters stay private.",
  },
  MEMBER: {
    label: "Member",
    description:
      "Enrolled participant in a GLANCE chapter. Update your own details and " +
      "reach your membership card. You cannot manage anyone else.",
  },
  ALUMNI: {
    label: "Alumni",
    description:
      "A former member who has stepped down from active participation. Your " +
      "record and history stay available, the same as a member.",
  },
};

export function roleDescription(role: Role) {
  return ROLES[role]?.description ?? "No description available.";
}

export function roleLabel(role: Role) {
  return ROLES[role]?.label ?? role;
}

/** Fields safe to expose to the application layer (never the password hash). */
export const sessionUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  gender: true,
  department: true,
  academicLevel: true,
  position: true,
  avatarUrl: true,
  avatarPublicId: true,
  profileCompletedAt: true,
  chapterId: true,
  lastLoginAt: true,
  chapter: {
    select: { id: true, code: true, name: true, institution: true, status: true },
  },
  profile: {
    select: {
      id: true,
      memberCode: true,
      fullName: true,
      institution: true,
      department: true,
      academicLevel: true,
      gender: true,
      position: true,
      isExecutive: true,
      membershipCategory: true,
      status: true,
      avatarUrl: true,
      chapterId: true,
      registeredAt: true,
    },
  },
} satisfies Prisma.UserSelect;

export type SessionUser = Prisma.UserGetPayload<{ select: typeof sessionUserSelect }>;

export function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(`${token}.${process.env.SESSION_SECRET ?? "glance-dev-pepper"}`)
    .digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

/**
 * Issues a new session and sets the httpOnly cookie.
 * Only call from a Server Action or Route Handler.
 */
export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = sessionExpiry();

  await db.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session
      .deleteMany({ where: { tokenHash: hashSessionToken(token) } })
      .catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Revokes every session for a user (used on password change/deactivation). */
export async function revokeAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

/**
 * Request-scoped current user. Reads the session cookie, validates the session
 * row and loads the *current* role from the database on every request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      id: true,
      expiresAt: true,
      userId: true,
      user: { select: sessionUserSelect },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  const user = session.user;
  if (user.status === "DEACTIVATED" || user.status === "SUSPENDED") return null;

  return user;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  return user;
}

export async function requireRole(
  roles: Role | Role[],
): Promise<SessionUser> {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) redirect("/portal/dashboard?denied=1");
  return user;
}

export function isAdmin(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.AGID_ADMIN;
}

export function canManageChapter(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.AGID_ADMIN || role === Role.CHAPTER_ADMIN;
}

/** True when the actor may act on the given chapter's private records. */
export function canAccessChapter(
  actor: Pick<SessionUser, "role" | "chapterId">,
  chapterId: string,
) {
  if (actor.role === Role.SUPER_ADMIN || actor.role === Role.AGID_ADMIN) return true;
  return actor.chapterId === chapterId;
}
