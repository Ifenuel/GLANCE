"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Keep in sync with .page-leave in globals.css. */
const LEAVE_MS = 220;
/** Safety valve: a slow navigation must never leave the page faded out. */
const LEAVE_RESET_MS = 900;

/**
 * Calm page cross-fade: the page dims as a visitor follows an internal link,
 * then the next page animates in through .page-enter.
 *
 * The fade is derived from the route the click started on rather than toggled
 * by an effect, so arriving anywhere new clears it immediately, no cascading
 * renders and no chance of a stranded dim overlay.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [armedPath, setArmedPath] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leaving = armedPath !== null && armedPath === pathname;

  useEffect(() => {
    function startLeaving() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      setArmedPath(window.location.pathname);

      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setArmedPath(null);
        resetTimer.current = null;
      }, LEAVE_RESET_MS);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("aria-disabled") === "true") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      startLeaving();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", startLeaving);
    window.addEventListener("glance:navigate", startLeaving);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", startLeaving);
      window.removeEventListener("glance:navigate", startLeaving);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  return (
    <div
      className={leaving ? "page-leave page-leave--active" : "page-leave"}
      style={{ transitionDuration: `${LEAVE_MS}ms` }}
    >
      {/* A hairline of gold runs across the top while the next page loads. */}
      <span
        aria-hidden="true"
        className={`nav-progress ${leaving ? "nav-progress--active" : ""}`}
      />
      <div key={pathname} className="page-enter">
        {children}
      </div>
    </div>
  );
}
