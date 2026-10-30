import Image from "next/image";
import mediaInterview from "@/assets/media-interview.jpg";
import { ButtonLink } from "@/components/button-link";
import { Reveal } from "@/components/site/reveal";
import { Container } from "@/components/ui";
import { heroCopy } from "@/lib/glance";

/**
 * The homepage hero: the real film still of the founder on the ground at a
 * GLANCE gathering, with the movement's headline laid over it. The layout,
 * photograph and copy are the site's established opening — unchanged from
 * the approved design. The live figures live in the "GLANCE at a glance"
 * board further down the page, not here: the founder asked for the hero to
 * stand on the photograph and the headline alone.
 */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <Image
        src={mediaInterview}
        alt="Seyi Adisa in conversation with a community leader at a GLANCE gathering"
        fill
        priority
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="-z-20 object-cover object-[64%_28%] sm:object-center"
      />

      {/* Layered scrims: keep the photograph visible while the headline stays
          razor readable. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(3,20,44,0.96)_0%,rgba(3,20,44,0.86)_34%,rgba(3,20,44,0.42)_62%,rgba(3,20,44,0.24)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_15%_100%,rgba(3,20,44,0.9),transparent_60%)]"
      />
      {/* Fine engineering grid for a modern, technical undertone. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(120%_90%_at_20%_20%,black,transparent_75%)]"
      />

      <Container className="flex min-h-[640px] flex-col justify-end pt-20 pb-12 sm:min-h-[680px] lg:min-h-[760px] lg:pt-28">
        <Reveal className="max-w-[680px]">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[10.5px] font-bold tracking-[0.22em] text-gold-300 uppercase backdrop-blur-md">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_12px_rgba(251,202,75,0.9)]" />
            {heroCopy.eyebrow}
          </p>

          <h1 className="mt-7 text-[clamp(38px,7vw,68px)] leading-[0.98] font-extrabold tracking-[-0.035em] text-white">
            Young People.
            <br />
            Real Solutions.
            <br />
            <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
              A Stronger Nation.
            </span>
          </h1>

          <p className="mt-7 max-w-[560px] text-[16px] leading-[1.8] text-white/80">
            {heroCopy.supporting}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink
              href="/join"
              size="lg"
              className="sheen bg-gold-400 text-navy-900 hover:bg-gold-500 shadow-[0_6px_16px_-8px_rgba(234,174,20,0.9)] shadow-[0_18px_40px_-18px_rgba(251,202,75,0.75)]"
            >
              Join GLANCE
            </ButtonLink>
            <ButtonLink
              href="/chapters"
              size="lg"
              className="border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/12"
            >
              Explore Our Chapters
            </ButtonLink>
          </div>
        </Reveal>
      </Container>

      {/* Live value ribbon: the movement's four practices, forever in motion. */}
      <div className="marquee relative border-y border-white/10 bg-navy-950/70 py-3.5 backdrop-blur-sm">
        <div className="marquee__track text-[11.5px] font-bold tracking-[0.28em] text-gold-300/80 uppercase">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-12" aria-hidden={copy === 1}>
              {[
                "Leadership",
                "Civic Engagement",
                "Mentorship",
                "Community Impact",
                "Nation Building",
              ].map((word, i) => (
                <span key={`${copy}-${i}`} className="flex items-center gap-12">
                  {word}
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400/70" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
