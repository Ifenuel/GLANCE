import type { Metadata } from "next";
import Image from "next/image";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import { ButtonLink } from "@/components/button-link";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Reveal } from "@/components/site/reveal";
import { Container, Prose, Section, SectionHeading, VerifiedNote } from "@/components/ui";
import { founder, leadingAt27, pillars } from "@/lib/glance";

export const metadata: Metadata = {
  title: "Leading at 27 by Seyi Adisa",
  description:
    "Leading at 27: How Young Leaders Can Change the World by Seyi Adisa, the framework of character, influence and purpose behind GLANCE.",
};

export default function LeadingAt27Page() {
  return (
    <>
      <PageHeader
        background={pageBackgrounds.leadingAt27.image}
        backgroundAlt={pageBackgrounds.leadingAt27.alt}
        eyebrow="The book"
        title="Leading at 27"
        intro={
          <>
            <p>
              Written by {leadingAt27.author},{" "}
              <em>{leadingAt27.subtitle}</em> is a practical leadership manual for
              young Africans. Its principles of character, influence and purpose
              are the framework GLANCE clubs are built on.
            </p>
          </>
        }
        actions={
          <>
            <ButtonLink href={leadingAt27.buyUrl} external size="lg">
              Get your copy
            </ButtonLink>
            <ButtonLink href="/pathway" variant="navyOutline" size="lg">
              See how GLANCE uses it
            </ButtonLink>
          </>
        }
        aside={
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/media/leading-at-27-book.webp"
              alt="Leading at 27 by Seyi Adisa"
              width={1526}
              height={1241}
              priority
              className="h-auto w-full rounded-xl shadow-[0_28px_60px_-24px_rgba(2,20,44,0.7)]"
            />
          </div>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
            <Reveal>
              <SectionHeading
                eyebrow="Why it matters"
                title="Leaders need tools,"
                accent="not applause"
                intro={
                  <p>
                    The book treats leadership as a craft to be practised:
                    understanding systems, earning trust, and applying both to a
                    need that is bigger than the individual.
                  </p>
                }
              />
              <div className="mt-6">
                <Prose>
                  <p>
                    GLANCE takes that message onto campus. Every chapter works
                    through the same three principles, with sessions built around
                    them and mentorship from practitioners who have held
                    responsibility in public life, business and civil society.
                  </p>
                  <p>
                    The book is written for young professionals, entrepreneurs and
                    emerging leaders, the same people GLANCE prepares through its
                    clubs.
                  </p>
                </Prose>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-2xl border border-line bg-white p-6 lg:p-8">
                <h3 className="text-[15px] font-extrabold text-navy-900">
                  Book details
                </h3>
                <dl className="mt-5 space-y-4 text-[13.5px]">
                  <div>
                    <dt className="font-bold text-navy-900">Title</dt>
                    <dd className="mt-1 text-ink-500">{leadingAt27.title}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-navy-900">Subtitle</dt>
                    <dd className="mt-1 text-ink-500">{leadingAt27.subtitle}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-navy-900">Author</dt>
                    <dd className="mt-1 text-ink-500">{leadingAt27.author}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-navy-900">Presented</dt>
                    <dd className="mt-1 text-ink-500">{leadingAt27.launched}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-navy-900">Where to buy</dt>
                    <dd className="mt-1 text-ink-500">
                      <a
                        href={leadingAt27.buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                      >
                        Sunshine Bookseller listing
                      </a>
                    </dd>
                  </div>
                </dl>
                <VerifiedNote>
                  Publisher and ISBN could not be verified from public sources.
                  Availability and price are set by the bookseller. Confirm
                  stock, pricing and subtitle wording with GLANCE before any
                  campaign.
                </VerifiedNote>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="tint">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <Reveal>
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-line">
                <Image
                  src={chapterLecture}
                  alt="Students during a GLANCE session"
                  fill
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <SectionHeading
                eyebrow="From the page to the campus"
                title="The three principles in practice"
                intro={
                  <p>
                    Each principle in the book maps to a stage of the GLANCE
                    Pathway, and members work through them with their chapter.
                  </p>
                }
              />
              <ul className="mt-7 space-y-5">
                {pillars.map((pillar) => (
                  <li key={pillar.key} className="border-l-2 border-gold-400 pl-5">
                    <p className="text-[15px] font-bold text-navy-900">
                      {pillar.number} · {pillar.title}
                    </p>
                    <p className="mt-2 text-[13.5px] leading-[1.85] text-ink-500">
                      {pillar.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-2xl border border-line bg-navy-50/40 p-6 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
              <div>
                <SectionHeading
                  eyebrow="The author"
                  title={founder.name}
                  intro={
                    <p>
                      {founder.role}. {founder.bio[1]}
                    </p>
                  }
                />
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <ButtonLink href={leadingAt27.buyUrl} external>
                  Get your copy
                </ButtonLink>
                <ButtonLink href="/about#mission" variant="outline">
                  About GLANCE
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
