import type { Metadata } from "next";
import Image from "next/image";

export const instant = false;
import pathInfluence from "@/assets/pathway-influence.jpg";
import { JoinForm } from "@/components/forms/join-form";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, Section, SectionHeading, VerifiedNote } from "@/components/ui";
import { listPublicChapters } from "@/server/content";

export const metadata: Metadata = {
  title: "Join GLANCE",
  description:
    "Membership information and application for GLANCE, the student leadership and civic engagement initiative.",
};

const eligibility = [
  "You are a student, non-student participant or alumnus with an interest in governance and public service.",
  "You can commit to a peer-led club programme on your campus or in your community.",
  "Your chapter has been activated by GLANCE, and pending chapters cannot register members.",
  "You consent to GLANCE processing your data for membership administration.",
];

const steps = [
  {
    title: "Apply",
    body: "Submit the form on this page. Quote your chapter code if you know it.",
  },
  {
    title: "Review",
    body: "GLANCE or your chapter's coordinators review your application.",
  },
  {
    title: "Activate",
    body: "Approved applicants receive an activation code and set a password on the GLANCE website.",
  },
  {
    title: "Participate",
    body: "You join your chapter's sessions and begin the GLANCE Pathway.",
  },
];

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const [{ chapter }, chapters] = await Promise.all([
    searchParams,
    listPublicChapters(),
  ]);

  return (
    <>
      <PageHeader
        background={pageBackgrounds.join.image}
        backgroundAlt={pageBackgrounds.join.alt}
        eyebrow="Membership"
        title="Join a movement of young problem-solvers"
        intro={
          <>
            <p>
              GLANCE members are students, non-student participants and alumni who
              want to understand how governance works and to contribute to their
              communities.
            </p>
            <p>
              Membership is chapter-based. If your institution does not yet have a
              chapter, you can{" "}
              <a
                href="/start-a-chapter"
                className="font-semibold text-white underline decoration-gold-400 decoration-2 underline-offset-4"
              >
                apply to start one
              </a>
              .
            </p>
          </>
        }
        aside={
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-white/15">
            <Image
              src={pathInfluence}
              alt="A GLANCE member during a session"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="Who can join"
                title="Eligibility and expectations"
                intro={
                  <p>
                    GLANCE is open to people who are willing to learn in public and
                    serve where they are. There is no fee to apply.
                  </p>
                }
              />
              <ul className="space-y-4">
                {eligibility.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-[14px] leading-[1.85] text-ink-500"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl border border-line bg-navy-50/40 p-6">
                <h3 className="text-[15px] font-extrabold text-navy-900">
                  What happens after you apply
                </h3>
                <ol className="mt-4 space-y-4">
                  {steps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11.5px] font-bold text-white">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-[14px] font-bold text-navy-900">
                          {step.title}
                        </span>
                        <span className="mt-1 block text-[13.5px] leading-[1.8] text-ink-500">
                          {step.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <VerifiedNote>
                  Cohorts run on each chapter&apos;s own calendar. GLANCE has not
                  published fixed national intake dates.
                </VerifiedNote>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="text-[15px] font-extrabold text-navy-900">
                  Your data
                </h3>
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-500">
                  We collect only what is needed to administer membership.
                  Chapter coordinators see the members of their own chapter;
                  members cannot browse each other&apos;s records. You can request
                  correction or deletion of your record by contacting the
                  secretariat.
                </p>
                <p className="mt-3 text-[13px] text-ink-500">
                  Read the{" "}
                  <a
                    href="/privacy"
                    className="font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 lg:p-8">
              <h2 className="text-[20px] font-extrabold text-navy-900">
                Membership application
              </h2>
              <p className="mt-2 text-[13.5px] leading-[1.8] text-ink-500">
                Fields marked with an asterisk are required. Applications are
                reviewed by a human, and you will hear back by email.
              </p>
              <div className="mt-7">
                <JoinForm
                  chapterCodes={[
                    ...(chapter ? [chapter] : []),
                    ...chapters.map((item) => item.code),
                  ]}
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
