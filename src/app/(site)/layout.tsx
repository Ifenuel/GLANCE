import type { ReactNode } from "react";
import { ConsentBanner } from "@/components/site/consent-banner";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CinematicIntro } from "@/components/site/cinematic-intro";
import { BackToTop } from "@/components/site/back-to-top";

// Every public page reads live GLANCE records (chapters, posts, media). That
// data is intentionally fresh, so these routes render on demand instead of
// being partially prerendered — which is what produced the "uncached data"
// error on navigation.
export const instant = false;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-canvas relative isolate flex min-h-screen flex-col">
      <CinematicIntro />
      {/* The stage is what the intro film reveals: hidden until it completes. */}
      <div className="site-stage flex min-h-screen flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <BackToTop />
      </div>
      <ConsentBanner />
    </div>
  );
}
