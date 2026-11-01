import type { Metadata } from "next";
import { ButtonLink } from "@/components/button-link";
import { MemberIcon, OpportunityIcon, PartnerIcon, UsersIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { MissionVision } from "@/components/site/mission-vision";
import { Reveal } from "@/components/site/reveal";
import { Container, Section, SectionHeading, VerifiedNote } from "@/components/ui";
import { contentNotices, founder, programme } from "@/lib/glance";

export const metadata: Metadata = {
  title: "About GLANCE",
  description:
    "GLANCE is a student leadership and civic engagement initiative, built on character, influence and purpose.",
};

const principles = [
  {
    title: "Learn how systems work",
    body: "Members study governance, public policy and civic responsibility so their ideas are grounded in how decisions are actually made.",
  },
  {
    title: "Grow the character to lead",
    body: "Leadership development starts with integrity: responsibility, accountability and the discipline to serve rather than to be seen.",
  },
  {
    title: "Apply it to a public need",
    body: "Every member is expected to put their skills to work: in technology, business, education, health, public service, entrepreneurship or their community.",
  },
];

const coreValues = [
  {
    title: "Knowledge",
    body: "You pursue understanding in governance, leadership, and public policy, not just information, but informed judgement.",
  },
  {
    title: "Service",
    body: "Leadership is a responsibility, not a reward. You lead to improve lives and strengthen institutions.",
  },
  {
    title: "Collaboration",
    body: "Sustainable impact is collective. You work with peers, communities, and stakeholders to solve complex problems.",
  },
] as const;

const philosophy = [
  {
    title: "Practice over Theory",
    body: "Every session should produce application, not just awareness.",
  },
  {
    title: "DEI-B",
    body: "Diversity, Equity, Inclusion, and Belonging are non-negotiable. Every member deserves equal space.",
  },
  {
    title: "Ethical Leadership",
    body: "Integrity and accountability are the foundation, not the aspiration.",
  },
  {
    title: "Local Action, Global Perspective",
    body: "Solve local challenges. Measure them against global governance standards.",
  },
  {
    title: "SDG Alignment",
    body: "All major initiatives should contribute to the United Nations Sustainable Development Goals.",
  },
] as const;

const membershipJourney = [
  {
    title: "Application",
    body: "Interested students complete an application form stating their motivation and intended contribution.",
  },
  {
    title: "Selection",
    body: "Applications are reviewed using standardised criteria: commitment, diversity, and quality of engagement.",
  },
  {
    title: "Onboarding / Induction",
    body: "Selected members attend an induction where they learn GLANCE values, structure, and expectations.",
  },
  {
    title: "Observation Period",
    body: "New members attend three consecutive meetings after induction before receiving their Leading at 27 book.",
  },
  {
    title: "Full Integration",
    body: "After meeting the book eligibility criteria, the member is formally integrated into the GLANCE Tables structure.",
  },
] as const;


export default function AboutPage() {
  return (
    <>
      <PageHeader
        background={pageBackgrounds.about.image}
        backgroundAlt={pageBackgrounds.about.alt}
        eyebrow="About GLANCE"
        title="A movement built to develop nation-builders, not just leaders."
        intro={
          <>
            <p>
              GLANCE, which stands for Governance, Leadership and National Civic Engagement,
              is a student leadership initiative. It develops young people who can contribute meaningfully wherever
              they find themselves.
            </p>
            <p>
              The initiative is delivered through {programme.deliveryModel}, and
              equips members with knowledge, values, mentorship and exposure.
            </p>
          </>
        }
        actions={
          <>
            <ButtonLink href="/join" size="lg">
              Join GLANCE
            </ButtonLink>
            <ButtonLink href="/pathway" variant="navyOutline" size="lg">
              The GLANCE Pathway
            </ButtonLink>
          </>
        }
      />

      <MissionVision />

      {/* ── The four practices + the statement the board leads with ──────── */}
      <section className="bg-white pt-4 pb-16 lg:pb-20">
        <Container>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Leadership",
                body: "Formation in character, responsibility and the discipline to serve.",
                Icon: UsersIcon,
              },
              {
                title: "Civic Engagement",
                body: "Understanding governance and practising participation that matters.",
                Icon: MemberIcon,
              },
              {
                title: "Mentorship",
                body: "Guidance from mentors and peers, rooted in Leading at 27.",
                Icon: PartnerIcon,
              },
              {
                title: "Community Project",
                body: "Turning what members learn into measurable public value.",
                Icon: OpportunityIcon,
              },
            ].map((practice, index) => (
              <Reveal key={practice.title} delay={index * 70}>
                <div className="sheen group flex h-full flex-col bg-white px-6 py-7 transition-colors duration-300 hover:bg-navy-50/50">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 transition-colors duration-300 group-hover:bg-navy-900 group-hover:text-gold-400">
                      <practice.Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="font-mono text-[11px] font-bold text-ink-300">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="rule-grow mt-4 w-fit text-[14.5px] font-extrabold text-navy-900">
                    {practice.title}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-[1.75] text-ink-500">
                    {practice.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <figure className="mt-10 rounded-2xl bg-navy-950 px-6 py-9 text-center sm:px-12">
              <blockquote className="mx-auto max-w-[720px] text-[clamp(19px,2.6vw,26px)] leading-[1.45] font-extrabold tracking-[-0.02em] text-white">
                “Young people are not just the future; they are the solution.”
              </blockquote>
              <figcaption className="mt-4 text-[11px] font-bold tracking-[0.22em] text-gold-400 uppercase">
                — {founder.name}, Founder
              </figcaption>
            </figure>
          </Reveal>
        </Container>
      </section>

      {/* ── Core values, philosophy and the membership journey ───────────── */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="What we stand for"
              title="The core values"
              accent="and the philosophy behind them."
              intro={
                <p>
                  GLANCE is built on three values that shape every session, and a
                  philosophy that turns those values into practice.
                </p>
              }
            />
          </Reveal>

          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
            <div className="grid sm:grid-cols-3">
              {coreValues.map((value, index) => (
                <Reveal key={value.title} delay={index * 60}>
                  <div className="sheen group h-full border-b border-line bg-white px-7 py-8 transition-colors duration-300 last:border-b-0 hover:bg-[#fdf4da]/25 sm:border-b-0 sm:border-r sm:last:border-r-0">
                    <p className="rule-grow w-fit text-[15px] font-extrabold text-navy-900">
                      {value.title}
                    </p>
                    <p className="mt-2 text-[13.5px] leading-[1.85] text-ink-500">
                      {value.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={120}>
            <div className="mt-10 rounded-2xl border border-line bg-navy-50/40 p-6 lg:p-9">
              <p className="text-[11.5px] font-bold tracking-[0.14em] text-navy-900/70 uppercase">
                The Philosophy
              </p>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                {philosophy.map((item) => (
                  <li key={item.title} className="border-l-2 border-gold-400 pl-5">
                    <p className="text-[14.5px] font-bold text-navy-900">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-[1.8] text-ink-500">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Joining GLANCE"
              title="The membership journey"
              accent="From application to full integration."
              intro={
                <p>
                  Membership is a structured path, not a sign-up. Every stage is
                  designed to confirm commitment and build understanding before a
                  member is fully integrated.
                </p>
              }
            />
          </Reveal>
          <ol className="relative mt-10 max-w-[760px]">
            <span
              aria-hidden="true"
              className="absolute top-2 bottom-2 left-[15px] w-px bg-line"
            />
            {membershipJourney.map((step, index) => (
              <Reveal key={step.title} delay={index * 60}>
                <li className="group relative pb-9 pl-12 last:pb-0">
                  <span className="absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white font-mono text-[12px] font-bold text-navy-900 shadow-sm transition-all duration-300 group-hover:bg-navy-900 group-hover:text-gold-400">
                    {index + 1}
                  </span>
                  <p className="rule-grow w-fit text-[15px] font-extrabold text-navy-900">
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-[1.8] text-ink-500">
                    {step.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>


      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Reveal>
              <SectionHeading
                eyebrow="What we do"
                title="More than leadership training."
                accent="A foundation for meaningful impact."
                intro={
                  <p>
                    GLANCE helps young people understand the systems that shape
                    society, develop the character to lead responsibly, and
                    acquire the confidence and practical skills to make a
                    difference. Members are prepared to move beyond discussing
                    change to participating in it.
                  </p>
                }
              />
              <ul className="mt-8 space-y-6">
                {principles.map((principle) => (
                  <li key={principle.title} className="border-l-2 border-gold-400 pl-5">
                    <p className="text-[15px] font-bold text-navy-900">
                      {principle.title}
                    </p>
                    <p className="mt-2 text-[14px] leading-[1.85] text-ink-500">
                      {principle.body}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-2xl border border-line bg-white p-6 lg:p-8">
                <SectionHeading
                  eyebrow="How it runs"
                  title="A structured, peer-led programme"
                  intro={
                    <p>
                      Clubs are led by students for students, with GLANCE providing
                      the framework, oversight and chapters. GLANCE reviews and
                      activates each chapter before it can register members.
                    </p>
                  }
                />
                <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">
                      Structure
                    </dt>
                    <dd className="mt-1.5 text-[14px] font-semibold text-navy-900">
                      {programme.durationWeeks} weeks
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">
                      Delivery
                    </dt>
                    <dd className="mt-1.5 text-[14px] font-semibold text-navy-900">
                      Peer-led campus clubs
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">
                      Principles
                    </dt>
                    <dd className="mt-1.5 text-[14px] font-semibold text-navy-900">
                      Character, Influence, Purpose
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">
                      Alignment
                    </dt>
                    <dd className="mt-1.5 text-[14px] font-semibold text-navy-900">
                      Leading at 27 by {founder.name}
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <Reveal>
              <SectionHeading
                eyebrow="Leadership"
                title="Founded by"
                accent={founder.name}
                intro={founder.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              />
            </Reveal>
            <Reveal delay={100}>
              <div className="rounded-2xl border border-line bg-navy-50/40 p-6 lg:p-8">
                <p className="text-[13px] font-bold tracking-[0.1em] text-navy-900/70 uppercase">
                  Publicly recorded recognitions
                </p>
                <ul className="mt-4 space-y-3">
                  {founder.honours.map((honour) => (
                    <li key={honour} className="text-[14px] text-ink-600">
                      <span className="mr-2 text-gold-500">•</span>
                      {honour}
                    </li>
                  ))}
                </ul>
                <VerifiedNote>
                  {contentNotices.partners.note} The recognitions above are
                  published in his public biography and have not been
                  independently verified.
                </VerifiedNote>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/leading-at-27" variant="navy" size="sm">
                    About Leading at 27
                  </ButtonLink>
                  <ButtonLink href="/contact" variant="outline" size="sm">
                    Contact the secretariat
                  </ButtonLink>
                </div>
                <div className="mt-7 border-t border-line pt-5">
                  <p className="text-[11.5px] font-bold tracking-[0.14em] text-navy-900/70 uppercase">
                    Verified across the web
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <a
                        href="https://africangovernance.org"
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 text-[13.5px] font-semibold text-navy-700 underline decoration-gold-400/60 underline-offset-4 transition-colors hover:text-navy-500"
                      >
                        African Governance Institute for Development (AGID)
                        <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          ↗
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
