"use server";

import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/server/db";
import { requireRole, hashPassword } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import {
  createChapterRecord,
  issueInvitation,
  setChapterStatus,
} from "@/server/lifecycle";
import {
  chapterSchema,
  invitationSchema,
  memberUpdateSchema,
  parseForm,
  idleFormState,
  type FormState,
} from "@/server/validation";

async function requireAgid() {
  return requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);
}

/**
 * List-page entry points for review decisions. The two-arg review actions are
 * shared with the interactive review pages (useActionState); forms posted
 * straight from the summary list need the single-argument shape, so these
 * thin wrappers adapt the call without duplicating the decision logic.
 */
export async function reviewChapterApplicationEntryAction(
  formData: FormData,
): Promise<void> {
  await reviewChapterApplicationAction(idleFormState, formData);
}

export async function reviewJoinApplicationEntryAction(
  formData: FormData,
): Promise<void> {
  await reviewJoinApplicationAction(idleFormState, formData);
}

export async function createChapterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAgid();
  const ip = await requestIp();

  const parsed = parseForm(chapterSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the chapter details.", errors: parsed.errors };
  }

  const activate = formData.get("activate") === "on";

  const chapter = await createChapterRecord({
    name: parsed.data.name,
    institution: parsed.data.institution,
    city: parsed.data.city,
    state: parsed.data.state,
    description: parsed.data.description || null,
    contactEmail: parsed.data.contactEmail || null,
    status: activate ? "ACTIVE" : "PENDING",
    actor,
    ip,
  });

  updateTag("chapters");
  revalidatePath("/portal/chapters");

  return {
    status: "success",
    message: activate
      ? `Chapter ${chapter.code} created and activated.`
      : `Chapter ${chapter.code} created as pending. Activate it when the club is ready.`,
    success: activate
      ? `Chapter ${chapter.code} created and activated.`
      : `Chapter ${chapter.code} created as pending. Activate it when the club is ready.`,
    result: { code: chapter.code, id: chapter.id },
  };
}

export async function setChapterStatusAction(formData: FormData) {
  const actor = await requireAgid();
  const ip = await requestIp();

  const chapterId = String(formData.get("chapterId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["ACTIVE", "PENDING", "SUSPENDED", "DEACTIVATED"].includes(status)) {
    throw new Error("Unsupported chapter status");
  }

  await setChapterStatus({
    chapterId,
    status: status as "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED",
    actor,
    ip,
  });

  updateTag("chapters");
  revalidatePath("/portal/chapters");
  revalidatePath(`/portal/chapters/${chapterId}`);
  revalidatePath(`/portal/chapters/${chapterId}/status`);
}

export async function updateChapterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAgid();
  const ip = await requestIp();
  const chapterId = String(formData.get("chapterId") ?? "");

  const parsed = parseForm(chapterSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the chapter details.", errors: parsed.errors };
  }

  const chapter = await db.chapter.update({
    where: { id: chapterId },
    data: {
      name: parsed.data.name,
      institution: parsed.data.institution,
      city: parsed.data.city,
      state: parsed.data.state,
      description: parsed.data.description || null,
      contactEmail: parsed.data.contactEmail || null,
    },
    select: { id: true, name: true },
  });

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "chapter.update",
    entityType: "Chapter",
    entityId: chapter.id,
    ip,
  });

  updateTag("chapters");
  revalidatePath(`/portal/chapters/${chapterId}`);

  return {
    status: "success",
    message: "Chapter details updated.",
    success: "Chapter details updated.",
  };
}

export async function issueInvitationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAgid();
  const ip = await requestIp();

  const guard = await rateLimit(`invite:${actor.id}`, 40, 15 * 60 * 1000);
  if (!guard.ok) {
    return {
      status: "error",
      message: "Too many invitations issued. Please wait a few minutes.",
    };
  }

  const parsed = parseForm(invitationSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the invitation details.", errors: parsed.errors };
  }

  const role = parsed.data.role;
  const chapterId = parsed.data.chapterId || null;

  try {
    const invitation = await issueInvitation({
      email: parsed.data.email,
      role,
      chapterId,
      name: parsed.data.name || null,
      actor,
      ip,
    });

    revalidatePath("/portal/invitations");

    const success = invitation.delivered
      ? `Invitation sent to ${parsed.data.email}.`
      : `Invitation created. ${invitation.deliveryNote} Code: ${invitation.code}`;

    return {
      status: "success",
      message: success,
      success,
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

export async function revokeInvitationAction(formData: FormData) {
  const actor = await requireAgid();
  const ip = await requestIp();
  const invitationId = String(formData.get("invitationId") ?? "");

  const invitation = await db.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
    select: { id: true, email: true },
  });

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "invitation.revoke",
    entityType: "Invitation",
    entityId: invitation.id,
    ip,
    metadata: { email: invitation.email },
  });

  revalidatePath("/portal/invitations");
}

