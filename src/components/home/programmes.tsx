import Image from "next/image";
import Link from "next/link";
import chapterAudience from "@/assets/chapter-audience.jpg";
import chapterCheer from "@/assets/chapter-cheer.jpg";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import pathwayInfluence from "@/assets/pathway-influence.jpg";
import { ButtonLink } from "@/components/button-link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/site/reveal";
import { TiltCard } from "@/components/site/tilt-card";
import { Container, SectionHeading } from "@/components/ui";

const programmes = [
  {
    title: "Leadership Development",
    body: "Structured sessions that build character and credible leadership, from campus to community.",
    image: chapterLecture,
  },
  {
    title: "Civic Engagement",
    body: "Members learn how governance actually works, then practise engaging with it.",
    image: chapterAudience,
  },
  {
    title: "Mentorship",
    body: "Guidance rooted in the Leading at 27 principles — Character, Influence, Purpose.",
    image: pathwayInfluence,
  },
  {
    title: "Community Projects",
    body: "Every pathway ends with members committing skills to a real public need.",
    image: chapterCheer,
  },
];

/**
 * "Our Programmes" — the four delivery strands of the GLANCE pathway, in the
 * image-led card arrangement of the design board.
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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {programmes.map((programme, index) => (
            <Reveal key={programme.title} delay={index * 80}>
              <TiltCard className="group h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white">
                  <div className="relative aspect-16/11 w-full overflow-hidden">
                    <Image
                      src={programme.image}
                      alt={`GLANCE ${programme.title.toLowerCase()}`}
                      fill
                      sizes="(min-width: 1024px) 260px, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-gold-400 to-gold-300 transition-transform duration-500 group-hover:scale-x-100"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-[15.5px] leading-snug font-extrabold text-navy-900">
                      {programme.title}
                    </h3>
                    <p className="mt-2.5 text-[13px] leading-[1.75] text-ink-500">
                      {programme.body}
                    </p>
                    <Link
                      href="/about"
                      className="mt-auto inline-flex items-center gap-2 pt-5 text-[12.5px] font-bold text-navy-900 transition-all group-hover:gap-3 group-hover:text-navy-500"
                    >
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>

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
