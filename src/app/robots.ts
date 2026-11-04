import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Generated rather than static so the sitemap address always matches the
 * origin the site is actually served from — a hardcoded robots.txt shipped
 * localhost to production once already.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
