import Image from "next/image";
import Link from "next/link";
import heroCrowd from "@/assets/hero-crowd.jpg";
import {
  ArrowRight,
  ChapterIcon,
  MemberIcon,
  OpportunityIcon,
  PartnerIcon,
} from "@/components/icons";
import { Parallax } from "@/components/site/motion";
import { Reveal } from "@/components/site/reveal";
import { Container } from "@/components/ui";

const reasons = [
  {
    title: "Build Your Skills",
    body: "Governance, policy and leadership practice over 30 structured weeks.",
    Icon: OpportunityIcon,
  },
  {
    title: "Make an Impact",
    body: "Commit your skills to a real public need in your community.",
    Icon: ChapterIcon,
  },
  {
    title: "Grow Your Network",
    body: "Mentors, peers and alumni across campuses nationwide.",
    Icon: PartnerIcon,
  },
];

/**
 * "Join the Movement" — one full-bleed photographic band closing the story of
 * the homepage: mission statement, the membership call to action, and the
 * three reasons the journey is worth it.
 */
export function GetInvolved() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      {/* Photography carries the band; the navy wash keeps text contrast AAA.
          The crowd drifts slowly under the wash as the band crosses — the
          movement literally moving underneath the call to act. */}
      <div className="absolute inset-x-0 -inset-y-[12%]">
        <Parallax range={10} mobileRange={6} className="relative h-full">
          <Image
            src={heroCrowd}
            alt="GLANCE members together at a national gathering"
            fill
            sizes="100vw"
            className="object-cover object-[center_30%] opacity-45"
          />
        </Parallax>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
      />

      <Container className="relative py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <Reveal>
            <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.22em] text-gold-400 uppercase">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              Join the Movement
            </p>
            <h2 className="mt-5 text-[clamp(28px,4.2vw,44px)] leading-[1.08] font-extrabold tracking-[-0.025em] text-white">
              Be part of a generation
              <span className="block text-gold-400">that leads responsibly.</span>
            </h2>
            <p className="mt-5 max-w-[520px] text-[15px] leading-[1.9] text-navy-100/85">
              Membership is open to students and young graduates in institutions
              with an activated GLANCE chapter. Your journey starts with one
              application — and a community that expects the best of you.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/join"
                className="sheen group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold-400 px-7 text-[14px] font-extrabold text-navy-950 shadow-[0_18px_40px_-18px_rgba(234,174,20,0.65)] transition-transform hover:-translate-y-0.5 hover:bg-gold-300"
              >
                <MemberIcon className="h-4.5 w-4.5" />
                Join GLANCE
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/start-a-chapter"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-7 text-[14px] font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10"
              >
                Start a Chapter
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ul className="grid gap-4">
              {reasons.map(({ title, body, Icon }) => (
                <li
                  key={title}
                  className="group flex items-start gap-4 rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm transition-all duration-300 hover:translate-x-1 hover:border-gold-400/45 hover:bg-white/[0.11]"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-400/40 bg-navy-950/50 text-gold-400 transition-all duration-300 group-hover:scale-105 group-hover:border-gold-400/70 group-hover:bg-navy-900">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-bold text-white">
                      {title}
                    </span>
                    <span className="mt-1.5 block text-[13px] leading-[1.8] text-navy-100/75">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
