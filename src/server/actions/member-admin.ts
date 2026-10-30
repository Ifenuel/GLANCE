"use server";

import { revalidatePath } from "next/cache";
import { AcademicLevel, Gender, MembershipCategory } from "@prisma/client";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { requestIp, writeAudit } from "@/server/audit";
import { generateMemberCode } from "@/server/ids";
import type { FormState } from "@/server/validation";

const ACADEMIC_LEVELS: AcademicLevel[] = [
  "YEAR_1", "YEAR_2", "YEAR_3", "YEAR_4", "YEAR_5",
  "ND", "HND", "PGD", "MASTERS", "DOCTORATE", "OTHER",
];
const GENDERS: Gender[] = ["FEMALE", "MALE", "OTHER", "PREFER_NOT_TO_SAY"];
const CATEGORIES: MembershipCategory[] = ["STUDENT", "NON_STUDENT", "ALUMNI"];

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Direct member registration. Only the GLANCE Network Officer (or Super
 * Admin — who may act network-wide) and Chapter Administrators (scoped to
 * their own chapter, enforced here) can create members. The unique GLANCE
 * member ID is generated server-side, the record is ACTIVE immediately, and
 * the digital ID card is available at once.
 */
export async function registerDirectMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireUser();
  if (!["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN"].includes(actor.role)) {
    return { status: "error", message: "You are not allowed to register members." };
  }

  const ip = await requestIp();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const requestedChapterId = String(formData.get("chapterId") ?? "");
  const department = String(formData.get("department") ?? "").trim();
  const academicLevelRaw = String(formData.get("academicLevel") ?? "").trim();
  const matricNo = String(formData.get("matricNo") ?? "").trim();
  const genderRaw = String(formData.get("gender") ?? "PREFER_NOT_TO_SAY");
  const position = String(formData.get("position") ?? "").trim();
  const categoryRaw = String(formData.get("membershipCategory") ?? "STUDENT");

  // Chapter scope decided on the server, never by the form.
  let chapterId: string;
  if (actor.role === "CHAPTER_ADMIN") {
    if (!actor.chapterId) {
      return { status: "error", message: "Your account is not assigned to a chapter." };
    }
    chapterId = actor.chapterId;
  } else {
    chapterId = requestedChapterId;
  }

  const errors: Record<string, string[]> = {};
  if (fullName.length < 3) errors.fullName = ["Enter the member's full name"];
  if (!emailOk(email)) errors.email = ["Enter a valid email address"];
  if (!chapterId) errors.chapterId = ["Choose the chapter"];
  const academicLevel = ACADEMIC_LEVELS.includes(academicLevelRaw as AcademicLevel)
    ? (academicLevelRaw as AcademicLevel)
    : null;
  if (!academicLevel) errors.academicLevel = ["Select the academic level"];
  const gender = GENDERS.includes(genderRaw as Gender) ? (genderRaw as Gender) : "PREFER_NOT_TO_SAY";
  const membershipCategory = CATEGORIES.includes(categoryRaw as MembershipCategory)
    ? (categoryRaw as MembershipCategory)
    : "STUDENT";

  const chapter = chapterId
    ? await db.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, institution: true, name: true, status: true },
      })
    : null;
  if (!chapter || chapter.status !== "ACTIVE") {
    errors.chapterId = ["Choose an active chapter"];
  }

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Check the highlighted fields.", errors };
  }

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return {
      status: "error",
      message: "That email already has a GLANCE account.",
      errors: { email: ["Already in use"] },
    };
  }

  const memberCode = await generateMemberCode();

  const created = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: fullName,
        phone: phone || null,
        role: "MEMBER",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        chapterId: chapter!.id,
      },
      select: { id: true },
    });
    const profile = await tx.memberProfile.create({
      data: {
        userId: user.id,
        fullName,
        memberCode,
        institution: chapter!.institution,
        chapterId: chapter!.id,
        department: department || null,
        academicLevel,
        matricNo: matricNo || null,
        gender,
        position: position || null,
        membershipCategory,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    return { userId: user.id, profileId: profile.id };
  });

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "member.create",
    entityType: "MemberProfile",
    entityId: created.profileId,
    ip,
    metadata: { email, memberCode, matricNo: matricNo || null, chapterId: chapter!.id },
  });

  revalidatePath("/portal/members");
  revalidatePath("/portal/chapters");
  if (actor.role === "CHAPTER_ADMIN") {
    revalidatePath("/portal/chapter");
    revalidatePath("/portal/dashboard");
  }

  return {
    status: "success",
    message: `${fullName} registered as ${memberCode} in ${chapter!.name}.`,
    result: { memberCode, memberId: created.profileId },
  };
}
