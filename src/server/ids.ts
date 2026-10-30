import "server-only";

import { randomInt } from "node:crypto";
import { db } from "./db";

/** Crockford-style alphabet: no I, L, O, U to avoid transcription errors. */
const HUMAN_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomCode(length: number) {
  let out = "";
  for (let index = 0; index < length; index += 1) {
    out += HUMAN_ALPHABET[randomInt(0, HUMAN_ALPHABET.length)];
  }
  return out;
}

/** Unique, traceable member ID, e.g. GLN-2026-7KQ2MA. */
export async function generateMemberCode(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `GLN-${year}-${randomCode(6)}`;
    const existing = await db.memberProfile.findUnique({
      where: { memberCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Unable to allocate a unique member code");
}

/** Short code a member can type to activate an invitation, e.g. GLN7KQ2M. */
export async function generateInvitationCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `GLN${randomCode(6)}`;
    const existing = await db.invitation.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Unable to allocate a unique invitation code");
}

const STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "for",
  "at",
  "in",
  "a",
  "federal",
  "university",
  "polytechnic",
  "college",
]);

function institutionInitials(institution: string) {
  const words = institution
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()));

  const letters = words.map((word) => word[0]!.toUpperCase()).join("");
  return (letters || "GL").slice(0, 3);
}

/**
 * Chapter code issued by GLANCE, e.g. GLN-UI-001.
 * The sequence is scoped to the institution initials so codes stay readable.
 */
export async function generateChapterCode(institution: string): Promise<string> {
  const prefix = `GLN-${institutionInitials(institution)}-`;

  const existing = await db.chapter.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  });

  let highest = 0;
  for (const chapter of existing) {
    const value = Number.parseInt(chapter.code.slice(prefix.length), 10);
    if (Number.isFinite(value) && value > highest) highest = value;
  }

  for (let next = highest + 1; next < highest + 50; next += 1) {
    const code = `${prefix}${String(next).padStart(3, "0")}`;
    const clash = await db.chapter.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!clash) return code;
  }

  throw new Error("Unable to allocate a unique chapter code");
}

/** Human-readable reference for an application, e.g. APP-4J7K2Q. */
export function generateApplicationReference() {
  return `APP-${randomCode(6)}`;
}

/** URL-safe slug for content and chapters. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
