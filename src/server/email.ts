import "server-only";

import { SITE_URL } from "@/lib/site";

/**
 * Transactional email — Brevo (https://api.brevo.com/v3/smtp/email).
 *
 * Configure with BREVO_API_KEY and a verified sender. Until the key is set,
 * `sendTransactionalEmail` reports `delivered: false` and the caller surfaces
 * the activation details inside the portal | nothing is silently discarded and
 * no email is ever faked.
 */

export type MailPayload = {
  to: string;
  subject: string;
  heading: string;
  body: string[];
  action?: { label: string; url: string };
  workflow: string;
  data?: Record<string, string>;
};

export type MailResult =
  | { delivered: true; provider: "brevo"; id?: string }
  | {
      delivered: false;
      reason: "not-configured" | "provider-error";
      detail?: string;
    };

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const BRAND_NAME = "GLANCE";
const FALLBACK_SENDER = "no-reply@glance.org.ng";
const NAVY = "#0A2550";
const GOLD = "#EAAE14";
const INK = "#46566D";
const LINE = "#e3e9f1";

/** Public site origin, used for logo, links and the footer. */
function appOrigin() {
  return SITE_URL;
}

const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

/** Small uppercase label that tells the reader what kind of message this is. */
const WORKFLOW_EYEBROWS: Record<string, string> = {
  "glance-invitation": "You are invited",
  "glance-password-reset": "Account security",
  "glance-join-received": "Membership application",
  "glance-chapter-activated": "Chapter activation",
  "glance-email-change-confirmation": "Confirm your new address",
  "glance-email-changed-notice": "Security notice",
  "glance-activity-report": "Chapter activity report",
};

function sender() {
  const name = process.env.INVITE_EMAIL_NAME?.trim() || BRAND_NAME;
  const raw =
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    process.env.INVITE_EMAIL_FROM?.trim() ||
    "";
  // Accepts both "a@b.c" and "Name <a@b.c>" formats; extracts the bare address.
  const email = raw.match(/[\w.+-]+@[\w.-]+\.[\w]+/)?.[0] ?? FALLBACK_SENDER;
  return { name, email };
}

export function emailDeliveryConfigured() {
  return Boolean(process.env.BREVO_API_KEY);
}

