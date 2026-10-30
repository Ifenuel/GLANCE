import type { Metadata } from "next";
import { ButtonLink } from "@/components/button-link";
import { ChaptersDirectory } from "@/components/site/chapters-directory";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, Section, VerifiedNote } from "@/components/ui";
import { listPublicChapters, platformSnapshot } from "@/server/content";

export const metadata: Metadata = {
  title: "Chapter Directory",
  description:
    "Search activated GLANCE chapters by institution, city, state or chapter code.",
};

export default async function ChaptersPage() {
  const [chapters, snapshot] = await Promise.all([
    listPublicChapters(),
    platformSnapshot(),
  ]);

  return (
    <>
      <PageHeader
        background={pageBackgrounds.chapters.image}
        backgroundAlt={pageBackgrounds.chapters.alt}
        eyebrow="Our network"
        title="Find a GLANCE chapter"
        intro={
          <>
            <p>
              Every activated chapter is recorded by GLANCE with its own chapter
              code, which members use when they apply to join. Only chapters that
              GLANCE has activated appear in this directory.
            </p>
            <p className="text-[13.5px] text-navy-100/80">
              {snapshot.activeChapters} activated{" "}
              {snapshot.activeChapters === 1 ? "chapter" : "chapters"} across{" "}
              {snapshot.institutions}{" "}
              {snapshot.institutions === 1 ? "institution" : "institutions"} in
              Nigeria today.
            </p>
          </>
        }
        actions={
          <>
            <ButtonLink href="/start-a-chapter" size="lg">
              Start a Chapter
            </ButtonLink>
            <ButtonLink href="/join" variant="navyOutline" size="lg">
              Join GLANCE
            </ButtonLink>
          </>
        }
      />

      <Section>
        <Container>
          <ChaptersDirectory
            chapters={chapters.map((chapter) => ({
              id: chapter.id,
              code: chapter.code,
              name: chapter.name,
              institution: chapter.institution,
              city: chapter.city,
              state: chapter.state,
              memberCount: chapter.memberCount,
              logoUrl: chapter.logoUrl,
            }))}
          />
          <VerifiedNote>
            Member names and personal details are never published. The directory
            shows chapter-level information only; member records are visible to
            GLANCE and to that chapter&apos;s coordinators in the member area.
          </VerifiedNote>
        </Container>
      </Section>
    </>
  );
}
