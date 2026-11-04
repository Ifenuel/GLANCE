import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { SubscribeForm } from "@/components/forms/subscribe-form";
import { CheckIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/page-header";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Stay informed",
  description:
    "Occasional updates from GLANCE: new chapters, events, programmes and openings — a few emails a year, and easy to leave.",
};

const benefits = [
  "A new chapter opening near you",
  "Events and sessions you can attend",
  "Programmes and roles when they open",
  "What the network is building, in short",
];

const notices: Record<string, { title: string; body: string }> = {
  pending: {
    title: "Almost there",
    body: "Check your inbox and click the confirmation link. You are not on the list until you do, and we never write again if you do not.",
  },
  pending_no_email: {
    title: "You are on the list",
    body: "Email delivery is being set up, so the confirmation message will follow once it is switched on.",
  },
  already: {
    title: "You are already on the list",
    body: "That address is confirmed. Nothing more to do.",
  },
  rate_limited: {
    title: "Too many attempts",
    body: "Several sign-ups came from this network in the last hour. Try again a little later.",
  },
  error: {
    title: "That did not go through",
    body: "We could not save the address or send the confirmation just now. Please try again in a moment.",
  },
  confirmed: {
    title: "You are on the list",
    body: "Your email address is confirmed. You will hear from GLANCE when something worth your attention happens.",
  },
  unsubscribed: {
    title: "You have left the list",
    body: "No further updates will be sent to that address. You can rejoin at any time using the form below.",
  },
  invalid: {
    title: "That link has expired",
    body: "Confirmation and unsubscribe links can only be used once. Enter your email below and we will send a fresh one.",
  },
};

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const notice = status ? notices[status] : null;
  const noticeIsProblem =
    status === "error" || status === "invalid" || status === "rate_limited";

  return (
    <>
      <PageHeader
        eyebrow="Stay informed"
        title="Hear from GLANCE, occasionally"
        intro={
          <p>
            A short list for people who want to know when a chapter opens, an
            event is happening, or a programme is accepting people. No monthly
            digest, no noise — a few emails a year.
          </p>
        }
        actions={
          <ButtonLink href="/join" size="lg">
            Apply to join instead
          </ButtonLink>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
            <div>
              {notice ? (
                <div
                  role={noticeIsProblem ? "alert" : "status"}
                  className={`mb-8 rounded-xl border px-5 py-4 ${
                    noticeIsProblem
                      ? "border-rose-200 bg-rose-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <p
                    className={`text-[13.5px] font-bold ${
                      noticeIsProblem ? "text-rose-800" : "text-emerald-800"
                    }`}
                  >
                    {notice.title}
                  </p>
                  <p
                    className={`mt-1 text-[13px] leading-[1.7] ${
                      noticeIsProblem ? "text-rose-800/80" : "text-emerald-800/80"
                    }`}
                  >
                    {notice.body}
                  </p>
                </div>
              ) : null}

              <h2 className="text-[24px] leading-[1.2] font-extrabold tracking-[-0.02em] text-navy-900">
                What you will actually receive
              </h2>
              <ul className="mt-6 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span className="text-[14px] leading-[1.7] text-ink-600">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 max-w-[560px] text-[13px] leading-[1.8] text-ink-500">
                We ask you to confirm your address before anything is sent, and
                every email carries a one-click way to leave. Your address is
                never sold or shared, and it is used only for these updates — as
                described in our{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_18px_44px_-30px_rgba(10,37,80,0.45)]">
              <h2 className="text-[17px] font-extrabold text-navy-900">
                Add your email
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-[1.7] text-ink-500">
                You will receive one confirmation message. Nothing else until you
                click it.
              </p>
              <div className="mt-5">
                <SubscribeForm source="newsletter-page" tone="light" />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
