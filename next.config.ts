import type { NextConfig } from "next";

/** Baseline hardening headers for every route. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Hide only the Next.js development badge; compile/runtime errors remain visible in logs.
  devIndicators: false,
  // Pages read live Aiven records during prerendering; keep build-time database
  // pressure within the service connection quota instead of spawning a burst.
  experimental: {
    // Set by the security upgrade to Next.js 16.4.2; keeps `next upgrade` on
    // the security channel rather than jumping majors.
    agentUpgrade: "security",
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 25,
    // The portal (app) segment is an authenticated gate that deliberately
    // blocks on the session read every navigation (see its layout). Skip the
    // implicit per-page "uncached data" validation for these routes; pages
    // that explicitly export `instant` are still validated.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  // Extra dev-server origin (hostname only, no scheme or port). Set it per
  // process so tunnelled/preview hostnames never need to be committed:
  //   NEXT_DEV_ALLOWED_ORIGIN=my-preview.example.dev npm run dev
  allowedDevOrigins: process.env.NEXT_DEV_ALLOWED_ORIGIN
    ? [process.env.NEXT_DEV_ALLOWED_ORIGIN]
    : undefined,
  cacheComponents: true,
  // Must stay `false` for now: with it enabled, routes that read URL data
  // (/news/[slug], /chapters/[code], /join?chapter=…) render only their
  // shell — the streamed body is left in a hidden `<div id="S:…">` and the
  // page shows just header/footer. Re-test when upgrading Next.js; both
  // flags become defaults and the option is removed in the next major.
  partialPrefetching: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
