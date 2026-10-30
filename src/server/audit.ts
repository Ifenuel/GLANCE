import "server-only";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "./db";

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  actorRole: string | null;
  actor: { name: string; email: string; role: string } | null;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
};

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "auth.login_failed": "Failed sign-in attempt",
  "auth.password_reset_requested": "Requested a password reset",
  "auth.password_reset": "Reset a password",
  "auth.password_changed": "Changed a password",
  "chapter.create": "Created a chapter",
  "chapter.create_activate": "Created and activated a chapter",
  "chapter.update": "Updated a chapter",
  "chapter.update_self": "Updated their chapter",
  "chapter.logo_update": "Updated a chapter logo",
  "chapter.activate": "Activated a chapter",
  "chapter.suspend": "Suspended a chapter",
  "chapter.deactivate": "Deactivated a chapter",
  "invitation.issue": "Issued an invitation",
  "invitation.revoke": "Revoked an invitation",
  "invitation.accept": "Accepted an invitation",
  "join_application.submit": "Submitted a membership application",
  "join_application.approve": "Approved a membership application",
  "join_application.reject": "Rejected a membership application",
  "chapter_application.submit": "Submitted a chapter application",
  "chapter_application.approve": "Approved a chapter application",
  "chapter_application.reject": "Rejected a chapter application",
  "member.self_update": "Updated their profile",
  "member.create": "Registered a member",
  "member.register": "Registered a member",
  "member.card_generate": "Generated member ID cards",
  "member.delete": "Removed a member record",
  "member.update": "Updated a member record",
  "member.avatar_update": "Updated a profile photo",
  "user.create_agid_admin": "Created a staff account",
  "user.profile_completed": "Completed their profile",
  "report.submit": "Submitted an activity report",
  "report.review": "Reviewed an activity report",
  "settings.update": "Changed portal settings",
  "settings.password_changed": "Changed account password",
  "event.create": "Created an event",
  "event.publish": "Published an event",
  "event.unpublish": "Unpublished an event",
  "event.delete": "Deleted an event",
  "media.create": "Added gallery media",
  "media.publish": "Published gallery media",
  "media.unpublish": "Unpublished gallery media",
  "media.delete": "Deleted gallery media",
  "contact.submit": "Sent a contact message",
};

/** Human wording for an audit action code. */
export function auditActionLabel(action: string): string {
  const known = ACTION_LABELS[action];
  if (known) return known;
  const words = action.replaceAll(".", " ").replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const entrySelect = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  actorId: true,
  actorRole: true,
  // Joined so the feed can say who acted, not just what happened.
  actor: { select: { name: true, email: true, role: true } },
  userAgent: true,
  metadata: true,
  ip: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

/** Client IP behind the deployment proxy, when available. */
export async function requestIp(): Promise<string | null> {
  try {
    const list = await headers();
    const forwarded = list.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 64) || null;
    return list.get("x-real-ip")?.slice(0, 64) ?? null;
  } catch {
    return null;
  }
}

export async function requestUserAgent(): Promise<string | null> {
  try {
    const list = await headers();
    return list.get("user-agent")?.slice(0, 256) ?? null;
  } catch {
    return null;
  }
}

/**
 * Records an administrative or security-relevant event. Actor fields are
 * optional: anonymous flows (public form submissions) are logged with a null
 * actor, authenticated flows should pass the acting user. Failures are
 * swallowed so audit problems never break a user-facing action.
 */
export async function writeAudit(input: {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    // Device detail is captured here rather than at every call site, so no
    // action can forget to record it.
    const userAgent = input.userAgent ?? (await requestUserAgent());
    await db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        ip: input.ip ?? null,
        userAgent,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", input.action, error);
  }
}

/** Recent audit entries, newest first. */
export async function auditEntry(
  options: { limit?: number; where?: Record<string, unknown> } = {},
): Promise<AuditEntry[]> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 200);
  return db.auditLog.findMany({
    where: (options.where ?? {}) as Prisma.AuditLogWhereInput,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: entrySelect,
  });
}

/**
 * Cursor pagination over the audit log. Deep row offsets get slower as the
 * table grows into millions of entries, so pages are walked by keyset cursor
 * (createdAt + id) instead of OFFSET.
 */
export async function auditPage(options: {
  limit: number;
  /** Opaque cursor from `encodeAuditCursor`. */
  cursor?: string;
  where?: Record<string, unknown>;
}): Promise<{ entries: AuditEntry[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 1000);
  const baseWhere = (options.where ?? {}) as Prisma.AuditLogWhereInput;
  const cursorWhere = decodeAuditCursor(options.cursor);
  const where: Prisma.AuditLogWhereInput = cursorWhere
    ? { AND: [baseWhere, cursorWhere] }
    : baseWhere;

  const rows = await db.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: entrySelect,
  });

  const hasMore = rows.length > limit;
  const entries = hasMore ? rows.slice(0, limit) : rows;
  const last = entries[entries.length - 1];
  return {
    entries,
    nextCursor: hasMore && last ? encodeAuditCursor(last.createdAt, last.id) : null,
  };
}

/** Encodes the keyset position of an entry as an opaque URL-safe cursor. */
export function encodeAuditCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

function decodeAuditCursor(
  cursor: string | undefined,
): Prisma.AuditLogWhereInput | null {
  if (!cursor) return null;
  try {
    const [iso, id] = Buffer.from(cursor, "base64url")
      .toString("utf8")
      .split("|");
    const at = new Date(iso);
    if (!id || Number.isNaN(at.getTime())) return null;
    return {
      OR: [
        { createdAt: { lt: at } },
        { createdAt: at, id: { lt: id } },
      ],
    };
  } catch {
    return null;
  }
}

/**
 * Dashboard summary: the latest entries plus coarse counters. The returned
 * array also carries `changes`, `member` and `reports` counters.
 */
export async function auditSummary(): Promise<
  AuditEntry[] & { changes: number; member: number; reports: number }
> {
  const [entries, changes, member, reports] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: entrySelect,
    }),
    db.auditLog.count(),
    db.auditLog.count({ where: { entityType: "MemberProfile" } }),
    db.auditLog.count({ where: { entityType: "ActivityReport" } }),
  ]);

  return Object.assign(entries, { changes, member, reports });
}

/** Extracts a `decision` value from audit metadata for rendering. */
export function auditMetadataDecision(metadata: unknown): string {
  if (metadata && typeof metadata === "object" && "decision" in metadata) {
    const value = (metadata as Record<string, unknown>).decision;
    if (typeof value === "string" && value.length > 0) {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
  }
  return "Recorded";
}
