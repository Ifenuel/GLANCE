/**
 * The public address of this site.
 *
 * Until the GLANCE custom domain is live, everything (sitemap, robots, social
 * cards and transactional-email links) points at the deployment that actually
 * answers. When glance.org.ng resolves, set NEXT_PUBLIC_APP_ORIGIN to it — one
 * environment variable and this file follows automatically.
 */
const LIVE_ORIGIN = "https://glance-mu-nine.vercel.app";

function resolveSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "";

  const cleaned = raw.replace(/\/+$/, "");
  if (!/^https?:\/\//.test(cleaned)) return LIVE_ORIGIN;

  // A deployed build must never publish localhost URLs to the world.
  if (
    process.env.NODE_ENV === "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)/.test(cleaned) &&
    !process.env.LOCAL_EMAIL_LINKS
  ) {
    return LIVE_ORIGIN;
  }

  return cleaned;
}

export const SITE_URL = resolveSiteUrl();
