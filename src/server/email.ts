import "server-only";

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

const BRAND_NAME = "theglanceproject";
const NAVY = "#0A2550";
const GOLD = "#EAAE14";
const INK = "#46566D";
const LINE = "#e3e9f1";

function sender() {
  const name = process.env.INVITE_EMAIL_NAME?.trim() || BRAND_NAME;
  const raw =
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    process.env.INVITE_EMAIL_FROM?.trim() ||
    "";
  const email = raw.includes("@") ? raw : "no-reply@theglanceproject.com";
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
    "GLANCE | Governance, Leadership and National Civic Engagement",
    "A structured leadership and civic engagement club for tertiary institutions across Africa.",
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

/**
 * One calm, modern email frame used for every message: navy masthead with a
 * gold hairline, white card, gold action button, styled activation-code box
 * when a code is embedded, quiet footer. All styles are inline so the mail
 * renders the same in Gmail, Outlook and on phones.
 */
export function renderMailHtml(payload: MailPayload): string {
  const paragraphs = payload.body
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${INK};">${escapeHtml(line)}</p>`,
    )
    .join("");

  const codeBox = payload.data?.activation_code
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;background:#fdf4da;border:1px solid #fbe8a8;border-radius:12px;"><tr><td style="padding:16px 20px;text-align:center;">
         <p style="margin:0 0 6px;font-size:10.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#8a6100;">Activation code</p>
         <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:0.12em;color:${NAVY};font-family:'Courier New',monospace;">${escapeHtml(payload.data.activation_code)}</p>
       </td></tr></table>`
    : "";

  const action = payload.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;"><tr><td style="border-radius:10px;background:${GOLD};box-shadow:0 8px 18px -10px rgba(234,174,20,0.7);">
         <a href="${escapeHtml(payload.action.url)}" style="display:inline-block;padding:14px 30px;font-size:14.5px;font-weight:700;color:${NAVY};text-decoration:none;border-radius:10px;">${escapeHtml(payload.action.label)} &rarr;</a>
       </td></tr></table>
       <p style="margin:14px 0 0;font-size:12.5px;line-height:1.6;color:#7c8ca3;">If the button does not work, copy and paste this link into your browser:<br/>
       <a href="${escapeHtml(payload.action.url)}" style="color:#2f60a5;word-break:break-all;">${escapeHtml(payload.action.url)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f2f6fc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f6fc;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr><td style="background:${NAVY};border-radius:16px 16px 0 0;padding:28px 32px;border-bottom:3px solid ${GOLD};">
            <p style="margin:0;font-size:19px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;">${BRAND_NAME}</p>
            <p style="margin:6px 0 0;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.62);">Governance &middot; Leadership &middot; National Civic Engagement</p>
          </td></tr>
          <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:34px 32px 30px;box-shadow:0 24px 48px -32px rgba(5,37,80,0.28);">
            <h1 style="margin:0 0 18px;font-size:21px;line-height:1.3;font-weight:800;color:${NAVY};letter-spacing:-0.015em;">${escapeHtml(payload.heading)}</h1>
            ${codeBox}
            ${paragraphs}
            ${action}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;border-top:1px solid ${LINE};">
              <tr><td style="padding-top:18px;">
                <p style="margin:0;font-size:12.5px;line-height:1.6;color:#7c8ca3;">
                  With purpose,<br/><strong style="color:${NAVY};">The GLANCE Secretariat</strong>
                </p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:22px 16px 8px;text-align:center;">
            <p style="margin:0;font-size:11.5px;line-height:1.7;color:#8494a8;">
              GLANCE is a structured leadership and civic engagement club operating within tertiary institutions across Africa.<br/>
              You received this message because of activity on your GLANCE account.
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
      `Your activation code is ${input.code}. It can be used once and expires in 14 days.`,
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

const SECRETARIAT_INBOX =
  process.env.GLANCE_SECRETARIAT_EMAIL?.trim() || "info@theglanceproject.com";

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
