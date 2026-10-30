import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200, "Password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

const name = z.string().trim().min(2, "Enter a full name").max(120);
const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(25)
  .regex(/^[+0-9()\-\s]+$/, "Use digits, spaces and + only");

export const academicLevels = [
  "YEAR_1",
  "YEAR_2",
  "YEAR_3",
  "YEAR_4",
  "YEAR_5",
  "ND",
  "HND",
  "PGD",
  "MASTERS",
  "DOCTORATE",
  "OTHER",
] as const;

export const membershipCategories = ["STUDENT", "NON_STUDENT", "ALUMNI"] as const;
export const genders = ["FEMALE", "MALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

export const accountSchema = z.object({
  name,
  email,
  phone: phone.optional().or(z.literal("")),
  gender: z.enum(genders).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  academicLevel: z.enum(academicLevels).optional().or(z.literal("")),
  position: z.string().trim().max(120).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  /** Chapter administrators confirm the chapter code assigned to their account. */
  chapterCode: z.string().trim().max(40).optional().or(z.literal("")),
  /**
   * Which login card was used. The backend only uses this to confirm the
   * account's real role (from the database) matches; it never grants access.
   */
  loginContext: z.enum(["NETWORK_OFFICER", "CHAPTER_ADMIN", "COMM_MANAGER"]).optional(),
});

export const joinApplicationSchema = z.object({
  fullName: name,
  email,
  phone,
  institution: z.string().trim().min(3, "Enter your institution or community").max(160),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  chapterCode: z.string().trim().max(40).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  academicLevel: z.enum(academicLevels).optional().or(z.literal("")),
  membershipCategory: z.enum(membershipCategories),
  gender: z.enum(genders),
  motivation: z
    .string()
    .trim()
    .min(40, "Tell us in at least 40 characters why you want to join")
    .max(2000),
  consent: z.literal("on", { message: "Consent is required to process your application" }),
});

export const chapterApplicationSchema = z.object({
  institution: z.string().trim().min(3, "Enter the institution name").max(160),
  proposedName: z.string().trim().min(3, "Enter the proposed chapter name").max(160),
  city: z.string().trim().min(2, "Enter a city").max(80),
  state: z.string().trim().min(2, "Enter a state").max(80),
  contactName: name,
  contactEmail: email,
  contactPhone: phone,
  contactRole: z.string().trim().max(120).optional().or(z.literal("")),
  motivation: z
    .string()
    .trim()
    .min(60, "Describe your motivation in at least 60 characters")
    .max(3000),
  consent: z.literal("on", { message: "Consent is required to submit an application" }),
});

export const contactSchema = z.object({
  name,
  email,
  subject: z.string().trim().min(3, "Enter a subject").max(160),
  message: z.string().trim().min(20, "Enter at least 20 characters").max(4000),
});

export const invitationSchema = z.object({
  email,
  role: z.enum(["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN", "COMM_MANAGER", "MEMBER"]),
  chapterId: z.string().trim().min(1, "Select a chapter").optional().or(z.literal("")),
  name: z.string().trim().max(120).optional().or(z.literal("")),
});

export const activateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(6, "Enter your activation code")
      .max(20),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: name,
  phone: phone.optional().or(z.literal("")),
  institution: z.string().trim().min(3).max(160),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  academicLevel: z.enum(academicLevels).optional().or(z.literal("")),
  gender: z.enum(genders),
  membershipCategory: z.enum(membershipCategories),
});

export const chapterSchema = z.object({
  name: z.string().trim().min(3, "Enter the chapter name").max(160),
  institution: z.string().trim().min(3, "Enter the institution").max(160),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  contactEmail: email.optional().or(z.literal("")),
});

export const reportSchema = z.object({
  title: z.string().trim().min(3, "Enter a title").max(160),
  summary: z.string().trim().min(20, "Summarise the activity").max(3000),
  activityDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
  attendeeCount: z.coerce.number().int().min(0).max(100000).optional(),
});

export const memberUpdateSchema = z.object({
  fullName: name,
  department: z.string().trim().max(120).optional().or(z.literal("")),
  academicLevel: z.enum(academicLevels).optional().or(z.literal("")),
  membershipCategory: z.enum(membershipCategories),
  gender: z.enum(genders),
  position: z.string().trim().max(120).optional().or(z.literal("")),
  isExecutive: z.enum(["on", "off"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"]),
});

export const resetRequestSchema = z.object({ email });
export const resetSchema = z
  .object({
    token: z.string().trim().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Success message rendered by client forms. */
  success?: string;
  error?: string;
  errors?: Record<string, string[]>;
  /**
   * Stable, non-sensitive code for the analytics contract. Never user text
   * and never a field value.
   */
  reason?: "invalid_fields" | "unknown_chapter" | "rate_limited";
  /** Data the UI needs to display after a successful action. */
  result?: Record<string, string>;
};

export type ValidationError = string | string[];

/** Cheap server-side email validation shared by actions and lifecycle code. */
export function validateEmail(value: string) {
  return email.safeParse(value).success;
}

export const idleFormState: FormState = { status: "idle" };

/** Validates FormData against a schema and normalises error reporting. */
export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
):
  | { success: true; data: z.output<T> }
  | { success: false; errors: Record<string, string[]> } {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") raw[key] = value;
  }

  const parsed = schema.safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };

  const errors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "form";
    errors[key] = [...(errors[key] ?? []), issue.message];
  }
  return { success: false, errors };
}
