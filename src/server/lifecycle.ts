import "server-only";

import { createHash } from "node:crypto";
import { db } from "./db";
import { writeAudit } from "./audit";
import { validateEmail } from "./validation";
import { generateInvitationCode, generateChapterCode } from "./ids";
import { sendTransactionalEmail, invitationEmail } from "./email";

export type Actor = { id: string; role: string };

function tokenHash(code: string, email: string) {
  return createHash("sha256")
    .update(`${code}.${email.toLowerCase()}`)
    .digest("hex");
}

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type IssuedInvitation = {
  id: string;
  code: string;
  url: string;
  delivered: boolean;
  deliveryNote: string;
  expiresAt: Date;
};

/**
 * Issues an invitation with a single-use activation code and queues the
 * invitation email. Throws for invalid input; callers surface the message.
 */
export async function issueInvitation(params: {
  email: string;
  role: "SUPER_ADMIN" | "AGID_ADMIN" | "CHAPTER_ADMIN" | "COMM_MANAGER" | "MEMBER";
  chapterId?: string | null;
  name?: string | null;
  actor: Actor;
  ip?: string | null;
}): Promise<IssuedInvitation> {
  const emailLower = params.email.trim().toLowerCase();
  if (!validateEmail(emailLower)) {
    throw new Error("A valid email address is required.");
  }

  if (params.chapterId) {
    const chapter = await db.chapter.findUnique({
      where: { id: params.chapterId },
      select: { id: true, status: true },
    });
    if (!chapter) throw new Error("Chapter not found.");
    if (chapter.status !== "ACTIVE") {
      throw new Error(
        "Members and administrators can only be invited to activated chapters.",
      );
    }
  }

  if (params.role === "CHAPTER_ADMIN" && !params.chapterId) {
    throw new Error("A chapter administrator must be assigned to a chapter.");
  }

  const code = await generateInvitationCode();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const invitation = await db.invitation.create({
    data: {
      code,
      tokenHash: tokenHash(code, emailLower),
      email: emailLower,
      role: params.role,
      chapterId: params.chapterId ?? null,
      expiresAt,
      createdById: params.actor.id,
    },
    select: { id: true },
  });

  const chapter = params.chapterId
    ? await db.chapter.findUnique({
        where: { id: params.chapterId },
        select: { name: true, code: true },
      })
    : null;

  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
  const url = `${origin}/portal/login?invite=${code}`;

  const result = await sendTransactionalEmail(
    invitationEmail({
      to: emailLower,
      name: params.name ?? null,
      role: params.role,
      chapterName: chapter?.name ?? null,
      code,
      url,
    }),
  );

  await writeAudit({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    action: "invitation.issue",
    entityType: "Invitation",
    entityId: invitation.id,
    ip: params.ip ?? null,
    metadata: {
      email: emailLower,
      role: params.role,
      chapterId: params.chapterId ?? null,
      delivered: result.delivered,
    },
  });

  return {
    id: invitation.id,
    code,
    url,
    delivered: result.delivered,
    deliveryNote: result.delivered
      ? "Invitation email sent."
      : "Email delivery is not configured yet. Share the activation code with the recipient directly.",
    expiresAt,
  };
}

/** Creates a chapter record (PENDING or ACTIVE) issued with a unique code. */
export async function createChapterRecord(params: {
  name: string;
  institution: string;
  city: string;
  state: string;
  contactEmail?: string | null;
  description?: string | null;
  status: "ACTIVE" | "PENDING";
  actor: Actor;
  ip?: string | null;
}) {
  const code = await generateChapterCode(params.institution);

  const chapter = await db.chapter.create({
    data: {
      code,
      name: params.name,
      institution: params.institution,
      city: params.city,
      state: params.state,
      contactEmail: params.contactEmail || null,
      description: params.description || null,
      status: params.status,
      activatedAt: params.status === "ACTIVE" ? new Date() : null,
      createdById: params.actor.id,
    },
  });

  await writeAudit({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    action: params.status === "ACTIVE" ? "chapter.create_activate" : "chapter.create",
    entityType: "Chapter",
    entityId: chapter.id,
    ip: params.ip ?? null,
    metadata: {
      name: chapter.name,
      institution: chapter.institution,
      code: chapter.code,
      status: chapter.status,
    },
  });

  return chapter;
}

/** Transitions a chapter's status and records the change in the audit log. */
export async function setChapterStatus(params: {
  chapterId: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED";
  actor: Actor;
  ip?: string | null;
}) {
  const chapter = await db.chapter.findUnique({
    where: { id: params.chapterId },
    select: { id: true, code: true, name: true, status: true, activatedAt: true },
  });
  if (!chapter) throw new Error("Chapter not found.");
  if (chapter.status === params.status) {
    throw new Error(`Chapter is already ${params.status.toLowerCase()}.`);
  }

  const updated = await db.chapter.update({
    where: { id: chapter.id },
    data: {
      status: params.status,
      activatedAt:
        params.status === "ACTIVE" ? (chapter.activatedAt ?? new Date()) : chapter.activatedAt,
    },
  });

  await writeAudit({
    actorId: params.actor.id,
    actorRole: params.actor.role,
    action: `chapter.${params.status.toLowerCase()}`,
    entityType: "Chapter",
    entityId: chapter.id,
    ip: params.ip ?? null,
    metadata: {
      code: chapter.code,
      name: chapter.name,
      from: chapter.status,
      to: params.status,
    },
  });

  return updated;
}