export async function reviewChapterApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAgid();
  const ip = await requestIp();

  const applicationId = String(formData.get("id") ?? "");
  const reject = formData.get("reject") !== null;

  const application = await db.chapterApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) {
    return { status: "error", message: "Application not found." };
  }
  if (application.status !== "PENDING") {
    return {
      status: "error",
      message: `This application was already ${application.status.toLowerCase()}.`,
    };
  }

  const proposedName = String(formData.get("proposedName") ?? application.proposedName).trim();
  const institution = String(formData.get("institution") ?? application.institution).trim();
  const city = String(formData.get("city") ?? application.city).trim();
  const stateName = String(formData.get("state") ?? application.state).trim();
  const contactName = String(formData.get("contactName") ?? application.contactName).trim();
  const contactEmail = String(formData.get("contactEmail") ?? application.contactEmail)
    .trim()
    .toLowerCase();
  const motivation = String(formData.get("motivation") ?? application.motivation).trim();
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim() || null;

  if (reject) {
    await db.chapterApplication.update({
      where: { id: application.id },
      data: {
        status: "REJECTED",
        reviewedById: actor.id,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    await writeAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: "chapter_application.reject",
      entityType: "ChapterApplication",
      entityId: application.id,
      ip,
      metadata: { institution: application.institution, decision: "rejected" },
    });

    revalidatePath("/portal/applications");
    revalidatePath(`/portal/applications/chapter/${application.id}/review`);

    return {
      status: "success",
      message: "Application rejected.",
      success: "Application rejected.",
    };
  }

  // Approve: light validation on edited fields before creating the chapter.
  const errors: Record<string, string[]> = {};
  if (proposedName.length < 3) errors.proposedName = ["Enter the proposed chapter name"];
  if (institution.length < 3) errors.institution = ["Enter the institution name"];
  if (city.length < 2) errors.city = ["Enter a city"];
  if (stateName.length < 2) errors.state = ["Enter a state"];
  if (contactName.length < 2) errors.contactName = ["Enter the contact name"];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.contactEmail = ["Enter a valid contact email"];
  }
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Check the highlighted fields.", errors };
  }

  const chapter = await createChapterRecord({
    name: proposedName,
    institution,
    city,
    state: stateName,
    contactEmail,
    status: "PENDING",
    actor,
    ip,
  });

  let invitationNote = "";
  try {
    const invitation = await issueInvitation({
      email: contactEmail,
      role: "CHAPTER_ADMIN",
      chapterId: chapter.id,
      name: contactName,
      actor,
      ip,
    });
    invitationNote = invitation.delivered
      ? ` An invitation was emailed to ${contactEmail}.`
      : ` Give the applicant this activation code: ${invitation.code}`;
  } catch (error) {
    invitationNote = ` The chapter was created, but the invitation failed: ${
      error instanceof Error ? error.message : "unknown error"
    }`;
  }

  await db.chapterApplication.update({
    where: { id: application.id },
    data: {
      status: "APPROVED",
      reviewedById: actor.id,
      reviewedAt: new Date(),
      reviewNotes,
      proposedName,
      institution,
      city,
      state: stateName,
      contactName,
      contactEmail,
      motivation,
    },
  });

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "chapter_application.approve",
    entityType: "ChapterApplication",
    entityId: application.id,
    ip,
    metadata: { institution, chapterId: chapter.id, code: chapter.code, decision: "approved" },
  });

  updateTag("chapters");
  revalidatePath("/portal/applications");
  revalidatePath(`/portal/applications/chapter/${application.id}/review`);
  revalidatePath("/portal/chapters");

  return {
    status: "success",
    message: `Approved. Chapter ${chapter.code} created as pending | activate it when ready.${invitationNote}`,
    success: `Approved. Chapter ${chapter.code} created as pending | activate it when ready.${invitationNote}`,
    result: { code: chapter.code, chapterId: chapter.id },
  };
}

