type LogoProps = {
  /**
   * "dark" — for light backgrounds: the lockup sits straight on the page.
   * "light" — for dark panels: the lockup is placed on a white plate so the
   * navy wordmark stays legible.
   */
  variant?: "dark" | "light";
  /** Height utilities for the lockup, e.g. "h-9" or "h-10 sm:h-11". */
  className?: string;
  /** Kept for API compatibility; the supplied lockup already includes its tagline. */
  withTagline?: boolean;
};

/** The emblem only (silhouettes, swoosh and star), from the supplied brand files. */
export function GlanceMark({
  className,
  height,
}: {
  className?: string;
  /** Accepted for compatibility; the emblem is sized by className or height. */
  tone?: "dark" | "light";
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/_brand/glance-emblem.png"
      alt=""
      aria-hidden="true"
      className={className}
      style={height ? { height, width: "auto" } : undefined}
    />
  );
}

/**
 * The full GLANCE lockup from the supplied brand files. One height class
 * controls the whole mark — the plate and the image are never sized
 * independently, so the logo can't clip at any breakpoint.
 */
export function GlanceLogo({ variant = "dark", className }: LogoProps) {
  // Callers sometimes pass only transform utilities (scale/translate). Those
  // must never leave the image unsized — that is what blew the logo up to the
  // full drawer width — so a height class is always guaranteed.
  const hasHeight = /(^|\s)h-/.test(className ?? "");
  const size = hasHeight ? className! : `h-10 ${className ?? ""}`.trim();

  if (variant === "light") {
    return (
      // bg-[#ffffff] rather than a token: the plate must stay white even in
      // the site's dark theme, where the .bg-white token is re-mapped navy.
      <span className="inline-flex items-center rounded-lg bg-[#ffffff] px-2 py-1.5 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/_brand/glance-lockup.png"
          alt="GLANCE: Governance, Leadership and National Civic Engagement"
          className={`w-auto ${size}`}
        />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/_brand/glance-lockup.png"
      alt="GLANCE: Governance, Leadership and National Civic Engagement"
      className={`w-auto ${size}`}
    />
  );
}
