"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
 * Behaviour: click or keyboard (Enter/Space) opens; Escape and outside click
 * close it. Focus returns to the trigger on close so keyboard users are never
 * stranded.
 *
 * Placement: the menu renders into <body> with `position: fixed`, so no
 * ancestor `overflow-hidden` (a card, a table wrapper) can ever clip it, and
 * the coordinates are clamped to the viewport — near the screen bottom it
 * opens upward, near either edge it shifts inward. On a phone this is the
 * difference between an action you can reach and one buried off-screen.
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
  /** Viewport coordinates the portal menu is anchored to. */
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (
        !wrapRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Measure after paint, then clamp: keep the menu inside the viewport with
  // an 8px gutter, flipping above the trigger when it would poke past the
  // bottom edge.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const rect = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const menuWidth = Math.min(menu.offsetWidth, vw - 16);
      const menuHeight = menu.offsetHeight;

      let left = rect.right - menuWidth; // right-aligned with the trigger
      left = Math.max(8, Math.min(left, vw - menuWidth - 8));

      let top = rect.bottom + 6;
      if (top + menuHeight > vh - 8) top = rect.top - menuHeight - 6;
      top = Math.max(8, Math.min(top, vh - menuHeight - 8));

      setPos({ top, left });
      if (menu.style.maxWidth !== `${menuWidth}px`) {
        menu.style.width = `min(${menuWidth}px, 92vw)`;
      }
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
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
        className="relative z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-navy-700 transition-colors hover:border-navy-200 hover:bg-navy-50 focus:outline-none focus:ring-2 focus:ring-navy-500/25"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3" r="1.6" />
          <circle cx="8" cy="8" r="1.6" />
          <circle cx="8" cy="13" r="1.6" />
        </svg>
      </button>

      {open
        ? createPortal(
            <div
              id={menuId}
              ref={menuRef}
              role="menu"
              className="rise fixed z-[9998] min-w-[190px] overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-[0_24px_50px_-24px_rgba(5,42,92,0.4)]"
              style={{ top: pos.top, left: pos.left, visibility: pos.top === 0 && pos.left === 0 ? "hidden" : "visible" }}
            >
              {items.map((item) => {
                const danger = "danger" in item && item.danger;
                const className = `block w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold transition-colors ${
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
