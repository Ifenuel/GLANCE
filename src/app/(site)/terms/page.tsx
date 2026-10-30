import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { Container, Prose, Section } from "@/components/ui";
import { brand } from "@/lib/glance";
import { legalBackground } from "@/lib/page-backgrounds";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The rules for using the GLANCE website, submitting information and taking part in chapters, member listings, media, events and GLANCE activities.",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        background={legalBackground.image}
        backgroundAlt={legalBackground.alt}
        intro={
          <p>
            These terms govern your use of the GLANCE website, anything you
            submit through it and your participation in GLANCE chapters and
            activities. Please read them together with our Privacy Policy.
          </p>
        }
      />

      <Section>
        <Container className="max-w-[860px]">
          <Prose>
            <h2>1. About these terms</h2>
            <p>
              GLANCE (Generational Leaders and New-Generation Employment) is a
              student movement built to prepare young people in Nigeria for
              national leadership. These terms apply to every visitor to this
              website and to everyone who uses the GLANCE member platform. By
              using the website, submitting a form or joining a chapter, you
              agree to these terms.
            </p>
            <p>
              If you do not agree with any part of these terms, please contact
              the secretariat before using the platform, and stop using the
              website.
            </p>

            <h2>2. GLANCE accounts</h2>
            <p>
              Access to the member platform requires an account. You agree to:
            </p>
            <ul>
              <li>
                Provide accurate information in your profile and keep it up to
                date.
              </li>
              <li>
                Keep your password confidential and take reasonable care of
                your sign-in details.
              </li>
              <li>
                Use the platform only for GLANCE activities — never for
                unrelated commercial, political or personal promotion without
                the secretariat&apos;s approval.
              </li>
              <li>
                Not attempt to access another member&apos;s record, another
                chapter&apos;s data, or any part of the platform your role does
                not permit.
              </li>
            </ul>
            <p>
              The secretariat may suspend or close an account that breaks
              these rules, and may remove content that is unlawful, abusive,
              misleading or damaging to the GLANCE community.
            </p>

            <h2>3. Member profiles and listings</h2>
            <p>
              Chapter coordinators and the GLANCE team publish member listings.
              Only your name, institution, chapter, department, academic level
              and role are shown. Coordinators must obtain consent before
              publishing a member&apos;s details in a GLANCE listing. If you see
              your own details published wrongly, write to the secretariat and
              we will correct it.
            </p>

            <h2>4. Content you submit</h2>
            <p>
              Membership applications, chapter applications, contact messages
              and event notices submitted through this website must be true and
              made in good faith. You must have the right to share any content
              or photograph you upload, and it must respect the rights and
              dignity of others. We may edit or withdraw content that breaks
              these rules.
            </p>

            <h2>5. Media</h2>
            <p>
              Only the GLANCE secretariat publishes media to the public gallery.
              Members and coordinators may submit photographs and links to
              films; the secretariat decides what is published. Photographs of
              children or of people who have not consented will not be
              published. If you appear in a published photograph or film and
              want it removed, write to the secretariat and we will act
              promptly.
            </p>

            <h2>6. Events</h2>
            <p>
              Event information on this website is published in good faith.
              GLANCE may change dates, venues or programmes; check with your
              chapter before travelling. GLANCE is not liable for costs arising
              from a change to, or the cancellation of, an event.
            </p>

            <h2>7. Community standards</h2>
            <p>
              GLANCE chapters are communities of respect. Harassment,
              discrimination, hate speech, bullying, intimidation, and the
              promotion of violence or illegal activity are not tolerated in
              any GLANCE space, online or in person. Coordinators must act on
              reports and, where necessary, escalate to the secretariat.
            </p>

            <h2>8. Independent groups</h2>
            <p>
              GLANCE does not control groups that are not registered as GLANCE
              chapters, even where they use our name or materials. Registered
              GLANCE chapters are listed on this website; anything outside that
              framework is independent of GLANCE and not covered by these
              terms.
            </p>

            <h2>9. Intellectual property</h2>
            <p>
              The GLANCE name, logo, wordmark, emblem and the text, images and
              films published on this website belong to GLANCE or are used with
              the owners&apos; permission. You may share GLANCE content for
              non-commercial movement purposes with attribution. For any other
              use — including commercial use — write to the secretariat first.
            </p>

            <h2>10. Reliance on information</h2>
            <p>
              Content on this website is provided for general information. It
              does not amount to legal, financial or professional advice, and
              you should not rely on it as such. We work to keep information
              accurate and current but do not guarantee it.
            </p>

            <h2>11. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, GLANCE is not liable for
              loss or damage arising from your use of this website, or from
              content published by members or coordinators, except where we
              cannot exclude such liability under Nigerian law.
            </p>

            <h2>12. Governing law</h2>
            <p>
              These terms are governed by the laws of the Federal Republic of
              Nigeria. The courts of Nigeria have exclusive jurisdiction over
              any dispute arising from them.
            </p>

            <h2>13. Contact and changes</h2>
            <p>
              Questions about these terms:{" "}
              <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
            </p>
            <p>
              We may update these terms as GLANCE grows. The version published
              on this page is the current one.
            </p>
          </Prose>
        </Container>
      </Section>
    </>
  );
}
