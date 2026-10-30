import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const instant = false;
import hallConversation from "@/assets/hall-conversation.jpg";
import { ButtonLink } from "@/components/button-link";
import { BuildingIcon, PinIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/page-header";
import { Container, Section, VerifiedNote } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getPublicChapterByCode } from "@/server/content";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const chapter = await getPublicChapterByCode(code.toUpperCase());
  if (!chapter) return { title: "Chapter not found" };
  return {
    title: chapter.name,
    description: `${chapter.name} | a GLANCE chapter at ${chapter.institution}, ${chapter.city}, ${chapter.state}. Chapter code ${chapter.code}.`,
  };
}

function ChapterProfileContent({ chapter }: { chapter: Awaited<ReturnType<typeof getPublicChapterByCode>> }) {
  if (!chapter) notFound();

  return (
    <>
      <PageHeader
        eyebrow={`Chapter ${chapter.code}`}
        background={hallConversation}
        backgroundAlt="A GLANCE chapter session in a hall"
        title={chapter.name}
        intro={
          <p>
            {chapter.description ??
              `A GLANCE club hosted at ${chapter.institution}. Members work through the GLANCE Pathway of character, influence and purpose, and contribute to their community under GLANCE oversight.`}
          </p>
        }
        actions={
          <>
            <ButtonLink href={`/join?chapter=${chapter.code}`} size="lg">
              Apply to this chapter
            </ButtonLink>
            <ButtonLink href="/chapters" variant="navyOutline" size="lg">
              All chapters
            </ButtonLink>
          </>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <h2 className="text-[22px] font-extrabold text-navy-900">About this chapter</h2>
              <p className="mt-4 text-[14.5px] leading-[1.9] text-ink-500">
                {chapter.name} is an activated chapter in the GLANCE network. It
                is hosted by {chapter.institution} in {chapter.city},{" "}
                {chapter.state}, and is recognised by the GLANCE secretariat.
              </p>
              <p className="mt-4 text-[14.5px] leading-[1.9] text-ink-500">
                Members of the chapter complete the GLANCE Pathway, take part in
                peer-led sessions and contribute to chapter activities. Chapter
                activity is reported to GLANCE through the member platform.
              </p>

              <dl className="mt-8 grid gap-5 border-t border-line pt-7 sm:grid-cols-2">
                <div>
                  <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">Institution</dt>
                  <dd className="mt-2 flex items-start gap-2 text-[14px] font-semibold text-navy-900">
                    <BuildingIcon className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
                    {chapter.institution}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">Location</dt>
                  <dd className="mt-2 flex items-start gap-2 text-[14px] font-semibold text-navy-900">
                    <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
                    {chapter.city}, {chapter.state}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">Chapter code</dt>
                  <dd className="mt-2 text-[14px] font-semibold text-navy-900">{chapter.code}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">Activated</dt>
                  <dd className="mt-2 text-[14px] font-semibold text-navy-900">{chapter.activatedAt ? formatDate(chapter.activatedAt) : "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">Registered members</dt>
                  <dd className="mt-2 text-[14px] font-semibold text-navy-900">{chapter.memberCount}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-bold tracking-[0.1em] text-ink-500 uppercase">Status</dt>
                  <dd className="mt-2 text-[14px] font-semibold text-emerald-700">Activated</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="text-[15px] font-extrabold text-navy-900">How to join this chapter</h3>
                <ol className="mt-4 space-y-4 text-[13.5px] leading-[1.8] text-ink-500">
                  <li>
                    <span className="font-bold text-navy-900">1. Apply.</span>{" "}
                    Submit a membership application and quote chapter code{" "}
                    {chapter.code}.
                  </li>
                  <li>
                    <span className="font-bold text-navy-900">2. Review.</span>{" "}
                    GLANCE or your chapter&apos;s coordinators review your application.
                  </li>
                  <li>
                    <span className="font-bold text-navy-900">3. Activate.</span>{" "}
                    If approved, you receive an activation code and set your
                    password on the GLANCE website.
                  </li>
                </ol>
                <ButtonLink href={`/join?chapter=${chapter.code}`} className="mt-6" size="sm">
                  Apply to join
                </ButtonLink>
              </div>

              <div className="rounded-2xl border border-line bg-navy-50/50 p-6">
                <h3 className="text-[15px] font-extrabold text-navy-900">Privacy</h3>
                <p className="mt-3 text-[13.5px] leading-[1.8] text-ink-500">
                  Member records are not published. Only the GLANCE team and
                  this chapter&apos;s coordinators can view member details, and
                  only for legitimate chapter administration.
                </p>
                <VerifiedNote>
                  Chapter activity shown on this page is derived from this
                  platform&apos;s records. Independent verification of chapter
                  operations should be requested from GLANCE.
                </VerifiedNote>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

export default async function ChapterProfilePage({ params }: Params) {
  const { code } = await params;
  const chapter = await getPublicChapterByCode(code.toUpperCase());

  if (!chapter) notFound();

  return (
    <Suspense fallback={<div className="p-10 text-sm text-navy-700">Loading chapter…</div>}>
      <ChapterProfileContent chapter={chapter} />
    </Suspense>
  );
}
