"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

/**
 * Pointer-reactive card: a gentle 3D tilt that follows the cursor plus a warm
 * spotlight that tracks the pointer across the surface. Pure progressive
 * enhancement — on touch devices, reduced-motion users, or SSR the card
 * renders as a plain surface with zero listeners attached.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 5,
  ariaLabel,
}: {
  children: ReactNode;
  /** Card styling lives here, so the tilt + spotlight read the same box. */
  className?: string;
  maxTilt?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      !window.matchMedia?.(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches
    ) {
      return;
    }

    let frame = 0;
    const move = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        node.style.setProperty("--rx", `${(0.5 - py) * maxTilt}deg`);
        node.style.setProperty("--ry", `${(px - 0.5) * maxTilt}deg`);
        node.style.setProperty("--mx", `${px * 100}%`);
        node.style.setProperty("--my", `${py * 100}%`);
      });
    };
    const leave = () => {
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
      node.style.setProperty("--mx", "50%");
      node.style.setProperty("--my", "50%");
    };

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [maxTilt]);

  return (
    <div
      ref={ref}
      className={`tilt spot ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
