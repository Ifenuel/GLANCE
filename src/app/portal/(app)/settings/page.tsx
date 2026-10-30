import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { Card } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { ChangePasswordForm } from "@/components/portal/forms/change-password-form";
import { setGenderVisibilityAction } from "@/server/actions/member";
import { logoutAction } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Settings",
  description: "Security, sessions and display preferences for your portal account.",
};

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  if (/iPhone|iPad/i.test(userAgent)) return "iOS device";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Edg\//i.test(userAgent)) return "Edge on desktop";
  if (/Chrome/i.test(userAgent)) return "Chrome on desktop";
  if (/Firefox/i.test(userAgent)) return "Firefox on desktop";
  if (/Safari/i.test(userAgent)) return "Safari on desktop";
  return "Other device";
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

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

  const [sessions, entryCount] = await Promise.all([
    db.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      take: 8,
      select: { id: true, ip: true, userAgent: true, lastSeenAt: true, createdAt: true },
    }),
    db.auditLog.count({ where: { actorId: user.id } }),
  ]);

  const hasMemberProfile = Boolean(user.profile);

  return (
    <div className="space-y-6">
      <header className="rise">
        <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-600 uppercase">
          Administration
        </p>
        <h1 className="font-display mt-2 text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-[-0.03em] text-navy-900">
          Settings
        </h1>
        <p className="mt-1.5 max-w-[620px] text-[13.5px] leading-[1.7] text-ink-500">
          Security and preferences for your own account. Everything here is
          yours only — sensitive organisation-wide controls stay with the
          secretariat, not in every menu.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">          <Card className="rise">
            <h3 className="font-display text-[15px] font-bold text-navy-900">
              Password
          </h3>
          <p className="mt-1 text-[12px] text-ink-500">
            Changing it signs other browsers out the next time they are used.
          </p>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </Card>

        {hasMemberProfile && user.profile?.gender !== "PREFER_NOT_TO_SAY" ? (
          <Card className="rise">
            <h3 className="font-display text-[15px] font-bold text-navy-900">
              Who can see my gender
            </h3>
            <p className="mt-1 text-[12px] text-ink-500">
              Your record currently shows this to GLANCE and chapter
              coordinators when
              member lists are published. Hiding it replaces the value on your
              record, so the secretariat “un-hides” it for you afterwards.
            </p>
            <form action={setGenderVisibilityAction} className="mt-4">
              {/* No “visible” value on purpose — the action reads the absence of
                  the value as “hide”. */}
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg bg-navy-900 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-navy-800"
              >
                Keep my gender private
              </button>
            </form>
          </Card>
        ) : hasMemberProfile ? (
          <Card className="rise">
            <h3 className="font-display text-[15px] font-bold text-navy-900">
              Who can see my gender
            </h3>
            <p className="mt-1 text-[12px] text-ink-500">
              Your gender is currently hidden. Ask the secretariat to make it
              visible again if you want it shown on member lists.
            </p>
          </Card>
        ) : null}          <Card className="lg:col-span-2 rise">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h3 className="font-display text-[15px] font-bold text-navy-900">
                Active sessions
              </h3>
              <p className="mt-0.5 text-[11.5px] text-ink-400">
                Places where your portal login is currently valid.
              </p>
            </div>
            <span className="font-data text-[12px] font-bold text-ink-500">
              {sessions.length} active
            </span>
          </div>
          <ul className="divide-y divide-line/70">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-navy-900">
                    {deviceLabel(session.userAgent)}
                  </p>
                  <p className="font-mono text-[11px] text-ink-400">
                    {session.ip ?? "unknown IP"} · last seen {formatDateTime(session.lastSeenAt)}
                  </p>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-bold text-ink-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    Sign out
                  </button>
                </form>
              </li>
            ))}
            {sessions.length === 0 ? (
              <li className="py-6 text-center text-[12.5px] text-ink-500">
                No active sessions recorded. Yours will appear here on your next visit.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="lg:col-span-2 rise">
          <h3 className="font-display text-[15px] font-bold text-navy-900">
            Your record
          </h3>
          <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">
                Actions recorded
              </p>
              <p className="font-data mt-1 text-[22px] font-bold text-navy-900">{entryCount}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">
                Role
              </p>
              <p className="mt-1 text-[13px] font-semibold text-navy-900">
                {user.role === "AGID_ADMIN"
                  ? "GLANCE team"
                  : user.role === "COMM_MANAGER"
                    ? "Communications"
                    : user.role === "CHAPTER_ADMIN"
                      ? "Chapter coordinator"
                      : user.role === "SUPER_ADMIN"
                        ? "Administrator"
                        : user.role}
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">
                Full audit history
              </p>
              <p className="mt-1 text-[12.5px] text-ink-500">
                {user.role === "SUPER_ADMIN" || user.role === "AGID_ADMIN" ? (
                  <>Every action in the network is in the audit log.</>
                ) : (
                  <>Your actions appear in the network audit log automatically.</>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
