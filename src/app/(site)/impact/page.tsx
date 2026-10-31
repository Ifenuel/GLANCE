import type { Metadata } from "next";
import Image from "next/image";
import heroCrowd from "@/assets/hero-crowd.jpg";
import { ButtonLink } from "@/components/button-link";
import { GLANCEBroadcastSection } from "@/components/home/broadcast";
import { Reveal } from "@/components/site/reveal";
import { KineticHeading, Parallax } from "@/components/site/motion";
import { Container } from "@/components/ui";
import { platformSnapshot } from "@/server/content";

export const metadata: Metadata = {
  title: "Our Impact | GLANCE",
  description:
    "Real people, real change. How GLANCE is equipping the next generation of Nigerian leaders.",
};

/**
 * The movement's journey. GLANCE's platform chapter opened in August
 * 2026; the figures on this page come from the movement's own records.
 * Earlier dates are deliberately not back-filled: the campus chapter
 * history predates this platform and is kept in its own archives.
 */
const TIMELINE = [
  {
    month: "August 2026",
    title: "The movement goes live",
    desc: "GLANCE's platform chapter opened: the governance, leadership and civic engagement club structure for tertiary institutions across Nigeria, led from the office of its founder, Seyi Adisa.",
  },
  {
    month: "September 2026",
    title: "First chapters activated",
    desc: "Founding campus chapters are activated and each receives its unique GLANCE chapter code — the node that anchors a school's members, sessions and civic projects.",
  },
  {
    month: "October 2026",
    title: "The member platform opens",
    desc: "The GLANCE team began operating the new platform: applications are reviewed, rosters are recorded, and member ID cards are issued with verifiable GLANCE IDs.",
  },
  {
    month: "Next",
    title: "Ten thousand leaders",
    desc: "The goal on record: 10,000 young leaders equipped through structured 30-week peer-led programmes — each one expected to multiply by mentoring others.",
  },
];

export default async function ImpactPage() {
  const snapshot = await platformSnapshot();

  const stats = [
    { value: `${snapshot.activeChapters}+`, label: "Chapters activated" },
    {
      value: `${snapshot.activeMembers.toLocaleString()}+`,
      label: "Members engaged",
    },
    { value: `${snapshot.institutions}+`, label: "Institutions represented" },
    { value: `${snapshot.states ?? 0}+`, label: "States reached" },
  ];

  return (
    <div className="bg-white">
      {/* ── Impact hero: the real GLANCE crowd as the backdrop ───────────── */}
      <section className="relative overflow-hidden bg-[#06142e] py-16 text-white lg:py-24">
        <div aria-hidden="true" className="absolute inset-0">
          <Parallax
            range={9}
            mobileRange={5}
            scaleTo={1.02}
            scaleFrom={1.16}
            className="absolute inset-0"
          >
            <Image
              src={heroCrowd}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </Parallax>
          {/* Scrims keep the photograph visible but the words readable. */}
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(6,20,46,0.96)_0%,rgba(6,20,46,0.88)_48%,rgba(6,20,46,0.62)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_88%_10%,transparent_38%,rgba(6,20,46,0.5)_100%)]" />
        </div>

        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_minmax(0,430px)] lg:items-center lg:gap-16">
            {/* The story beside the figures, at full width. */}
            <Reveal>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
                Real people. Real change.
              </span>
              <KineticHeading
                as="h1"
                text="Measured in young leaders, not promises."
                className="mt-4 max-w-[640px] text-balance text-[clamp(32px,4.6vw,54px)] font-extrabold leading-[1.06] tracking-[-0.03em] text-white"
              />
              <div
                aria-hidden="true"
                className="mt-6 h-px w-28 bg-gradient-to-r from-gold-400 via-gold-400/40 to-transparent"
              />
              <p className="mt-6 max-w-[540px] text-[15px] leading-[1.85] text-white/80">
                Every figure GLANCE publishes comes straight from the movement:
                chapters opened, members trained and states covered as the work
                happens.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/gallery" variant="gold">
                  Watch the films
                </ButtonLink>
                <ButtonLink
                  href="/chapters"
                  variant="navyOutline"
                  size="lg"
                  className="!border-white/40 !text-white"
                >
                  Find a chapter
                </ButtonLink>
              </div>
            </Reveal>

            {/* The figure panel: a quiet glass ledger. */}
            <Reveal delay={110}>
              <div className="sheen rounded-2xl border border-white/20 bg-white/[0.07] p-7 shadow-[0_46px_90px_-44px_rgba(2,10,28,0.95)] backdrop-blur-md sm:p-9">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
                  The movement in numbers
                </span>

                <dl className="mt-4">
                  {stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`group flex items-baseline justify-between gap-4 py-3.5 transition-colors duration-300 hover:pl-1 ${
                        index > 0 ? "border-t border-white/10" : ""
                      }`}
                    >
                      <dt className="text-[13.5px] font-semibold text-white/75 transition-colors duration-300 group-hover:text-white">
                        {stat.label}
                      </dt>
                      <dd className="font-data text-[26px] font-extrabold tabular-nums text-gold-400 transition-transform duration-300 group-hover:scale-110">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-7 border-t border-white/10 pt-5">
                  <p className="text-[12.5px] leading-[1.75] text-white/60">
                    Figures grow as chapters register members and activate
                    programmes across the country.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── The broadcast — the whole story in 40 seconds of motion ─────── */}
      <GLANCEBroadcastSection />

      {/* ── The journey — an honest, dated timeline ─────────────────────── */}
      <section className="bg-[#fafbfd] py-20">
        <Container>
          <Reveal>
            <div className="mx-auto mb-14 max-w-xl text-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">
                Milestones
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-navy-950">
                Our journey
              </h2>
              <p className="mt-3 text-[13.5px] leading-[1.8] text-ink-500">
                The story of the movement so far — told in real dates.
              </p>
            </div>
          </Reveal>

          <ol className="relative mx-auto max-w-[760px]">
            <span
              aria-hidden="true"
              className="absolute top-2 bottom-2 left-[15px] w-px bg-line"
            />
            {TIMELINE.map((item, index) => (
              <Reveal key={item.month} delay={index * 90}>
                <li className="group relative pb-10 pl-12 last:pb-0">
                  <span className="absolute top-1 left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white font-mono text-[11px] font-bold text-navy-800 shadow-sm transition-all duration-300 group-hover:scale-115 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-navy-950">
                    {index + 1}
                  </span>
                  <p className="text-[11px] font-bold tracking-[0.18em] text-gold-600 uppercase">
                    {item.month}
                  </p>
                  <h3 className="mt-1.5 text-[17px] font-extrabold text-navy-950 transition-transform duration-300 group-hover:translate-x-1">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-[620px] text-[13.5px] leading-[1.85] text-ink-500">
                    {item.desc}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={160}>
            <div className="mx-auto mt-12 max-w-[860px] rounded-2xl border border-line bg-white p-6 text-[12.5px] leading-[1.8] text-ink-500 sm:p-8">
              <p>
                <strong className="font-semibold text-navy-900">
                  About the dates:
                </strong>{" "}
                The movement&apos;s campus chapters predate this website. Every
                date shown here is a real date — earlier history is never
                back-filled into the timeline.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
