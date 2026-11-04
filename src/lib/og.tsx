import { ImageResponse } from "next/og";

/**
 * One share-card design for the whole site: deep navy ground, a gold kicker,
 * the page's own headline in white and the GLANCE lockup along the bottom.
 *
 * Built once so an article, a chapter and the homepage cannot drift apart, and
 * so every link posted to WhatsApp, X or LinkedIn carries the actual title of
 * what was shared rather than a generic logo card.
 */
export const OG_SIZE = { width: 1200, height: 630 };

export function ogCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  // Long headlines are trimmed so the card never overflows its 630px height.
  const headline = title.length > 105 ? `${title.slice(0, 102).trimEnd()}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #071c3d 0%, #0A2550 45%, #103a72 100%)",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {/* Gold bloom, top right, like the site's hero glow. */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 560,
            height: 560,
            borderRadius: 560,
            background:
              "radial-gradient(circle, rgba(234,174,20,0.28) 0%, rgba(234,174,20,0) 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 4, background: "#EAAE14" }} />
          <div
            style={{
              color: "#F3C44B",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: headline.length > 60 ? 62 : 76,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            {headline}
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 26,
                color: "rgba(255,255,255,0.68)",
                fontSize: 28,
                lineHeight: 1.4,
                maxWidth: 880,
              }}
            >
              {subtitle.length > 120 ? `${subtitle.slice(0, 117).trimEnd()}…` : subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.18)",
            paddingTop: 26,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div
              style={{
                color: "#FFFFFF",
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              GLANCE
            </div>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: "#EAAE14",
              }}
            />
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 24 }}>
            Governance · Leadership · Civic Engagement
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
