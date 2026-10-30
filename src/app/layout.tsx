import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Typography
 *
 * Three faces, each with one job:
 *  - Plus Jakarta Sans carries headlines. Geometric, confident, still warm.
 *  - Inter carries body copy, forms and tables so dense portal screens scan.
 *  - Manrope carries numbers, labels and codes where digits must line up.
 */
const sans = Inter({
  variable: "--font-sans-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const data = Manrope({
  variable: "--font-data-face",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GLANCE: Governance, Leadership and National Civic Engagement",
    template: "%s | GLANCE",
  },
  description:
    "GLANCE is a youth leadership and civic engagement initiative, equipping young Africans with the knowledge, skills, values and platforms to solve problems, influence systems and contribute to a stronger, more prosperous nation.",
  keywords: [
    "GLANCE",
    "youth leadership",
    "civic engagement",
    "governance",
    "Nigeria",
  ],
  applicationName: "GLANCE",
  openGraph: {
    title: "GLANCE: young people, real solutions, a stronger nation",
    description:
      "A youth leadership and civic engagement initiative equipping young Africans to understand, engage and build.",
    siteName: "GLANCE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2550",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${data.variable} h-full antialiased`}
      /* Next 16 no longer overrides scroll-behavior during SPA navigation;
         this attribute restores instant scroll-to-top on route changes while
         keeping smooth scrolling for in-page anchors. */
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white">
        <script
          dangerouslySetInnerHTML={{
            // Pre-paint gate: on the homepage (the banner greets every fresh
            // visit there) hide the page stage before first paint so the
            // welcome moment plays on a clean stage. CinematicIntro releases
            // the stage when the banner is dismissed; reduced-motion
            // visitors skip the banner, so they skip the gate too.
            __html:
              "try{var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(!reduced&&location.pathname==='/'){document.documentElement.classList.add('intro-waiting')}}catch(e){}"
          }}
        />
        {children}
      </body>
    </html>
  );
}
