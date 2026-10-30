import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { logoutAction } from "@/server/actions/auth";
import { PortalAnalytics } from "@/components/portal/portal-analytics";
import { PortalMobileNav, PortalNav } from "@/components/portal/portal-nav";
import { ProfileGate } from "@/components/portal/profile-gate";
import { ScreenLock } from "@/components/portal/screen-lock";
import { GlanceLogo } from "@/components/glance-logo";
import { ArrowUpRight } from "@/components/icons";
import type { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "GLANCE member area.",
};

/* The portal is an authenticated area: every navigation must re-validate the
   session at the server, so this gate is deliberately allowed to block under
   cacheComponents (per the shipped migration guide, "opting a gate out" is the
   sanctioned way to keep an auth read at the layout). Public pages stay fully
   prerendered; only this segment blocks, on purpose. */
export const instant = false;

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Administrator",
  AGID_ADMIN: "GLANCE team",
  COMM_MANAGER: "Communications",
  CHAPTER_ADMIN: "Chapter coordinator",
  MEMBER: "Member",
  ALUMNI: "Alumni",
};

function initials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "G") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function UserAvatar({
  name,
  email,
  avatarUrl,
  size,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  size: number;
}) {
  if (avatarUrl) {
    return (
      <span
        className="relative shrink-0 overflow-hidden rounded-full bg-navy-50"
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl}
          alt={name || email}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-navy-900 font-bold text-white uppercase"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials(name, email)}
    </span>
  );
}

export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/portal/login");

  const role = user.role as Role;
  const roleLabel = ROLE_LABEL[role] ?? "Member";
  const workspace =
    role === "CHAPTER_ADMIN" ? (user.chapter?.name ?? "Your chapter") : "GLANCE secretariat";

  // Staff accounts created by invitation must finish their profile before the
  // rest of the portal opens. Members and alumni are exempt.
  const staffRole =
    role === "SUPER_ADMIN" || role === "AGID_ADMIN" || role === "COMM_MANAGER" || role === "CHAPTER_ADMIN";
  const profileNeeded = staffRole && !user.profileCompletedAt;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* --------------------------------------------------------- sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-navy-800 bg-navy-950 lg:flex">
        <div className="px-6 pt-6 pb-5">
          <Link href="/portal/dashboard" className="inline-flex" aria-label="GLANCE portal dashboard">
            <GlanceLogo variant="light" className="h-9" />
          </Link>
          <p className="mt-2 text-[10.5px] font-semibold tracking-[0.16em] text-white/45 uppercase">
            Member area
          </p>
        </div>

        <div className="mx-4 mb-5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
          <p className="text-[10px] font-bold tracking-[0.14em] text-gold-400 uppercase">
            Signed in as
          </p>
          <p className="mt-1 truncate text-[12.5px] font-bold text-white">{roleLabel}</p>
          <p className="truncate text-[11px] text-white/50">{workspace}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <PortalNav role={role} />
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <Link
            href="/"
            className="mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-[12px] font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            View public website
            <ArrowUpRight className="h-3.5 w-3.5 text-white/40" />
          </Link>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-2.5">
            <UserAvatar
              name={user.name}
              email={user.email}
              avatarUrl={user.profile?.avatarUrl ?? null}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-white/45">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              >
                Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------ main */}
      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/portal/dashboard" className="shrink-0 lg:hidden" aria-label="GLANCE portal">
              <GlanceLogo className="h-8" />
            </Link>

            <div className="hidden lg:block">
              <p className="text-[10.5px] font-bold tracking-[0.16em] text-ink-400 uppercase">
                {roleLabel}
              </p>
              <p className="mt-0.5 text-[13.5px] font-semibold text-navy-900">{workspace}</p>
            </div>

            <div className="ml-auto flex items-center gap-2.5">
              <Link
                href="/"
                className="hidden rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 sm:inline-flex"
              >
                View website
              </Link>
              <Link
                href="/portal/profile"
                aria-label="Your profile"
                className="shrink-0 rounded-full ring-offset-2 transition-shadow hover:ring-2 hover:ring-navy-200"
              >
                <UserAvatar
                  name={user.name}
                  email={user.email}
                  avatarUrl={user.profile?.avatarUrl ?? null}
                  size={34}
                />
              </Link>
              <PortalMobileNav role={role} name={user.name} roleLabel={roleLabel} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>

      <ScreenLock name={user.name} />
      <ProfileGate needed={profileNeeded} name={user.name} />
      <PortalAnalytics memberId={user.id} />
    </div>
  );
}
