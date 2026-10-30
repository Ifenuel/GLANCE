import type { Metadata } from "next";
import { db } from "@/server/db";
import { ButtonLink } from "@/components/button-link";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, Section, SectionHeading, VerifiedNote } from "@/components/ui";
import { contentNotices } from "@/lib/glance";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Institutions and organisations working with GLANCE, and how to partner with the movement.",
};

export default async function PartnersPage() {
  const chapters = await db.chapter.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ state: "asc" }, { institution: "asc" }],
    select: { code: true, name: true, institution: true, state: true },
  });

  const ways = [
    {
      title: "Host a chapter",
      body: "Institutions and communities can host a GLANCE club, provide a meeting space and nominate a chapter coordinator.",
    },
    {
      title: "Support a programme",
      body: "Partners can support sessions, mentorship, materials or chapter activities.",
    },
    {
      title: "Offer opportunity",
      body: "Internships, mentorship placements and exposure visits give members a way to apply what they learn.",
    },
  ];

  return (
    <>
      <PageHeader
        background={pageBackgrounds.partners.image}
        backgroundAlt={pageBackgrounds.partners.alt}
        eyebrow="Partners"
        title="Working with institutions that develop people"
        intro={
          <p>
            GLANCE works with institutions and organisations that can host
            chapters, support the programme or open opportunities for members.
          </p>
        }
        actions={
          <ButtonLink href="/contact" size="lg">
            Discuss a partnership
          </ButtonLink>
        }
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="How to partner"
            title="Three ways to"
            accent="work with GLANCE"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {ways.map((way) => (
              <article
                key={way.title}
                className="rounded-xl border border-line bg-white p-6"
              >
                <h3 className="text-[16.5px] font-bold text-navy-900">
                  {way.title}
                </h3>
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-500">
                  {way.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-line bg-white p-6 lg:p-8">
              <h3 className="text-[16px] font-extrabold text-navy-900">
                Our commitment
              </h3>
              <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-500">
                GLANCE works with universities and institutions that host its
                clubs, so students can learn, practise and serve close to home.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-navy-50/40 p-6 lg:p-8">
              <h3 className="text-[16px] font-extrabold text-navy-900">
                Campuses hosting GLANCE chapters
              </h3>
              {chapters.length === 0 ? (
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-500">
                  Our first chapters are being activated now. When the secretariat
                  activates a campus, it is listed here automatically — check the
                  chapter&nbsp;directory for the live list.
                </p>
              ) : (
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
              )}
              <VerifiedNote>{contentNotices.partners.note}</VerifiedNote>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
