import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth";
import { auditEntry, auditActionLabel } from "@/server/audit";
import { Card, SectionHeading } from "@/components/ui";
import { GlanceMark } from "@/components/glance-logo";
import { formatDate, formatDateTime, genderLabel } from "@/lib/format";
import { AccountForm, AvatarUploader } from "@/components/portal/forms";
import { ChangePasswordForm } from "@/components/portal/forms/change-password-form";

export const metadata: Metadata = {
  title: "My profile",
  description: "Update your name, contact details and profile photo.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const entries = await auditEntry({ limit: 8 });

  if (!user) {
    return (
      <Card>
        <p className="text-[13px] text-ink-500">
          Refresh the page to continue, or{" "}
          <a href="/portal/login" className="font-semibold text-navy-800 underline">
            sign in again
          </a>
          .
        </p>
      </Card>
    );
  }

  const staffRole =
    user.role === "SUPER_ADMIN" ||
    user.role === "AGID_ADMIN" ||
    user.role === "COMM_MANAGER" ||
    user.role === "CHAPTER_ADMIN";
  const completing = staffRole && !user.profileCompletedAt;
  const avatarUrl = user.profile?.avatarUrl ?? user.avatarUrl;
  const memberCode = user.profile?.memberCode ?? null;
  const profileFields = [
    ["Full name", user.name],
    ["Email", user.email],
    ["Phone", user.phone ?? "Not set"],
    ["Gender", genderLabel(user.gender)],
    ["Department", user.department ?? "Not set"],
    ["Level", user.academicLevel ?? "Not set"],
    ["Position", user.position ?? "Not set"],
    ["Chapter", user.chapter?.name ?? "None"],
  ];

  return (
    <div className="space-y-6">
      {/* Hero band: identity at a glance */}
      <section className="relative overflow-hidden rounded-2xl bg-navy-950 px-6 py-8 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_0%,rgba(234,174,20,0.14),transparent_55%)]"
        />
        <div className="relative flex flex-wrap items-center gap-6">
          <span className="relative">
            <GlanceMark className="h-14 w-auto opacity-90" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-300 uppercase">
              Signed in as GLANCE staff
            </p>
            <h1 className="mt-1 truncate text-[28px] font-extrabold tracking-tight text-white">
              {user.name}
            </h1>
            <p className="mt-1 text-[13px] text-white/60">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ""}
            </p>
          </div>
          <dl className="flex gap-6 text-right">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                Role
              </dt>
              <dd className="mt-0.5 font-data text-[15px] font-bold text-white">
                {ROLE_LABEL(user.role)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                Member ID
              </dt>
              <dd className="mt-0.5 font-mono text-[15px] font-bold text-gold-300">
                {memberCode ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Edit columns: photo on the left, editable record on the right */}
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <div className="space-y-5">
          <Card className="text-center">
            <h3 className="text-[15px] font-extrabold text-navy-900">Profile photo</h3>
            <p className="mt-1 text-[12px] text-ink-500">
              Shown in the sidebar, the portal header and your records.
            </p>
            <div className="mt-5">
              <AvatarUploader currentUrl={avatarUrl} name={user.name} />
            </div>
          </Card>

          <Card>
            <h3 className="text-[15px] font-extrabold text-navy-900">Security</h3>
            <p className="mt-1 text-[12px] text-ink-500">
              Change the password on your own account.
            </p>
            <div className="mt-4">
              <ChangePasswordForm />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="text-[15px] font-extrabold text-navy-900">
              {completing ? "Complete your account" : "Account details"}
            </h3>
            <p className="mt-1 text-[12px] text-ink-500">
              Name, gender, phone, email, department, level and position.
            </p>
            <div className="mt-4">
              <AccountForm
                required={completing}
                user={{
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  phone: user.phone,
                  role: user.role,
                  gender: user.gender,
                  department: user.department,
                  academicLevel: user.academicLevel,
                  position: user.position,
                }}
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-[15px] font-extrabold text-navy-900">Record on file</h3>
            <p className="mt-1 text-[12px] text-ink-500">
              What GLANCE administrators can see for you right now.
            </p>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {profileFields.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-line/60 pb-2.5"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
                    {label}
                  </dt>
                  <dd className="text-right text-[13px] font-semibold text-navy-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[11.5px] text-ink-400">
              Last signed in: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "earlier"}
              {user.profile ? ` · registered ${formatDate(user.profile.registeredAt)}` : ""}
            </p>
          </Card>

          <Card>
            <h3 className="text-[15px] font-extrabold text-navy-900">Recent activity</h3>
            <div className="mt-4 space-y-3 text-[12.5px] text-ink-500">
              {entries.map((entry) => {
                const who = entry.actor?.name ?? (entry.actorId ? "A team member" : "A visitor");
                return (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                    <div>
                      <p className="text-[12.5px] font-semibold text-navy-900">
                        {who} {auditActionLabel(entry.action).toLowerCase()}
                      </p>
                      <p className="text-[11.5px] text-ink-500">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {entries.length === 0 ? (
                <p className="text-[12px] text-ink-400">No activity yet.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ROLE_LABEL(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Administrator",
    AGID_ADMIN: "GLANCE team",
    COMM_MANAGER: "Communications",
    CHAPTER_ADMIN: "Chapter coordinator",
    MEMBER: "Member",
    ALUMNI: "Alumni",
  };
  return labels[role] ?? role;
}
