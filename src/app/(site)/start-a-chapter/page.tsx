import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/server/db";
import { ChapterApplicationForm } from "@/components/forms/chapter-application-form";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, Section, SectionHeading, VerifiedNote } from "@/components/ui";

export const metadata: Metadata = {
  title: "Start a Chapter",
  description:
    "Apply to bring a GLANCE chapter to your institution or community. GLANCE reviews and activates every chapter.",
};

const process = [
  {
    title: "Submit an application",
    body: "Tell GLANCE about your institution, the interest you have gathered and who would lead the club.",
  },
  {
    title: "GLANCE review",
    body: "GLANCE reviews the application. If it is approved, a chapter record is created and given a unique chapter code.",
  },
  {
    title: "Coordinator activation",
    body: "The applicant receives an activation code and becomes the chapter's coordinator on the GLANCE platform.",
  },
  {
    title: "Chapter activation",
    body: "Coordinators can register and invite members only after GLANCE marks the chapter active.",
  },
];

export default function StartAChapterPage() {
  return (
    <>
      <PageHeader
        background={pageBackgrounds.startChapter.image}
        backgroundAlt={pageBackgrounds.startChapter.alt}
        eyebrow="Grow the network"
        title="Bring GLANCE to your institution"
        intro={
          <>
            <p>
              Chapters are hosted by universities, polytechnics and communities,
              and are always led by the people on the ground. GLANCE provides the
              framework, oversight and chapter record.
            </p>
            <p>
              If there is no activated chapter near you, apply here. Every
              application is reviewed by GLANCE before a chapter is created.
            </p>
          </>
        }
        aside={
          <ol className="space-y-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/15">
            {process.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-500/70 text-[12px] font-bold text-gold-400">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-white">
                    {step.title}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-[1.75] text-navy-100/80">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="What a chapter needs"
                title="A host, a leader"
                accent="and a commitment"
                intro={
                  <p>
                    A chapter does not need a budget to start. It needs people
                    willing to meet consistently, and an institution willing to
                    host the club.
                  </p>
                }
              />
              <ul className="space-y-4 text-[14px] leading-[1.85] text-ink-500">
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-500"
                  />
                  An institution, department, student union or community
                  organisation that will host the club.
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-500"
                  />
                  A contact person who can coordinate the chapter on the
                  GLANCE platform.
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-500"
                  />
                  A group of interested students or community members ready to
                  begin the pathway.
                </li>
              </ul>

              <div className="rounded-2xl border border-line bg-navy-50/40 p-6">
                <h3 className="text-[15px] font-extrabold text-navy-900">
                  Campuses hosting GLANCE chapters
                </h3>
                {/* Chapter data reads the database directly, so it streams in
                    its own boundary while the page shell renders instantly. */}
                <Suspense fallback={
                  <p className="mt-2 text-[13px] leading-[1.8] text-ink-500" aria-busy="true">
                    Loading the campus directory…
                  </p>
                }>
                  <LiveChapters />
                </Suspense>
                <VerifiedNote>
                  The chapter directory shows only chapters activated by GLANCE.
                </VerifiedNote>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 lg:p-8">
              <h2 className="text-[20px] font-extrabold text-navy-900">
                Chapter application
              </h2>
              <p className="mt-2 text-[13.5px] leading-[1.8] text-ink-500">
                Complete every field. GLANCE will contact the listed person about
                the next step.
              </p>
              <div className="mt-7">
                <ChapterApplicationForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

/** Live chapter badges streamed separately from the static page shell. */
async function LiveChapters() {
  const chapters = await db.chapter.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ state: "asc" }, { institution: "asc" }],
    select: { code: true, institution: true },
  });

  if (chapters.length === 0) {
    return (
      <p className="mt-2 text-[13px] leading-[1.8] text-ink-500">
        No chapter has been activated yet — your campus could be the first. Once
        the secretariat activates it, the campus appears here and in the chapter
        directory automatically.
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-[13px] leading-[1.8] text-ink-500">
        The institutions currently hosting activated GLANCE chapters, straight
        from the live directory.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {chapters.map((chapter) => (
          <li
            key={chapter.code}
            className="rounded-full border border-navy-200 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-navy-800"
          >
            <a href={`/chapters/${chapter.code}`} className="hover:text-navy-950">
              {chapter.institution}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
