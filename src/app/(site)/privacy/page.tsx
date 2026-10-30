import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { legalBackground } from "@/lib/page-backgrounds";
import { Container, Prose, Section } from "@/components/ui";
import { brand } from "@/lib/glance";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How GLANCE collect, use, store and protect personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        background={legalBackground.image}
        backgroundAlt={legalBackground.alt}
        eyebrow="Legal"
        title="Privacy Policy"
        intro={
          <p>
            This policy explains what personal information we collect, why we
            collect it, who can see it and how you can exercise your rights.
          </p>
        }
      />

      <Section>
        <Container className="max-w-[860px]">
          <Prose>
            <h2>1. Information we collect</h2>
            <p>
              We collect only what is required to administer membership and
              chapters:
            </p>
            <ul>
              <li>
                <strong>Identity and contact:</strong> full name, email address,
                phone number.
              </li>
              <li>
                <strong>Membership details:</strong> institution or community,
                chapter, department, academic level, membership category,
                gender (with an option to decline disclosure), registration
                date and a unique member ID.
              </li>
              <li>
                <strong>Chapter administration:</strong> position or role held in
                a chapter, plus chapter contact details supplied by chapter
                coordinators.
              </li>
              <li>
                <strong>Activity records:</strong> chapter activity reports and
                administrative audit entries.
              </li>
              <li>
                <strong>Media:</strong> images you or an administrator upload,
                such as a chapter logo or profile photo, stored with our cloud
                media provider.
              </li>
            </ul>

            <h2>2. Why we process it</h2>
            <ul>
              <li>To review and process membership and chapter applications.</li>
              <li>To administer chapters, members and invitations.</li>
              <li>To report on the network to GLANCE for governance purposes.</li>
              <li>To keep an audit trail of administrative changes.</li>
              <li>To contact you about your membership or application.</li>
            </ul>

            <h2>3. Consent and lawful basis</h2>
            <p>
              Membership applications require explicit consent before submission.
              Consent is recorded with a timestamp. Gender disclosure is optional;
              you may select &ldquo;prefer not to say&rdquo;. You may withdraw
              consent at any time by contacting the secretariat, after which your
              membership record will be closed or deleted as appropriate.
            </p>

            <h2>4. Who can see your information</h2>
            <ul>
              <li>
                <strong>The GLANCE team</strong> can see all chapter and member
                records in order to govern the network.
              </li>
              <li>
                <strong>Chapter coordinators</strong> can see only the records of
                their own chapter. They cannot access another chapter&apos;s
                private records.
              </li>
              <li>
                <strong>Members</strong> can see and update only their own record.
                Members cannot browse other members&apos; details.
              </li>
              <li>
                <strong>Public visitors</strong> see chapter-level information
                only: chapter name, institution, location, code and member count.
                No personal data is published.
              </li>
            </ul>

            <h2>5. Security</h2>
            <p>
              Passwords are stored using a salted one-way hash; they are never
              stored or transmitted in plain text. Sessions are held as opaque
              tokens in httpOnly cookies, and only a hash of the session token is
              stored in the database. Permissions are enforced on the server and
              at the database query level, not only in the interface. Sensitive
              endpoints are rate limited, and administrative changes are recorded
              in an audit log. Uploaded media is verified server-side before it is
              attached to a record.
            </p>

            <h2>6. Retention</h2>
            <p>
              Membership records are retained while a member is active and for as
              long as is necessary for governance, reporting and legal purposes.
              Applications that are rejected, and invitations that expire, are
              retained for a limited period for audit purposes and then removed.
              Audit logs are retained for accountability.
            </p>

            <h2>7. Your rights</h2>
            <p>
              Under the Nigeria Data Protection Act 2023 and comparable
              regulations, you may request access to your personal data, request
              correction of inaccurate data, request deletion where we no longer
              have a lawful basis to keep it, object to certain processing, and
              request a copy of your data in a portable              format. Chapter coordinators can export their own chapter&apos;s
              records; you can request your own record from the secretariat.
            </p>

            <h2>8. Contact</h2>
            <p>
              Requests and questions:{" "}
              <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
            </p>

            <h2>9. Changes</h2>
            <p>
              This policy may be updated as the platform develops. Material
              changes will be reflected on this page before they take effect.
            </p>
          </Prose>
        </Container>
      </Section>
    </>
  );
}
