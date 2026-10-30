"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type ActionItem =
  | {
      kind: "link";
      label: string;
      href: string;
      /** Destructive actions (delete, revoke) render red. */
      danger?: boolean;
    }
  | {
      kind: "submit";
      label: string;
      /** Form id this button submits; pair with <form id> elsewhere in the row. */
      formId: string;
      danger?: boolean;
    };

/**
 * The one action affordance used across the portal: a compact ⋯ button that
 * opens a real menu. Tables stay scannable because each row shows a single
 * control instead of a row of competing buttons; every action is one click
 * away inside the menu.
 *
 * Behaviour: click or keyboard (Enter/Space) opens; Escape, outside click and
 * scroll all close it. Focus returns to the trigger on close so keyboard
 * users are never stranded.
 */
export function ActionMenu({
  label,
  items,
}: {
  /** Accessible name for the trigger, e.g. "Actions for Ada Obi". */
  label: string;
  items: ActionItem[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onScroll() {
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // Closing on scroll keeps the menu from drifting away from its row on
    // long tables while the reader moves the page.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-navy-700 transition-colors hover:border-navy-200 hover:bg-navy-50 focus:outline-none focus:ring-2 focus:ring-navy-500/25"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3" r="1.6" />
          <circle cx="8" cy="8" r="1.6" />
          <circle cx="8" cy="13" r="1.6" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="rise absolute top-full right-0 z-40 mt-1.5 min-w-[190px] origin-top-right overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-[0_24px_50px_-24px_rgba(5,42,92,0.4)]"
        >
          {items.map((item) => {
            const danger = "danger" in item && item.danger;
            const className = `block w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold transition-colors ${
              danger
                ? "text-rose-600 hover:bg-rose-50"
                : "text-navy-800 hover:bg-navy-50"
            }`;

            if (item.kind === "link") {
              return (
                <Link
                  key={item.label}
                  role="menuitem"
                  href={item.href}
                  className={className}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                role="menuitem"
                type="submit"
                form={item.formId}
                className={className}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
