import chapterAudience from "@/assets/chapter-audience.jpg";
import chapterCheer from "@/assets/chapter-cheer.jpg";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import pathwayInfluence from "@/assets/pathway-influence.jpg";
import { ButtonLink } from "@/components/button-link";
import { Reveal } from "@/components/site/reveal";
import { ProgrammeScrolly, type ProgrammeScene } from "@/components/home/programmes-scrolly";
import { Container, SectionHeading } from "@/components/ui";

const programmes: ProgrammeScene[] = [
  {
    title: "Leadership Development",
    body: "Structured sessions that build character and credible leadership, from campus to community.",
    image: chapterLecture,
    href: "/about",
  },
  {
    title: "Civic Engagement",
    body: "Members learn how governance actually works, then practise engaging with it.",
    image: chapterAudience,
    href: "/about",
  },
  {
    title: "Mentorship",
    body: "Guidance rooted in the Leading at 27 principles — Character, Influence, Purpose.",
    image: pathwayInfluence,
    href: "/about",
  },
  {
    title: "Community Projects",
    body: "Every pathway ends with members committing skills to a real public need.",
    image: chapterCheer,
    href: "/about",
  },
];

/**
 * "Our Programmes" — the four delivery strands of the GLANCE pathway, told
 * as a pinned scrollytelling scene on desktop (the photograph and index
 * crossfade while each strand scrolls through) and as a natural photo-led
 * story on phones.
 */
export function Programmes() {
  return (
    <section id="programmes" className="bg-navy-50/50 py-16 lg:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Our Programmes"
            title="We provide young leaders with real skills,"
            accent="real opportunities and real responsibility."
            intro={
              <p>
                Chapters deliver a structured programme: leadership formation,
                civic learning, mentorship and community projects, over 30
                weeks on each campus.
              </p>
            }
          />
        </Reveal>

        <ProgrammeScrolly programmes={programmes} />

        <Reveal delay={140}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white px-6 py-5">
            <p className="text-[13.5px] leading-[1.8] text-ink-600">
              Delivered through peer-led campus clubs, guided by the{" "}
              <strong className="font-semibold text-navy-900">
                Leading at 27
              </strong>{" "}
              framework.
            </p>
            <ButtonLink href="/leading-at-27" variant="outline" size="sm">
              About the framework
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
