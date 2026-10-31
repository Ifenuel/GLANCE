import Image from "next/image";
import chapterAudience from "@/assets/chapter-audience.jpg";
import { ButtonLink } from "@/components/button-link";
import { ChapterIcon, MemberIcon, OpportunityIcon, PartnerIcon } from "@/components/icons";
import { Parallax, ScrubLine } from "@/components/site/motion";
import { Reveal } from "@/components/site/reveal";
import { Container } from "@/components/ui";

const practices = [
  { title: "Leadership", Icon: OpportunityIcon },
  { title: "Civic Engagement", Icon: MemberIcon },
  { title: "Mentorship", Icon: PartnerIcon },
  { title: "Community Impact", Icon: ChapterIcon },
];

/**
 * "Who We Are" — what GLANCE is, the founding image with the confidence line,
 * and the four everyday practices of the movement.
 */
export function Movement() {
  return (
    <section id="about" className="bg-white py-16 lg:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
          <Reveal>
            <p className="text-[11.5px] font-bold tracking-[0.18em] text-gold-600 uppercase">
              Who We Are
            </p>
            <h2 className="mt-4 text-[clamp(26px,4vw,40px)] leading-[1.12] font-extrabold tracking-[-0.025em] text-navy-900">
              A youth-led movement developing informed,
              <span className="text-navy-500"> capable leaders for Nigeria.</span>
            </h2>
            <div className="mt-6 max-w-[220px]">
              <ScrubLine className="from-gold-500 via-gold-500/60" />
            </div>
            <p className="mt-6 max-w-[540px] text-[14.5px] leading-[1.9] text-ink-500">
              GLANCE is a youth-led organisation of committed students, guided
              by the values of commitment to nation-building. Our mission is to
              develop members&apos; capacity to create opportunities to drive positive change
              in communities and the nation.
            </p>
            <div className="mt-8">
              <ButtonLink href="/about" variant="navy">
                Learn More
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_56px_-40px_rgba(5,42,92,0.45)]">
              <div className="relative aspect-16/11 w-full overflow-hidden">
                {/* The founding shot drifts at its own speed as the visitor
                    passes; a quieter travel keeps touch scrolling natural. */}
                <Parallax range={7} mobileRange={4} className="absolute inset-x-0 -inset-y-[10%]">
                  <Image
                    src={chapterAudience}
                    alt="Students taking part in a GLANCE campus session"
                    fill
                    sizes="(min-width: 1024px) 540px, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </Parallax>
              </div>
              <div className="border-t border-line p-6">
                <p className="text-[17px] font-extrabold text-navy-900">
                  Real People. Real Change. Lasting impact.
                </p>
                <p className="mt-2 text-[13px] leading-[1.8] text-ink-500">
                  Clubs led by the students who join them, supported by mentors
                  and the GLANCE secretariat.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {practices.map((practice, index) => (
            <Reveal key={practice.title} delay={140 + index * 70}>
              <div className="lift group flex h-full cursor-default items-center gap-3.5 rounded-xl border border-line bg-white px-5 py-4 hover:border-navy-200">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-800 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:bg-navy-800 group-hover:text-gold-400">
                  <practice.Icon className="h-5 w-5" />
                </span>
                <p className="text-[13.5px] font-bold text-navy-900">
                  {practice.title}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
