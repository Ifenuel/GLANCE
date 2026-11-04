import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin guide",
  description: "How chapter admins sign in, register members, invite people and file reports.",
};

const sections = [
  {
    n: "01",
    title: "Sign in",
    steps: [
      "Open the portal login page and enter the email you were invited with, plus your password.",
      "First time? Use the link in your invitation email to set a password.",
      "Forgot it? Choose Forgot password, enter your email and follow the link that arrives. It lasts one hour and works once.",
    ],
  },
  {
    n: "02",
    title: "Read your dashboard",
    steps: [
      "Active members — everyone currently on your roster.",
      "Reports filed — activity reports on record for your chapter.",
      "Pending invites — people invited but not yet activated.",
      "Chapter events — events recorded for your campus.",
      "If it says “No chapter attached to this account yet”, the secretariat has not linked your chapter — contact them first.",
    ],
  },
  {
    n: "03",
    title: "Register a member",
    steps: [
      "Dashboard → Register a member (or Members → Register member).",
      "Fill in full name, email, phone, institution and department; choose a position if they hold one.",
      "Save. The member receives a GLANCE code such as GLN-UIB-001 and appears on your roster immediately.",
      "One record per person. Use the email the member actually reads. If someone leaves, deactivate rather than delete.",
    ],
  },
  {
    n: "04",
    title: "Invite a member or admin",
    steps: [
      "Dashboard → Invite admin, or Invitations → New invitation.",
      "Enter the email and choose the role, then send. They set their own password from the invitation link.",
      "Pending invitations can be resent or cancelled under Invitations.",
    ],
  },
  {
    n: "05",
    title: "File an activity report",
    steps: [
      "Dashboard → Submit report (or Reports → New report).",
      "Add the title, date and attendee count, then two or three sentences on what happened and what it achieved.",
      "Attach up to three photographs (under 1 MB each) — photos make the report usable on the public site.",
      "Save. Reports appear under Reports with their photos, and the secretariat sees them too.",
    ],
  },
  {
    n: "06",
    title: "Keep your chapter page current",
    steps: [
      "Chapter in the menu lets you update the description, meeting day, contact person and logo.",
      "Whatever you save here appears on your public chapter page — check spelling before publishing.",
    ],
  },
  {
    n: "07",
    title: "Housekeeping",
    steps: [
      "Profile → upload a clear photo; it appears in the portal sidebar.",
      "Settings → Update password. Changing it signs out other browsers at their next visit.",
      "Settings lists every signed-in browser; sign out any you do not recognise.",
      "Never share your password. Every action in the portal is recorded with a name and a time.",
    ],
  },
];

const answers = [
  ["Can't sign in", "Check the email is the one you were invited with; use Forgot password."],
  ["No reset email", "Check Spam, then ask the secretariat to confirm your email on file."],
  ["Member can't find their code", "Members → search the name → the code is on the record."],
  ["“No chapter attached”", "The secretariat must link your chapter to your account."],
  ["Photo upload fails", "Use a JPG or PNG under 1 MB on a stable connection."],
  ["Wrong member details", "Members → open the record → edit and save."],
];

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white shadow-[0_30px_60px_-30px_rgba(4,13,26,0.8)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.18),transparent_70%)] blur-2xl"
        />
        <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-400 uppercase">
          Chapter administrators
        </p>
        <h1 className="font-display mt-2 text-[30px] leading-tight font-bold tracking-[-0.03em]">
          Chapter admin guide
        </h1>
        <p className="mt-3 max-w-[640px] text-[13.5px] leading-[1.8] text-white/70">
          Everything a chapter admin needs: signing in, registering members,
          inviting people, filing reports and keeping the chapter record current.
        </p>
      </header>

      <div data-stagger="" className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.n}
            className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(5,42,92,0.06),0_18px_40px_-28px_rgba(5,42,92,0.35)]"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-data text-[11px] font-bold tracking-[0.16em] text-gold-600">
                {section.n}
              </span>
              <h2 className="font-display text-[16px] font-bold text-navy-900">{section.title}</h2>
            </div>
            <ol className="mt-3 space-y-2.5">
              {section.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-[12.5px] leading-[1.7] text-ink-600">
                  <span
                    aria-hidden="true"
                    className="font-data mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[10px] font-bold text-navy-700"
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(5,42,92,0.06),0_18px_40px_-28px_rgba(5,42,92,0.3)]">
        <h2 className="font-display text-[16px] font-bold text-navy-900">Quick answers</h2>
        <dl className="mt-4 divide-y divide-line">
          {answers.map(([problem, fix]) => (
            <div key={problem} className="grid gap-1 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
              <dt className="text-[12.5px] font-bold text-navy-900">{problem}</dt>
              <dd className="text-[12.5px] leading-[1.7] text-ink-600">{fix}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-navy-50/50 px-5 py-4">
        <p className="max-w-[560px] text-[12px] leading-[1.7] text-ink-500">
          Every number on the public website comes from what chapter admins enter here.
          A roster kept up to date is what makes your chapter visible.
        </p>
        <Link
          href="/portal/members/register"
          className="shrink-0 rounded-full bg-navy-950 px-4 py-2 text-[11.5px] font-bold text-white transition-colors hover:bg-navy-900"
        >
          Register a member
        </Link>
      </div>
    </div>
  );
}
