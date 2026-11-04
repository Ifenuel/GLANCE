import { describe, expect, it } from "vitest";
import {
  chapterApplicationSchema,
  contactSchema,
  joinApplicationSchema,
  resetRequestSchema,
  rsvpSchema,
  subscribeSchema,
} from "@/server/validation";

/**
 * These are the gates every public form passes through. A regression here is a
 * spam hole or a blocked genuine applicant, so the rules are pinned.
 */

describe("newsletter subscribe", () => {
  it("accepts an email address alone", () => {
    const result = subscribeSchema.safeParse({ email: "student@uni.edu.ng" });
    expect(result.success).toBe(true);
  });

  it("normalises the address to lower case", () => {
    const result = subscribeSchema.parse({ email: "Student@UNI.edu.ng" });
    expect(result.email).toBe("student@uni.edu.ng");
  });

  it("rejects a malformed address", () => {
    expect(subscribeSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a missing address", () => {
    expect(subscribeSchema.safeParse({}).success).toBe(false);
  });
});

describe("event RSVP", () => {
  const base = {
    eventId: "event_123",
    name: "Ada Obi",
    email: "ada@example.com",
  };

  it("accepts a reservation with no guests", () => {
    const result = rsvpSchema.safeParse({ ...base, guests: "0" });
    expect(result.success).toBe(true);
  });

  it("coerces the guest count from a form string", () => {
    const result = rsvpSchema.parse({ ...base, guests: "3" });
    expect(result.guests).toBe(3);
  });

  it("rejects more guests than a card can hold", () => {
    expect(rsvpSchema.safeParse({ ...base, guests: "11" }).success).toBe(false);
  });

  it("rejects a negative guest count", () => {
    expect(rsvpSchema.safeParse({ ...base, guests: "-1" }).success).toBe(false);
  });

  it("requires an event id", () => {
    expect(rsvpSchema.safeParse({ ...base, eventId: "", guests: "0" }).success).toBe(
      false,
    );
  });

  it("accepts an optional phone number and rejects a nonsense one", () => {
    expect(
      rsvpSchema.safeParse({ ...base, phone: "+234 801 234 5678", guests: "1" }).success,
    ).toBe(true);
    expect(rsvpSchema.safeParse({ ...base, phone: "call me", guests: "1" }).success).toBe(
      false,
    );
  });
});

describe("contact form", () => {
  it("requires consent", () => {
    const withoutConsent = contactSchema.safeParse({
      name: "Ada Obi",
      email: "ada@example.com",
      subject: "Membership enquiry",
      message: "I would like to know how to start a chapter at my university.",
    });
    expect(withoutConsent.success).toBe(false);
  });

  it("accepts a complete message", () => {
    const result = contactSchema.safeParse({
      name: "Ada Obi",
      email: "ada@example.com",
      subject: "Membership enquiry",
      message: "I would like to know how to start a chapter at my university.",
      consent: "on",
    });
    expect(result.success).toBe(true);
  });
});

describe("join application", () => {
  const base = {
    fullName: "Ada Obi",
    email: "ada@example.com",
    phone: "+2348012345678",
    institution: "University of Lagos",
    membershipCategory: "STUDENT" as const,
    gender: "FEMALE" as const,
    motivation:
      "I want to build a chapter that solves real problems on my campus and learn how policy actually works.",
    consent: "on" as const,
  };

  it("accepts a complete application", () => {
    expect(joinApplicationSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a motivation that is too thin to review", () => {
    expect(
      joinApplicationSchema.safeParse({ ...base, motivation: "I like it" }).success,
    ).toBe(false);
  });
});

describe("chapter application", () => {
  it("requires the contact email to be valid", () => {
    const result = chapterApplicationSchema.safeParse({
      institution: "University of Lagos",
      proposedName: "GLANCE Unilag",
      city: "Lagos",
      state: "Lagos",
      contactName: "Ada Obi",
      contactEmail: "broken",
      contactPhone: "+2348012345678",
      motivation:
        "Our campus needs a structured leadership club with real civic projects behind it.",
    });
    expect(result.success).toBe(false);
  });
});

describe("password reset request", () => {
  it("accepts a valid address and rejects an invalid one", () => {
    expect(resetRequestSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
    expect(resetRequestSchema.safeParse({ email: "ada" }).success).toBe(false);
  });
});
