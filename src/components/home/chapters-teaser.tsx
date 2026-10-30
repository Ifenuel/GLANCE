import Image from "next/image";
import Link from "next/link";
import chapterAudience from "@/assets/chapter-audience.jpg";
import chapterCheer from "@/assets/chapter-cheer.jpg";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import heroCrowd from "@/assets/hero-crowd.jpg";
import { ButtonLink } from "@/components/button-link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/site/reveal";
import { Container, EmptyState, SectionHeading, VerifiedNote } from "@/components/ui";
import { listPublicChapters } from "@/server/content";

const covers = [chapterLecture, chapterAudience, chapterCheer, heroCrowd];

export async function ChaptersTeaser() {
  const chapters = await listPublicChapters();
  // The teaser spotlights four different institutions; the directory lists all.
  const seenInstitutions = new Set<string>();
  const distinct = chapters.filter((chapter) => {
    const key = chapter.institution.trim().toLowerCase();
    if (seenInstitutions.has(key)) return false;
    seenInstitutions.add(key);
    return true;
  });
  const featured = (distinct.length >= 4 ? distinct : chapters).slice(0, 4);

  return (
    <section id="chapters" className="bg-navy-50/50 py-16 lg:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal className="max-w-[560px]">
            <SectionHeading
              eyebrow="Explore"
              title="Chapters across campuses"
              accent="nationwide"
              intro={
                <p>
                  {chapters.length} activated{" "}
                  {chapters.length === 1 ? "chapter" : "chapters"} currently
                  listed on this platform, each recorded with its own chapter
                  code.
                </p>
              }
            />
          </Reveal>
          <Reveal delay={80} className="flex flex-wrap gap-3">
            <ButtonLink href="/chapters" size="sm">
              View All Chapters
            </ButtonLink>
            <ButtonLink href="/start-a-chapter" variant="outline" size="sm">
              Apply to Start One
            </ButtonLink>
          </Reveal>
        </div>

        {featured.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No chapters activated yet"
              description="Once GLANCE activates a chapter it appears here automatically, with its institution, location and chapter code."
              action={
                <ButtonLink href="/start-a-chapter" size="sm">
                  Apply to start a chapter
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((chapter, index) => (
              <Reveal key={chapter.id} delay={index * 80}>
                <Link
                  href={`/chapters/${chapter.code}`}
                  className="lift group relative flex aspect-4/5 flex-col overflow-hidden rounded-xl border border-navy-800/40 bg-navy-950"
                >
                  <Image
                    src={chapter.logoUrl ? chapter.logoUrl : covers[index % covers.length]}
                    alt={`${chapter.name} members`}
                    fill
                    sizes="(min-width: 1024px) 290px, 100vw"
                    className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/25 to-transparent"
                  />
                  <div className="relative mt-auto flex flex-1 flex-col justify-end p-5">
                    <span className="inline-flex w-fit items-center rounded-full bg-[#EAAE14] px-3 py-1 text-[10.5px] font-extrabold tracking-[0.12em] text-navy-950 transition-transform duration-300 group-hover:scale-105">
                      {chapter.code}
                    </span>
                    <h3 className="mt-3 text-[17px] leading-tight font-extrabold text-white">
                      {chapter.institution}
                    </h3>
                    <p className="mt-1 text-[12px] text-white/65">
                      {chapter.city}, {chapter.state}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-gold-300 transition-all group-hover:gap-3">
                      View Chapter
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-6 text-[12px]">
          <VerifiedNote>
            Chapter activation is recorded by GLANCE. Only chapters activated by
            GLANCE are published here. Pending applications are never
            listed as approved chapters.
          </VerifiedNote>
        </div>
      </Container>
    </section>
  );
}
