import Link from "next/link";
import { CountUp } from "@/components/count-up";
import { ArrowRight, BuildingIcon, ChapterIcon, MemberIcon, PinIcon } from "@/components/icons";
import { Reveal } from "@/components/site/reveal";
import { Container, VerifiedNote } from "@/components/ui";
import { platformSnapshot } from "@/server/content";

/**
 * "GLANCE at a glance" — the four live counters from this platform's own
 * records, presented as a scoreboard: deep navy fabric, gold accents, one
 * ledger row per figure (reads as a list on phones, a two-panel board on
 * desktop) and a gold "Our Impact" tile closing the block.
 */
export async function AtAGlance() {
  const snapshot = await platformSnapshot();

  const stats = [
    {
      label: "Chapters",
      caption: "across institutions",
      value: snapshot.activeChapters,
      Icon: ChapterIcon,
    },
    {
      label: "Members",
      caption: "registered and engaged",
      value: snapshot.activeMembers,
      Icon: MemberIcon,
    },
    {
      label: "Institutions",
      caption: "represented",
      value: snapshot.institutions,
      Icon: BuildingIcon,
    },
    {
      label: "States",
      caption: "reached nationwide",
      value: snapshot.states ?? 0,
      Icon: PinIcon,
    },
  ];

  return (
    <section aria-label="GLANCE at a glance" className="bg-white">
      <Container className="py-12 lg:py-16">
        <Reveal>
          <div className="overflow-hidden rounded-2xl bg-navy-950 shadow-[0_40px_80px_-50px_rgba(5,36,94,0.7)]">
            {/* Kicker row */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
              <span className="font-data text-[11px] font-bold tracking-[0.28em] text-gold-400 uppercase">
                GLANCE at a glance
              </span>
              <Link
                href="/impact"
                className="inline-flex items-center gap-2 text-[12px] font-bold text-white/80 transition-colors hover:text-gold-300"
              >
                See the impact
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* The ledger: one row per figure, hairline-divided. */}
              <dl>
                {stats.map((stat, index) => (
                  <Reveal key={stat.label} delay={index * 70}>
                    <div
                      className={`row-glow flex items-center gap-4 px-5 py-5 sm:px-8 sm:py-6 ${
                        index > 0 ? "border-t border-white/10" : ""
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 bg-white/5 text-gold-400">
                        <stat.Icon className="h-5 w-5" />
                      </span>
                      <dt className="min-w-0 flex-1">
                        <p className="text-[15px] font-extrabold text-white">
                          {stat.label}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-white/55">
                          {stat.caption}
                        </p>
                      </dt>
                      <dd className="font-data shrink-0 text-[34px] leading-none font-extrabold tabular-nums tracking-[-0.03em] text-gold-400">
                        <CountUp value={stat.value} suffix="+" />
                      </dd>
                    </div>
                  </Reveal>
                ))}
              </dl>

              {/* Impact tile */}
              <Reveal delay={300} className="border-t border-white/10 lg:border-t-0 lg:border-l">
                <Link
                  href="/impact"
                  className="sheen group flex h-full min-h-[150px] flex-col justify-between bg-gold-400 px-5 py-6 transition-colors duration-300 hover:bg-gold-300 sm:px-8 lg:min-h-0"
                >
                  <div>
                    <p className="text-[15px] font-extrabold tracking-[-0.01em] text-navy-950">
                      Our Impact
                    </p>
                    <p className="mt-2 max-w-[240px] text-[12.5px] leading-[1.65] text-navy-950/75">
                      Everything the movement has achieved together.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-[13px] font-extrabold text-navy-950 transition-all duration-300 group-hover:gap-3">
                    See the impact page
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 text-[12px]">
          <VerifiedNote>
            Figures reflect the movement&apos;s activated chapters, registered
            members and their institutions and states.
          </VerifiedNote>
        </div>
      </Container>
    </section>
  );
}
