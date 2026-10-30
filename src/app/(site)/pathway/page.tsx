import type { Metadata } from "next";
import Image from "next/image";
import chapterCheer from "@/assets/chapter-cheer.jpg";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import pathCharacter from "@/assets/pathway-character.jpg";
import pathInfluence from "@/assets/pathway-influence.jpg";
import { ButtonLink } from "@/components/button-link";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Reveal } from "@/components/site/reveal";
import { Container, Section, SectionHeading, VerifiedNote } from "@/components/ui";
import { leadingAt27, pillars, programme } from "@/lib/glance";

export const metadata: Metadata = {
  title: "The GLANCE Pathway",
  description:
    "The GLANCE Pathway: character, influence and purpose, a 30-week, peer-led programme delivered through campus clubs.",
};

const images: Record<string, typeof pathCharacter> = {
  character: pathCharacter,
  influence: pathInfluence,
  purpose: chapterCheer,
};

const experience = [
  {
    title: "Weekly club sessions",
    body: "Peer-led discussions on governance, policy and civic responsibility, guided by the GLANCE framework.",
  },
  {
    title: "Mentorship and exposure",
    body: "Members learn from practitioners in public service, business, law and civil society.",
  },
  {
    title: "Practice, not theory",
    body: "Debates, advocacy exercises and community projects that put learning into public use.",
  },
  {
    title: "A record of service",
    body: "Chapter activity is reported to GLANCE, so members leave with evidence of contribution.",
  },
];

export default function PathwayPage() {
  return (
    <>
      <PageHeader
        background={pageBackgrounds.pathway.image}
        backgroundAlt={pageBackgrounds.pathway.alt}
        eyebrow="The GLANCE Pathway"
        title="Character. Influence. Purpose."
        intro={
          <>
            <p>
              The pathway is the structure behind every GLANCE club: a{" "}
              {programme.durationWeeks}-week, peer-led programme that moves members
              from understanding how power and systems work, to earning
              influence, to serving a cause bigger than themselves.
            </p>
            <p>
              It draws directly on the principles in{" "}
              <strong className="font-semibold text-white">
                {leadingAt27.title}
              </strong>{" "}
              by {leadingAt27.author}, the framework behind the initiative.
            </p>
          </>
        }
        actions={
          <>
            <ButtonLink href="/join" size="lg">
              Apply to join
            </ButtonLink>
            <ButtonLink href="/chapters" variant="navyOutline" size="lg">
              Find a chapter
            </ButtonLink>
          </>
        }
        aside={
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-white/15">
            <Image
              src={chapterLecture}
              alt="A GLANCE session in progress"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        }
      />

      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Three principles"
              title="Each stage builds the next"
              intro={
                <p>
                  The three principles are cumulative. Character without
                  influence changes nothing; influence without purpose serves the
                  wrong things. GLANCE works on all three, in order.
                </p>
              }
            />
          </Reveal>

          <ol className="mt-12 space-y-8">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.key} delay={index * 80}>
                <li className="grid gap-6 rounded-2xl border border-line bg-white p-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-center lg:p-8">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl">
                    <Image
                      src={images[pillar.key]}
                      alt={`${pillar.title}, GLANCE members`}
                      fill
                      sizes="(min-width: 1024px) 380px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold tracking-[0.18em] text-gold-500">
                      {pillar.number}
                    </p>
                    <h3 className="mt-2 text-[24px] font-extrabold text-navy-900">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-[1.85] text-ink-500">
                      {pillar.summary}
                    </p>
                    <p className="mt-4 text-[14px] leading-[1.9] text-ink-600">
                      {pillar.detail}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="tint">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <Reveal>
              <SectionHeading
                eyebrow="What members experience"
                title="How the programme"
                accent="actually runs"
                intro={
                  <p>
                    Clubs meet on their own campus, led by members with GLANCE
                    oversight. The rhythm is consistent across every chapter so
                    that the experience is comparable nationwide.
                  </p>
                }
              />
              <VerifiedNote>
                GLANCE has not published a confirmed cohort calendar or a
                year-by-year curriculum for the pathway. Session structure is
                shown as described publicly; exact schedules are published by
                each chapter.
              </VerifiedNote>
            </Reveal>

            <Reveal delay={100}>
              <ul className="grid gap-5 sm:grid-cols-2">
                {experience.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-line bg-white p-5"
                  >
                    <p className="text-[15px] font-bold text-navy-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-[13.5px] leading-[1.85] text-ink-500">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/join" variant="navy">
                  Join GLANCE
                </ButtonLink>
                <ButtonLink href="/leading-at-27" variant="outline">
                  About Leading at 27
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
