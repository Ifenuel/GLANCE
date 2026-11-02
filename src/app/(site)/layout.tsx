import { Suspense, type ReactNode } from "react";
import { ConsentBanner } from "@/components/site/consent-banner";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CinematicIntro } from "@/components/site/cinematic-intro";
import { BackToTop } from "@/components/site/back-to-top";
import { EventCountdownBanner } from "@/components/site/event-countdown-banner";
import { getBannerSettings, listUpcomingEvents } from "@/server/content";

// Every public page reads live GLANCE records (chapters, posts, media). That
// data is intentionally fresh, so these routes render on demand instead of
// being partially prerendered — which is what produced the "uncached data"
// error on navigation.
export const instant = false;

/** The event advertisement, as its own suspending slot. Portal → Website
 * content decides whether it shows (banner.enabled) and which upcoming event
 * it advertises (banner.eventId); with no choice saved it falls back to the
 * soonest published event. Failures here must never take the site down — an
 * empty banner is fine: listUpcomingEvents already selects only events that
 * have not started (the time comparison lives inside its cached query, where
 * Date.now() is stable), so no further filtering happens here.
 *
 * The await lives INSIDE the slot, not in the layout body: while the static
 * shell prerenders, the ribbon's live data read produces a postponed hole,
 * and that hole may only land inside a Suspense boundary — which is exactly
 * what the "client rendering was requested outside a Suspense boundary"
 * build error on /about was about. Wrapping this slot keeps the whole layout
 * shell static. */
async function EventBannerSlot() {
  const [settings, upcoming] = await Promise.all([
    getBannerSettings().catch(() => ({ enabled: true, eventId: "" })),
    listUpcomingEvents(12).catch(() => []),
  ]);

  if (!settings.enabled) return null;

  const chosen =
    (settings.eventId
      ? upcoming.find((event) => event.id === settings.eventId)
      : undefined) ?? upcoming[0];
  const featured = chosen
    ? {
        id: chosen.id,
        title: chosen.title,
        startsAt: chosen.startsAt.toISOString(),
        location: chosen.location,
        registrationUrl: chosen.registrationUrl,
      }
    : null;
  return featured ? <EventCountdownBanner event={featured} /> : null;
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-canvas relative isolate flex min-h-screen flex-col">
      <CinematicIntro />
      {/* The stage is what the intro film reveals: hidden until it completes. */}
      <div className="site-stage flex min-h-screen flex-1 flex-col">
        {/* The event ribbon sits in the page's own flow at the very top, so
            it belongs to the site instead of floating over it. The site's own
            loading.tsx already covers everything below the header. There is
            nothing to show while this slot builds (the banner hides itself
            until 2.2s in), so the fallback is empty. */}
        <Suspense fallback={null}>
          <EventBannerSlot />
        </Suspense>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <BackToTop />
      </div>
      <ConsentBanner />
    </div>
  );
}
