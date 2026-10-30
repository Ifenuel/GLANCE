"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { GlanceLogo } from "@/components/glance-logo";
import {
  BuildingIcon,
  ChapterIcon,
  ChevronDown,
  CloseIcon,
  MenuIcon,
  OpportunityIcon,
  PartnerIcon,
  UsersIcon,
} from "@/components/icons";
import { primaryNav } from "@/lib/nav";

/** Hydration flag: false while the server renders, true once the DOM is live. */
const subscribeHydration = () => () => {};

function isActive(pathname: string, href: string) {
  const target = href.split("#")[0];
  if (!target || target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

/**
 * Desktop navigation — plain dropdown lists (labels only), centred in the
 * header. "Join GLANCE" lives inside these lists (Chapters, Get Involved),
 * never as a separate bar button. No search, no portal link.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset open menus when the route changes (adjust-during-render pattern).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpenMenu(null);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    // A dropdown must also disappear the moment the reader clicks anywhere
    // else on the page | hover-out alone is not enough on touch screens.
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      const inside = (event.target as Element).closest?.(
        'li[class*="relative"], nav[aria-label="Primary"]',
      );
      if (!inside) setOpenMenu(null);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {primaryNav.map((item, index) => {
          const active = isActive(pathname, item.href);
          const expanded = openMenu === item.label;
          // Items in the right half open their panel left-anchored; the last
          // two anchor right so a 340px panel can never overflow the viewport.
          const anchorRight = index >= primaryNav.length - 2;

          if (!item.children) {
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`relative inline-flex items-center rounded-lg px-3.5 py-2 text-[13.5px] font-bold tracking-[0.01em] transition-colors ${
                    active
                      ? "text-navy-900"
                      : "text-navy-900/75 hover:bg-navy-50/80 hover:text-navy-900"
                  }`}
                >
                  {item.label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3.5 -bottom-0.5 h-[3px] rounded-full bg-gold-400"
                    />
                  ) : null}
                </Link>
              </li>
            );
          }

          return (
            <li
              key={item.label}
              className="relative"
              onMouseEnter={() => {
                cancelClose();
                setOpenMenu(item.label);
              }}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-haspopup="true"
                onClick={() => setOpenMenu(expanded ? null : item.label)}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13.5px] font-bold tracking-[0.01em] transition-colors ${
                  active || expanded
                    ? "text-navy-900"
                    : "text-navy-900/75 hover:bg-navy-50/80 hover:text-navy-900"
                }`}
              >
                {item.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3.5 -bottom-0.5 h-[3px] rounded-full bg-gold-400"
                  />
                ) : null}
              </button>

              {expanded ? (
                <div
                  className={`absolute top-full z-50 w-[264px] pt-3 ${
                    anchorRight ? "right-0" : "left-0"
                  }`}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_28px_60px_-32px_rgba(5,42,92,0.45)]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href + child.label}
                        href={child.href}
                        onClick={() => setOpenMenu(null)}
                        className="group/item flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-semibold text-navy-900 transition-colors hover:bg-navy-50"
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-gold-400 opacity-0 transition-opacity group-hover/item:opacity-100"
                        />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Mobile menu — the trigger is pinned to the header's right edge and the
 * drawer carries the same grouped list. "Join GLANCE" sits inside the lists
 * (Chapters / Get Involved); there is no search and no /login entry.
 */
export function MobileMenu() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // The mobile drawer portals into document.body, so it may only render after
  // hydration; reading that as an external store avoids a second render pass.
  const mounted = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );

  // Reset when the route changes.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  // While the drawer is open the page behind it must not scroll.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-navy-900 shadow-[0_10px_24px_-18px_rgba(10,37,80,0.55)] lg:hidden"
      >
        {mobileOpen ? (
          <CloseIcon className="h-5 w-5" />
        ) : (
          <MenuIcon className="h-5 w-5" />
        )}
      </button>

      {mobileOpen && mounted
        ? createPortal(
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="drawer-dark fixed inset-0 z-[100] flex flex-col bg-white lg:hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-2.5">
                <Link
                  href="/"
                  aria-label="GLANCE home"
                  onClick={() => setMobileOpen(false)}
                >
                  <GlanceLogo variant="light" className="h-8" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-navy-900"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                <ul>
                  {primaryNav.map((item) => (
                    <li
                      key={item.label}
                      className="border-b border-line last:border-0"
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 py-2.5 text-[15.5px] leading-tight font-extrabold tracking-[-0.01em] ${
                          isActive(pathname, item.href)
                            ? "text-navy-900"
                            : "text-navy-900/85"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isActive(pathname, item.href)
                              ? "bg-navy-900 text-gold-400"
                              : "bg-navy-50 text-navy-800"
                          }`}
                        >
                          {item.label === "Home" ? (
                            <ChapterIcon className="h-4 w-4" />
                          ) : item.label === "About" ? (
                            <UsersIcon className="h-4 w-4" />
                          ) : item.label === "Chapters" ? (
                            <BuildingIcon className="h-4 w-4" />
                          ) : item.label === "Impact" ? (
                            <OpportunityIcon className="h-4 w-4" />
                          ) : (
                            <PartnerIcon className="h-4 w-4" />
                          )}
                        </span>
                        {item.label}
                      </Link>
                      {item.children ? (
                        /* One continuous gold rail for the whole sub-list —
                           per-link rails rendered as broken dashed segments. */
                        <ul className="mb-3 ml-[7px] space-y-0.5 border-l-2 border-gold-400/70 pl-4">
                          {item.children.map((child) => (
                            <li key={child.href + child.label}>
                              <Link
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className={`block py-1.5 text-[13.5px] font-medium transition-colors hover:text-navy-900 ${
                                  isActive(pathname, child.href)
                                    ? "font-bold text-navy-900"
                                    : "text-ink-600"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              {/* The menu list above is the whole navigation: "Join GLANCE" is
                  inside it (Get Involved), and no /login or search appears. */}
              <div className="shrink-0 border-t border-line bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-ink-500 uppercase">
                  Governance · Leadership · National Civic Engagement
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
