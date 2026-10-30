import { GlanceBroadcast, type BroadcastStats } from "@/components/site/glance-broadcast";
import { Container } from "@/components/ui";
import { platformSnapshot } from "@/server/content";

/**
 * "The GLANCE broadcast" — the site's own 40-second motion showreel,
 * presented right after the hero. The figures inside it come from the same
 * platform snapshot that feeds the "at a glance" board, so nothing on screen
 * can disagree with the site. When the homepage has already fetched the
 * snapshot for the cinematic intro, it passes the same figures in.
 */
export async function GLANCEBroadcastSection({ stats }: { stats?: BroadcastStats }) {
  const snapshot = stats ? null : await platformSnapshot();
  const figures: BroadcastStats = stats ?? {
    chapters: snapshot!.activeChapters,
    members: snapshot!.activeMembers,
    institutions: snapshot!.institutions,
    states: snapshot!.states,
  };

  return (
    <section id="broadcast" aria-label="GLANCE broadcast showreel" className="bg-navy-950 py-14 lg:py-20">
      <Container>
        <div className="mx-auto mb-7 max-w-2xl text-center">
          <p className="text-[11.5px] font-bold tracking-[0.24em] text-gold-400 uppercase">
            GLANCE broadcast
          </p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
            Look around. Rally. Act.
          </h2>
          <p className="mt-3 text-[14px] leading-[1.8] text-white/65">
            What GLANCE is, what it builds and where it stands — cut as a
            motion film straight from the pages of this website.
          </p>
        </div>

        <GlanceBroadcast stats={figures} />
      </Container>
    </section>
  );
}
