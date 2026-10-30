import type { Metadata } from "next";
import Image from "next/image";
import chapterCheer from "@/assets/chapter-cheer.jpg";
import { ButtonLink } from "@/components/button-link";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, Section, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Alumni",
  description:
    "GLANCE alumni continue the movement beyond campus, mentoring members and serving their communities.",
};

const paths = [
  {
    title: "Mentor a chapter",
    body: "Alumni with professional experience support current members through mentorship and guest sessions.",
  },
  {
    title: "Serve in your field",
    body: "Alumni are expected to keep contributing: in public service, business, education, health, technology or community work.",
  },
  {
    title: "Represent the movement",
    body: "Alumni help open doors for chapters: hosting visits, speaking at sessions and connecting members to opportunity.",
  },
];

export default function AlumniPage() {
  return (
    <>
      <PageHeader
        background={pageBackgrounds.alumni.image}
        backgroundAlt={pageBackgrounds.alumni.alt}
        eyebrow="Alumni"
        title="The pathway does not end at graduation"
        intro={
          <p>
            GLANCE members can continue as alumni once they leave campus. Alumni
            keep the same member record in the platform and are recorded as
            alumni members by their chapter or GLANCE.
          </p>
        }
        actions={
          <>
            <ButtonLink href="/contact" size="lg">
              Contact the secretariat
            </ButtonLink>
            <ButtonLink href="/join" variant="navyOutline" size="lg">
              Join GLANCE
            </ButtonLink>
          </>
        }
        aside={
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-white/15">
            <Image
              src={chapterCheer}
              alt="GLANCE members celebrating at a gathering"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        }
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Staying involved"
            title="Three ways alumni"
            accent="continue to serve"
            intro={
              <p>
                Alumni stay part of the GLANCE story: their chapter keeps their
                record safe, and the movement calls on their experience to lift
                the next cohort.
              </p>
            }
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {paths.map((path) => (
              <article
                key={path.title}
                className="lift sheen h-full rounded-xl border border-line bg-white p-6"
              >
                <h3 className="text-[16.5px] font-bold text-navy-900">
                  {path.title}
                </h3>
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-500">
                  {path.body}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
