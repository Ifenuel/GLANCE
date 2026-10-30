import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-level first line of defence for the management portal.
 *
 * Requests without a session cookie never reach a renderer | they receive a
 * hard HTTP 307 to the login page instead of a streamed shell. The cookie
 * check here is intentionally cheap and non-authoritative: every portal page
 * and server action still validates the full session against the database in
 * src/server/auth.ts. This guard only removes an obvious anonymous path to
 * protected markup.
 */
const SESSION_COOKIE = "glance_session";

/** Unauthenticated entry points that must stay reachable. */
const PUBLIC_PORTAL_PATHS = new Set([
  "/portal/login",
  "/portal/forgot-password",
  "/portal/reset-password",
  "/portal/activate",
]);

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PORTAL_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/portal/login", request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
