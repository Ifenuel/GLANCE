"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Role } from "@prisma/client";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { logoutAction } from "@/server/actions/auth";

export type PortalItem = {
  label: string;
  href: string;
  roles: Role[];
  group: string;
};

const items: PortalItem[] = [
  {
    label: "Dashboard",
    href: "/portal/dashboard",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER", "CHAPTER_ADMIN"],
    group: "Overview",
  },
  {
    label: "My profile",
    href: "/portal/profile",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER", "CHAPTER_ADMIN", "MEMBER", "ALUMNI"],
    group: "Overview",
  },
  {
    label: "Statistics",
    href: "/portal/statistics",
    roles: ["SUPER_ADMIN", "AGID_ADMIN"],
    group: "Overview",
  },
  {
    label: "Chapters",
    href: "/portal/chapters",
    roles: ["SUPER_ADMIN", "AGID_ADMIN"],
    group: "Network",
  },
  {
    label: "My chapter",
    href: "/portal/chapter",
    roles: ["CHAPTER_ADMIN"],
    group: "Network",
  },
  {
    label: "Members",
    href: "/portal/members",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN"],
    group: "Network",
  },
  {
    label: "Applications",
    href: "/portal/applications",
    roles: ["SUPER_ADMIN", "AGID_ADMIN"],
    group: "Network",
  },
  {
    label: "Invitations",
    href: "/portal/invitations",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN"],
    group: "Network",
  },
  {
    label: "Events",
    href: "/portal/events",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"],
    group: "Content",
  },
  {
    label: "Media gallery",
    href: "/portal/media",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"],
    group: "Content",
  },
  {
    label: "Website Content",
    href: "/portal/content",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"],
    group: "Content",
  },
  {
    label: "Activity reports",
    href: "/portal/reports",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN"],
    group: "Content",
  },
  {
    label: "Audit log",
    href: "/portal/audit",
    roles: ["SUPER_ADMIN", "AGID_ADMIN"],
    group: "Administration",
  },
  {
    label: "Roles and access",
    href: "/portal/roles",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "CHAPTER_ADMIN"],
    group: "Administration",
  },
  {
    label: "Settings",
    href: "/portal/settings",
    roles: ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER", "CHAPTER_ADMIN", "MEMBER", "ALUMNI"],
    group: "Administration",
  },
];

export const GROUP_ORDER = ["Overview", "Network", "Content", "Administration"] as const;

export function portalItemsFor(role: Role) {
  return items.filter((item) => item.roles.includes(role));
}

export function portalGroupsFor(role: Role) {
  const visible = portalItemsFor(role);
  return GROUP_ORDER.map((group) => ({
    group,
    items: visible.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);
}

/* ------------------------------------------------------------------ icons */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function NavIcon({ label, className }: { label: string; className?: string }) {
  const common = {
    className: className ?? "h-[18px] w-[18px]",
    viewBox: "0 0 24 24",
    ...stroke,
  };
  switch (label) {
    case "Dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "My profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
      );
    case "Statistics":
      return (
        <svg {...common}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    case "Chapters":
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V8l7-4 7 4v13" />
          <path d="M9 21v-5h6v5M9 11h.01M15 11h.01" />
        </svg>
      );
    case "My chapter":
      return (
        <svg {...common}>
          <path d="M4 21V6l8-3 8 3v15" />
          <path d="M9 21v-4h6v4M8 9h2M14 9h2M8 13h2M14 13h2" />
        </svg>
      );
    case "Members":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
          <path d="M16 8.5a2.8 2.8 0 0 1 0 5.4M17.5 19a5.6 5.6 0 0 0-1.6-3.9" />
        </svg>
      );
    case "Applications":
      return (
        <svg {...common}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4M10 12h5M10 16h5" />
        </svg>
      );
    case "Invitations":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "Events":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "Media gallery":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="m4 18 5-5 4 4 3-3 4 4" />
        </svg>
      );
    case "Activity reports":
      return (
        <svg {...common}>
          <path d="M4 5h16M4 10h10M4 15h16M4 20h7" />
        </svg>
      );
    case "Audit log":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "Roles and access":
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="3" />
          <circle cx="17" cy="10" r="2.4" />
          <path d="M2.8 20a5.2 5.2 0 0 1 10.4 0M14.4 19.6a4.6 4.6 0 0 1 6.8-3.4" />
        </svg>
      );
    case "Settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9.1A1.7 1.7 0 0 0 10.13 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------ desktop nav */