export async function reviewJoinApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAgid();
  const ip = await requestIp();

  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim() || null;

  if (!["APPROVED", "REJECTED"].includes(decision)) {
    return { status: "error", message: "Choose approve or reject." };
  }

  const application = await db.joinApplication.findUniqueOrThrow({
    where: { id: applicationId },
  });

  if (decision === "REJECTED") {
    await db.joinApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        reviewedById: actor.id,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    await writeAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: "join_application.reject",
      entityType: "JoinApplication",
      entityId: applicationId,
      ip,
      metadata: { decision: "rejected" },
    });

    revalidatePath("/portal/applications");
    return {
      status: "success",
      message: "Application rejected.",
      success: "Application rejected.",
    };
  }

  const chapter =
    application.chapterCode && application.chapterCode.trim()
      ? await db.chapter.findUnique({
          where: { code: application.chapterCode.trim().toUpperCase() },
          select: { id: true, status: true },
        })
      : null;

  if (!chapter || chapter.status !== "ACTIVE") {
    return {
      status: "error",
      message:
        "Approving this application needs an activated chapter. Activate the chapter first, then approve.",
    };
  }

  let invitation;
  try {
    invitation = await issueInvitation({
    email: application.email,
    role: "MEMBER",
    chapterId: chapter.id,
      name: application.fullName,
      actor,
      ip,
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The invitation could not be issued. Try again.",
    };
  }

  await db.joinApplication.update({
    where: { id: applicationId },
    data: {
      status: "APPROVED",
      reviewedById: actor.id,
      reviewedAt: new Date(),
      reviewNotes,
    },
  });

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "join_application.approve",
    entityType: "JoinApplication",
    entityId: applicationId,
    ip,
    metadata: {
      chapterId: chapter.id,
      invitationCode: invitation.code,
      decision: "approved",
    },
  });

  revalidatePath("/portal/applications");
  revalidatePath("/portal/invitations");

  return {
    status: "success",
    message: `Approved. ${application.fullName} was invited to the chapter.`,
    success: `Approved. ${application.fullName} was invited to the chapter.`,
  };
}

export async function updateMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireRole(["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN"]);
  const ip = await requestIp();
  const memberId = String(formData.get("memberId") ?? "");

  const parsed = parseForm(memberUpdateSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Check the member details.", errors: parsed.errors };
  }

  const existing = await db.memberProfile.findUnique({
    where: { id: memberId },
    select: { id: true, userId: true, chapterId: true },
  });
  if (!existing) return { status: "error", message: "Member record not found." };

  if (actor.role === "CHAPTER_ADMIN" && actor.chapterId !== existing.chapterId) {
    return { status: "error", message: "You can only manage members of your own chapter." };
  }

  await db.memberProfile.update({
    where: { id: memberId },
    data: {
      fullName: parsed.data.fullName,
      department: parsed.data.department || null,
      academicLevel: parsed.data.academicLevel || null,
      membershipCategory: parsed.data.membershipCategory,
      gender: parsed.data.gender,
      position: parsed.data.position || null,
      isExecutive: parsed.data.isExecutive === "on",
      status: parsed.data.status,
    },
  });

  await db.user.update({
    where: { id: existing.userId },
    data: { status: parsed.data.status, name: parsed.data.fullName },
  });

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "member.update",
    entityType: "MemberProfile",
    entityId: memberId,
    ip,
    metadata: { position: parsed.data.position ?? null, status: parsed.data.status },
  });

  revalidatePath(`/portal/members/${memberId}`);
  revalidatePath("/portal/members");
  if (existing.chapterId) revalidatePath(`/portal/chapters/${existing.chapterId}/members`);

  return {
    status: "success",
    message: "Member record updated.",
    success: "Member record updated.",
  };
}

export async function createAgidAdminAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAgid();
  const ip = await requestIp();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !name || password.length < 10) {
    return {
      status: "error",
      message: "Provide a name, email and a password of 10+ characters.",
    };
  }

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { status: "error", message: "That email already has an account." };

  const user = await db.user.create({
    data: {
      email,
      name,
      role: "AGID_ADMIN",
      status: "ACTIVE",
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
    },
    select: { id: true },
  });

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "user.create_agid_admin",
    entityType: "User",
    entityId: user.id,
    ip,
    metadata: { email },
  });

  return {
    status: "success",
    message: `${name} can now sign in as a GLANCE administrator.`,
    success: `${name} can now sign in as a GLANCE administrator.`,
  };
}

/**
 * Returns the authorised CSV export URL for the caller. The route handler
 * re-checks permissions server-side; this helper never exposes data itself.
 */
export async function exportMembersCsv(chapterId?: string): Promise<string> {
  return chapterId
    ? `/api/export/members?chapterId=${encodeURIComponent(chapterId)}`
    : "/api/export/members";
}
