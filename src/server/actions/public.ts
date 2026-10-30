"use server";

import { updateTag } from "next/cache";
import { db } from "@/server/db";
import { requestIp, writeAudit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { sendTransactionalEmail, joinApplicationReceivedEmail } from "@/server/email";
import {
  chapterApplicationSchema,
  contactSchema,
  joinApplicationSchema,
  parseForm,
  type FormState,
} from "@/server/validation";

async function limited(ip: string | null, scope: string) {
  return rateLimit(`${scope}:${ip ?? "unknown"}`, 5, 60 * 60 * 1000);
}

export async function submitJoinApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await limited(ip, "join-application");
  if (!guard.ok) {
    return {
      status: "error",
      message: `Too many submissions from this network. Try again in ${Math.ceil(
        guard.retryAfterSeconds / 60,
      )} minutes.`,
      reason: "rate_limited",
    };
  }

  const parsed = parseForm(joinApplicationSchema, formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      errors: parsed.errors,
      reason: "invalid_fields",
    };
  }

  const data = parsed.data;

  if (data.chapterCode) {
    const chapter = await db.chapter.findFirst({
      where: { code: data.chapterCode.trim().toUpperCase(), status: "ACTIVE" },
      select: { id: true },
    });
    if (!chapter) {
      return {
        status: "error",
        message: "That chapter code is not an activated GLANCE chapter.",
        errors: { chapterCode: ["Unknown or inactive chapter code"] },
        reason: "unknown_chapter",
      };
    }
  }

  const duplicate = await db.joinApplication.findFirst({
    where: { email: data.email, status: "PENDING" },
    select: { id: true },
  });
  if (duplicate) {
    return {
      status: "success",
      message:
        "You already have an application under review. The relevant administrator will contact you.",
    };
  }

  const application = await db.joinApplication.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      institution: data.institution,
      state: data.state || null,
      chapterCode: data.chapterCode ? data.chapterCode.trim().toUpperCase() : null,
      department: data.department || null,
      academicLevel: data.academicLevel || null,
      membershipCategory: data.membershipCategory,
      gender: data.gender,
      motivation: data.motivation,
      consentAt: new Date(),
    },
    select: { id: true },
  });

  await writeAudit({
    action: "join_application.submit",
    entityType: "JoinApplication",
    entityId: application.id,
    ip,
    metadata: { email: data.email, institution: data.institution },
  });

  await sendTransactionalEmail(
    joinApplicationReceivedEmail({ to: data.email, name: data.fullName }),
  );

  return {
    status: "success",
    message:
      "Application received. If approved, you will receive an invitation with an activation code.",
    result: { reference: application.id.slice(-8).toUpperCase() },
  };
}

export async function submitChapterApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await limited(ip, "chapter-application");
  if (!guard.ok) {
    return {
      status: "error",
      message: `Too many submissions from this network. Try again in ${Math.ceil(
        guard.retryAfterSeconds / 60,
      )} minutes.`,
    };
  }

  const parsed = parseForm(chapterApplicationSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Please correct the highlighted fields.", errors: parsed.errors };
  }

  const data = parsed.data;

  const existing = await db.chapterApplication.findFirst({
    where: { institution: data.institution, status: "PENDING" },
    select: { id: true },
  });
  if (existing) {
    return {
      status: "success",
      message: "An application for this institution is already with GLANCE for review.",
    };
  }

  const application = await db.chapterApplication.create({
    data: {
      institution: data.institution,
      proposedName: data.proposedName,
      city: data.city,
      state: data.state,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      contactRole: data.contactRole || null,
      motivation: data.motivation,
    },
    select: { id: true },
  });

  await writeAudit({
    action: "chapter_application.submit",
    entityType: "ChapterApplication",
    entityId: application.id,
    ip,
    metadata: { institution: data.institution, contactEmail: data.contactEmail },
  });

  return {
    status: "success",
    message:
      "Application received. GLANCE reviews chapter applications before a club is activated.",
  };
}

export async function submitContactMessageAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await requestIp();
  const guard = await limited(ip, "contact");
  if (!guard.ok) {
    return {
      status: "error",
      message: "Too many messages sent from this network. Please try again later.",
    };
  }

  const parsed = parseForm(contactSchema, formData);
  if (!parsed.success) {
    return { status: "error", message: "Please correct the highlighted fields.", errors: parsed.errors };
  }

  const message = await db.contactMessage.create({
    data: parsed.data,
    select: { id: true },
  });

  await writeAudit({
    action: "contact.submit",
    entityType: "ContactMessage",
    entityId: message.id,
    ip,
    metadata: { email: parsed.data.email, subject: parsed.data.subject },
  });

  updateTag("contact-messages");

  return {
    status: "success",
    message:
      "Message received. The GLANCE secretariat responds to enquiries during working days.",
  };
}