function renderText(payload: MailPayload) {
  const lines = [payload.heading, "", ...payload.body];
  if (payload.action) {
    lines.push("", `${payload.action.label}: ${payload.action.url}`);
  }
  lines.push(
    "",
    "--",
    "GLANCE | Governance, Leadership and National Civic Engagement",
    "A structured leadership and civic engagement club for tertiary institutions across Africa.",
    `Website: ${appOrigin()}`,
    `Contact: ${SECRETARIAT_CONTACT}`,
    "This is a transactional message about your GLANCE account or a GLANCE activity.",
  );
  return lines.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const SECRETARIAT_CONTACT =
  process.env.GLANCE_SECRETARIAT_EMAIL?.trim() || "info@glance.org.ng";

/**
 * One professional email frame shared by every message GLANCE sends:
 * white brand header with the GLANCE lockup and a gold rule, an eyebrow that
 * names the message, a clear heading, the copy, an optional activation-code
 * panel, a gold call-to-action button, and a navy footer carrying the
 * website, the contact address and why the reader received the mail.
 * Everything is inline and table-based so it holds up in Gmail, Outlook,
 * Apple Mail and on phones.
 */
export function renderMailHtml(payload: MailPayload): string {
  const origin = appOrigin();
  const eyebrow = WORKFLOW_EYEBROWS[payload.workflow] ?? "GLANCE Secretariat";
  const logoUrl = `${origin}/_brand/glance-lockup.png`;

  const paragraphs = payload.body
    .filter((line) => line.trim().length > 0)
    .map(
      (line) =>
        `<p style="margin:0 0 15px;font-family:${FONT};font-size:15px;line-height:1.68;color:${INK};">${escapeHtml(line)}</p>`,
    );

  const codeBox = payload.data?.activation_code
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 20px;border-collapse:separate;">
         <tr><td style="background:#fdf6e3;border:1px solid #f2dfa4;border-left:4px solid ${GOLD};border-radius:10px;padding:16px 20px;text-align:center;">
           <p style="margin:0 0 7px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8a6100;">Your activation code</p>
           <p style="margin:0;font-size:25px;line-height:1.2;font-weight:800;letter-spacing:0.16em;color:${NAVY};font-family:'Courier New',Courier,monospace;">${escapeHtml(payload.data.activation_code)}</p>
           <p style="margin:7px 0 0;font-family:${FONT};font-size:11.5px;color:#8a6100;">Single use &middot; expires in 14 days</p>
         </td></tr>
       </table>`
    : "";

  const action = payload.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;"><tr>
         <td align="center" bgcolor="${GOLD}" style="border-radius:10px;">
           <a href="${escapeHtml(payload.action.url)}" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;color:${NAVY};text-decoration:none;border-radius:10px;letter-spacing:0.01em;">${escapeHtml(payload.action.label)} &nbsp;&rarr;</a>
         </td></tr></table>
       <p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:1.65;color:#7c8ca3;">If the button does not work, copy this link into your browser:<br/>
       <a href="${escapeHtml(payload.action.url)}" style="color:#2f60a5;word-break:break-all;text-decoration:underline;">${escapeHtml(payload.action.url)}</a></p>`
    : "";

  const preheader = escapeHtml(payload.body[1] ?? payload.body[0] ?? payload.heading);

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(payload.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef3f9;font-family:${FONT};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;font-family:${FONT};">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef3f9;">
      <tr><td align="center" style="padding:36px 12px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Brand header -->
          <tr><td style="background:#ffffff;border-radius:16px 16px 0 0;padding:30px 32px 22px;text-align:center;">
            <img src="${logoUrl}" width="164" alt="GLANCE" style="display:block;margin:0 auto 6px;width:164px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;" />
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:3px solid ${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td></tr>

          <!-- Message -->
          <tr><td style="background:#ffffff;padding:30px 34px 34px;">
            <p style="margin:0 0 10px;font-family:${FONT};font-size:10.5px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#b48310;">${escapeHtml(eyebrow)}</p>
            <h1 style="margin:0 0 20px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:800;color:${NAVY};letter-spacing:-0.015em;">${escapeHtml(payload.heading)}</h1>
            ${codeBox && paragraphs.length > 1 ? [paragraphs[0], codeBox, ...paragraphs.slice(1)].join("") : paragraphs.join("")}
            ${action}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 0;">
              <tr><td style="border-top:1px solid ${LINE};padding-top:20px;">
                <p style="margin:0;font-family:${FONT};font-size:13.5px;line-height:1.7;color:#7c8ca3;">
                  Warm regards,<br/><strong style="color:${NAVY};">The GLANCE Secretariat</strong><br/>
                  <span style="font-size:12px;">Governance, Leadership and National Civic Engagement</span>
                </p>
              </td></tr>
            </table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="background:${NAVY};border-radius:0 0 16px 16px;padding:24px 30px 26px;text-align:center;">
            <p style="margin:0 0 4px;font-family:${FONT};font-size:12.5px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;">${BRAND_NAME}</p>
            <p style="margin:0 0 14px;font-family:${FONT};font-size:11px;letter-spacing:0.06em;color:rgba(255,255,255,0.66);">Governance &middot; Leadership &middot; National Civic Engagement</p>
            <p style="margin:0 0 14px;font-family:${FONT};font-size:12px;line-height:1.6;">
              <a href="${origin}" style="color:${GOLD};text-decoration:none;font-weight:600;">${origin.replace(/^https?:\/\//, "")}</a>
              <span style="color:rgba(255,255,255,0.35);">&nbsp;&middot;&nbsp;</span>
              <a href="mailto:${SECRETARIAT_CONTACT}" style="color:${GOLD};text-decoration:none;font-weight:600;">${SECRETARIAT_CONTACT}</a>
            </p>
            <p style="margin:0;font-family:${FONT};font-size:10.5px;line-height:1.7;color:rgba(255,255,255,0.5);">
              You received this message because of activity on a GLANCE account or a GLANCE chapter.<br/>
              This is a transactional message and does not require a response unless stated above.
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendTransactionalEmail(
  payload: MailPayload,
): Promise<MailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email:not-configured] ${payload.workflow} -> ${payload.to}\n${renderText(payload)}`,
      );
    }
    return { delivered: false, reason: "not-configured" };
  }

  try {
    const from = sender();
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: from,
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: renderMailHtml(payload),
        textContent: renderText(payload),
        replyTo: from,
        tags: [payload.workflow],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] brevo rejected ${payload.workflow}:`, detail);
      return { delivered: false, reason: "provider-error", detail };
    }

    const result = (await response.json().catch(() => ({}))) as {
      messageId?: string;
    };
    return { delivered: true, provider: "brevo", id: result.messageId };
  } catch (error) {
    return {
      delivered: false,
      reason: "provider-error",
      detail: error instanceof Error ? error.message : "unknown error",
    };
  }
}

export function invitationEmail(input: {
  to: string;
  name?: string | null;
  role: "SUPER_ADMIN" | "AGID_ADMIN" | "CHAPTER_ADMIN" | "COMM_MANAGER" | "MEMBER";
  chapterName?: string | null;
  code: string;
  url: string;
}): MailPayload {
  const roleLabel =
    input.role === "CHAPTER_ADMIN"
      ? "chapter coordinator"
      : input.role === "COMM_MANAGER"
        ? "communications"
        : input.role === "SUPER_ADMIN" || input.role === "AGID_ADMIN"
          ? "GLANCE team"
          : "member";

  return {
    to: input.to,
    workflow: "glance-invitation",
    subject: "You are invited to GLANCE",
    heading: "You are invited to join GLANCE",
    body: [
      input.name ? `Hello ${input.name},` : "Hello,",
      `GLANCE has issued you a GLANCE ${roleLabel} invitation${
        input.chapterName ? ` for ${input.chapterName}` : ""
      }.`,
      "Your activation code is shown below. It can be used once and expires in 14 days.",
      "Open the link below and set your password to activate your account.",
    ],
    action: { label: "Activate my GLANCE account", url: input.url },
    data: { activation_code: input.code, role: input.role },
  };
}

export function passwordResetEmail(input: {
  to: string;
  name: string;
  url: string;
}): MailPayload {
  return {
    to: input.to,
    workflow: "glance-password-reset",
    subject: "Reset your GLANCE password",
    heading: "Reset your GLANCE password",
    body: [
      `Hello ${input.name},`,
      "We received a request to reset the password on your GLANCE account.",
      "This link expires in 60 minutes. If you did not request it, you can ignore this message.",
    ],
    action: { label: "Set a new password", url: input.url },
  };
}

export function joinApplicationReceivedEmail(input: {
  to: string;
  name: string;
}): MailPayload {
  return {
    to: input.to,
    workflow: "glance-join-received",
    subject: "We received your GLANCE membership application",
    heading: "Application received",
    body: [
      `Hello ${input.name},`,
      "Thank you for applying to join GLANCE. Your application has been received and will be reviewed by GLANCE or your chapter's coordinators.",
      "If your application is approved you will receive a separate invitation with an activation code.",
    ],
  };
}

/** Sent to the chapter's submitted contact email the moment the GLANCE team
 * activates the chapter, so the coordinator learns they are live. */
export function chapterActivatedEmail(input: {
  to: string;
  name?: string | null;
  chapterName: string;
  chapterCode: string;
}): MailPayload {
  return {
    to: input.to,
    workflow: "glance-chapter-activated",
    subject: `${input.chapterName} is now live on GLANCE`,
    heading: "Your chapter is live",
    body: [
      input.name ? `Hello ${input.name},` : "Hello,",
      `Your chapter ${input.chapterName} (${input.chapterCode}) has been activated. Its page is live on the GLANCE website and member invitations can now be issued.`,
      "Sign in to the portal to keep the chapter record current and file activity reports as your campus meetings happen.",
    ],
    action: { label: "Open the GLANCE portal", url: `${appOrigin()}/portal/dashboard` },
    data: { chapter_code: input.chapterCode },
  };
}

const SECRETARIAT_INBOX = SECRETARIAT_CONTACT;

/** Sent to the NEW address when an email change is requested. Nothing
 * switches until the link is clicked — until then the old address keeps
 * working, so a mistyped request can never lock anyone out. */
export function emailChangeConfirmationEmail(input: {
  to: string;
  name: string | null;
  link: string;
  expiresInHours: number;
}): MailPayload {
  return {
    to: input.to,
    workflow: "glance-email-change-confirmation",
    subject: "Confirm your new GLANCE email address",
    heading: "Confirm your new GLANCE email address",
    body: [
      input.name ? `Hello ${input.name},` : "Hello,",
      `A request was made to switch your GLANCE account to this address (${input.to}).`,
      `Click below to confirm. The link expires in ${input.expiresInHours} hours — until you confirm, your account stays on its current address and your sign-in does not change.`,
      "If this was not you, no action is needed and your account is untouched.",
    ],
    action: {
      label: "Confirm my new email address",
      url: input.link,
    },
  };
}

/** Security notice sent to the previous address after an email change. */
export function emailChangedNoticeEmail(input: {
  to: string;
  name: string | null;
  newEmail: string;
}): MailPayload {
  return {
    to: input.to,
    workflow: "glance-email-changed-notice",
    subject: "Your GLANCE email address was changed",
    heading: "Your GLANCE email address was changed",
    body: [
      input.name ? `Hello ${input.name},` : "Hello,",
      `The email address on this GLANCE account was changed from ${input.to} to ${input.newEmail}.`,
      "This message is a security notice — sign-in now happens from the new address.",
      "If you did not make this change, reply to this message right away so the secretariat can secure your account.",
    ],
  };
}

/** A chapter activity report lands in the secretariat's inbox the moment a
 * chapter administrator submits it. */
export function chapterActivityReportEmail(input: {
  chapterName: string;
  chapterCode: string;
  reportedBy: string;
  title: string;
  summary: string;
  activityDate: string;
  attendeeCount: number | null;
}): MailPayload {
  return {
    to: SECRETARIAT_INBOX,
    workflow: "glance-activity-report",
    subject: `[Report] ${input.chapterName} — ${input.title}`,
    heading: "Chapter activity report",
    body: [
      `Chapter: ${input.chapterName} (${input.chapterCode})`,
      `Submitted by: ${input.reportedBy}`,
      `Activity: ${input.title} on ${input.activityDate}` +
        (input.attendeeCount !== null ? ` with ${input.attendeeCount} attendees.` : "."),
      "",
      input.summary,
      "",
      "The full report history lives the portal under Reports.",
    ],
    data: { chapter_code: input.chapterCode },
  };
}
