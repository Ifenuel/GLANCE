import { NextResponse } from "next/server";
import { requestIp } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { subscribeEmail } from "@/server/newsletter";

/**
 * Newsletter sign-up from the site footer and the /newsletter page.
 *
 * A route handler rather than a server action: the form is part of the shared
 * footer, and a plain POST keeps every page statically renderable while still
 * working with JavaScript disabled. The outcome is reported on /newsletter.
 */
export async function POST(request: Request) {
  const ip = await requestIp();

  const guard = await rateLimit(`subscribe:${ip ?? "unknown"}`, 6, 60 * 60 * 1000);
  if (!guard.ok) {
    return NextResponse.redirect(new URL("/newsletter?status=rate_limited", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.redirect(new URL("/newsletter?status=invalid", request.url), {
      status: 303,
    });
  }

  const outcome = await subscribeEmail({ formData, ip }).catch(() => "error" as const);

  return NextResponse.redirect(new URL(`/newsletter?status=${outcome}`, request.url), {
    status: 303,
  });
}
