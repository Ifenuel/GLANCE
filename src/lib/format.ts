const ACADEMIC_LEVEL_LABELS: Record<string, string> = {
  YEAR_1: "Year 1",
  YEAR_2: "Year 2",
  YEAR_3: "Year 3",
  YEAR_4: "Year 4",
  YEAR_5: "Year 5",
  ND: "National Diploma",
  HND: "Higher National Diploma",
  PGD: "Postgraduate Diploma",
  MASTERS: "Master's degree",
  DOCTORATE: "Doctorate",
  OTHER: "Other",
};

const MEMBERSHIP_LABELS: Record<string, string> = {
  STUDENT: "Student member",
  NON_STUDENT: "Non-student participant",
  ALUMNI: "Alumni member",
};

const GENDER_LABELS: Record<string, string> = {
  FEMALE: "Female",
  MALE: "Male",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DEACTIVATED: "Deactivated",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
  ACCEPTED: "Accepted",
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CANCELLED: "Cancelled",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Administrator",
  AGID_ADMIN: "GLANCE team",
  COMM_MANAGER: "Communications",
  CHAPTER_ADMIN: "Chapter coordinator",
  MEMBER: "Member",
  ALUMNI: "Alumni",
};

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "News",
  STORY: "Impact story",
  ANNOUNCEMENT: "Announcement",
};

function label(map: Record<string, string>, value: string) {
  return map[value] ?? value.replaceAll("_", " ").toLowerCase();
}

export const academicLevelLabel = (value?: string | null) =>
  value ? label(ACADEMIC_LEVEL_LABELS, value) : "Not provided";

export const membershipLabel = (value?: string | null) =>
  value ? label(MEMBERSHIP_LABELS, value) : "Not provided";

export const genderLabel = (value?: string | null) =>
  value ? label(GENDER_LABELS, value) : "Prefer not to say";

export const statusLabel = (value?: string | null) =>
  value ? label(STATUS_LABELS, value) : "Unknown";

export const roleLabel = (value?: string | null) =>
  value ? label(ROLE_LABELS, value) : "Unknown";

export const postCategoryLabel = (value?: string | null) =>
  value ? label(CATEGORY_LABELS, value) : "News";

export function formatDate(value?: Date | string | null) {
  if (!value) return "Not recorded";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "Not recorded";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

/**
 * "just now", "12 minutes ago", "3 hours ago", then a date past a week.
 * Activity feeds read far better this way than with a bare date, which never
 * tells you whether something happened today or last month.
 */
export function formatRelativeTime(value?: Date | string | null) {
  if (!value) return "n/a";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "n/a";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
  ];
  let amount = seconds;
  for (const [unit, step] of units) {
    if (Math.abs(amount) < step) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        -Math.round(amount),
        unit,
      );
    }
    amount /= step;
  }
  return formatDate(date);
}

/** "just now" for a few seconds, otherwise a clock time with the date. */
export function formatTimestamp(value?: Date | string | null) {
  if (!value) return "n/a";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "n/a";
  const relative = formatRelativeTime(date);
  if (relative === "just now") return relative;
  return `${relative} · ${new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date)} UTC`;
}
