import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, Section, VerifiedNote } from "@/components/ui";
import { brand } from "@/lib/glance";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the GLANCE secretariat.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        background={pageBackgrounds.contact.image}
        backgroundAlt={pageBackgrounds.contact.alt}
        eyebrow="Contact"
        title="Talk to the GLANCE secretariat"
        intro={
          <p>
            Questions about membership, chapters, partnerships or the Leading at
            27 book are welcome. Messages are received by the secretariat and
            routed to the right team.
          </p>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-white p-6">
                <h2 className="text-[15px] font-extrabold text-navy-900">
                  Email
                </h2>
                <p className="mt-2 text-[14px]">
                  <a
                    href={`mailto:${brand.contactEmail}`}
                    className="font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                  >
                    {brand.contactEmail}
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <h2 className="text-[15px] font-extrabold text-navy-900">
                  Start a chapter
                </h2>
                <p className="mt-2 text-[14px] leading-[1.85] text-ink-500">
                  Bring a GLANCE club to your campus or community.
                </p>
                <Link
                  href="/start-a-chapter"
                  className="mt-3 inline-block text-[13.5px] font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                >
                  Read how to start a chapter
                </Link>
              </div>

              <div className="rounded-2xl border border-line bg-navy-50/40 p-6">
                <h2 className="text-[15px] font-extrabold text-navy-900">
                  Membership and account support
                </h2>
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-500">
                  For activation codes, invitations or account recovery, contact
                  your chapter&apos;s coordinators first. GLANCE can assist where
                  the chapter is not yet active.
                </p>
                <VerifiedNote>
                  Email delivery for invitations and password resets requires a
                  configured transactional email provider. Until GLANCE connects
                  one, activation codes are shared directly by the
                  GLANCE team.
                </VerifiedNote>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 lg:p-8">
              <h2 className="text-[20px] font-extrabold text-navy-900">
                Send a message
              </h2>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
