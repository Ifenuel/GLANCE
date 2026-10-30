import { GLANCEBroadcastSection } from "@/components/home/broadcast";
import { AtAGlance } from "@/components/home/at-a-glance";
import { ChaptersTeaser } from "@/components/home/chapters-teaser";
import { FounderFilm } from "@/components/home/founder-film";
import { GetInvolved } from "@/components/home/get-involved";
import { HomeHero } from "@/components/home/hero";
import { InsightsTeaser } from "@/components/home/insights-teaser";
import { LeadingAt27 } from "@/components/home/leading-at-27";
import { Movement } from "@/components/home/movement";
import { Programmes } from "@/components/home/programmes";
import { platformSnapshot } from "@/server/content";

/**
 * Homepage, in the internal design arrangement:
 * welcome banner → hero → broadcast → at-a-glance → the founder's film →
 * who we are → programmes → chapters → book band → join the movement → news.
 * The welcome banner plays before the page reveals on a visitor's first stop;
 * the GLANCE broadcast lives after it as the homepage's own section, so
 * nothing stands between a visitor and the website itself.
 */
export default async function HomePage() {
  const snapshot = await platformSnapshot();
  const stats = {
    chapters: snapshot.activeChapters,
    members: snapshot.activeMembers,
    institutions: snapshot.institutions,
    states: snapshot.states,
  };

  // NOTE: the welcome banner is rendered once by the (site) layout (pathname
  // gates it to this page). Mounting it here as well would stack two banners.
  return (
    <>
      <HomeHero />
      <GLANCEBroadcastSection stats={stats} />
      <AtAGlance />
      <FounderFilm />
      <Movement />
      <Programmes />
      <ChaptersTeaser />
      <LeadingAt27 />
      <GetInvolved />
      <InsightsTeaser />
    </>
  );
}