export function PortalNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = portalGroupsFor(role);

  return (
    <nav aria-label="Portal" className="hidden flex-col gap-2 lg:flex">
      {groups.map((section) => {
        return (
        <div key={section.group} className="rounded-xl">
          {/* Always-visible grouped menu: every destination stays listed and
              arranged in one clear list — nothing is folded away. */}
          <p className="flex w-full items-center justify-between px-3 py-2 text-left">
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
              {section.group}
            </span>
          </p>
          <ul className="mt-1 space-y-1">
            {section.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-white/[0.12] text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)]"
                        : "text-white/60 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={
                        active ? "text-gold-400" : "text-white/35 group-hover:text-gold-300"
                      }
                    >
                      <NavIcon label={item.label} />
                    </span>
                    <span className="truncate">{item.label}</span>
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------- mobile nav */

/**
 * The phone navigation: one menu button in the top bar, opening a
 * full-height, solid drawer with the same grouped destinations as the
 * desktop sidebar. The overlay sits on its own layer so the menu is never
 * see-through.
 */
const subscribeHydration = () => () => {};

export function PortalMobileNav({
  role,
  name,
  roleLabel,
}: {
  role: Role;
  name: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The drawer is portaled to <body> so page stacking contexts (sticky header,
  // transforms, backdrop filters) can never bleed through it. The SSR render
  // and the first client render must agree, so the portal mounts only after
  // hydration — read from the hydration boundary instead of setState in an
  // effect, which would cascade an extra render pass.
  const mounted = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const groups = portalGroupsFor(role);

  // Close the drawer when the route changes (adjust-during-render, so the new
  // page never paints behind an open menu).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = (name || "G")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="portal-drawer"
        aria-label="Open portal menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy-900 transition-colors hover:border-navy-200 hover:bg-navy-50 lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {mounted
        ? createPortal(
            <div
              className={`fixed inset-0 z-[120] lg:hidden ${open ? "" : "pointer-events-none"}`}
              aria-hidden={!open}
              // The open/close state is driven by inline styles, not utility
              // classes, so a device or cache that misses one class chunk
              // can never end up with a half-drawn drawer floating over
              // the page — the geometry must always land completely.
              style={{
                visibility: open ? "visible" : "hidden",
                transition: `visibility 0s linear ${open ? 0 : 300}ms`,
              }}
            >
              <button
                type="button"
                aria-label="Close portal menu"
                onClick={() => setOpen(false)}
                className={`absolute inset-0 cursor-default bg-[#03142c]/75 transition-opacity duration-300 ${
                  open ? "opacity-100" : "opacity-0"
                }`}
              />

              <aside
                id="portal-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Portal menu"
                style={{
                  backgroundColor: "#ffffff",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  width: "min(86%, 330px)",
                  transform: open ? "translateX(0)" : "translateX(-100%)",
                  transition:
                    "transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                }}
                className={`absolute inset-y-0 left-0 flex h-full flex-col overflow-hidden shadow-[30px_0_80px_-40px_rgba(5,37,80,0.7)]`}
              >
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-ink-400 uppercase">
                Member area
              </p>
              <p className="font-display mt-0.5 text-[15px] font-bold text-navy-900">GLANCE</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-navy-900 transition-colors hover:bg-navy-50"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {groups.map((section) => (
              <div key={section.group} className="mb-6 last:mb-0">
                <p className="px-2 text-[10px] font-bold tracking-[0.2em] text-ink-400 uppercase">
                  {section.group}
                </p>
                <ul className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                            active
                              ? "bg-navy-900 text-white"
                              : "text-navy-900/75 active:bg-navy-50"
                          }`}
                        >
                          <span className={active ? "text-gold-300" : "text-ink-400"}>
                            <NavIcon label={item.label} className="h-5 w-5" />
                          </span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <footer className="border-t border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[13px] font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-navy-900">{name}</p>
                <p className="truncate text-[11.5px] text-ink-400">{roleLabel}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-line text-[12px] font-semibold text-navy-800"
              >
                View website
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-navy-900 text-[12px] font-bold text-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          </footer>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
