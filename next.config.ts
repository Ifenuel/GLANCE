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
  },
  // Extra dev-server origin (hostname only, no scheme or port). Set it per
  // process so tunnelled/preview hostnames never need to be committed:
  //   NEXT_DEV_ALLOWED_ORIGIN=my-preview.example.dev npm run dev
  allowedDevOrigins: process.env.NEXT_DEV_ALLOWED_ORIGIN
    ? [process.env.NEXT_DEV_ALLOWED_ORIGIN]
    : undefined,
  cacheComponents: true,
  partialPrefetching: true,
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
