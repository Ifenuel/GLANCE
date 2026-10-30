import Image from "next/image";
import { ButtonLink } from "@/components/button-link";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow } from "@/components/ui";
import { leadingAt27 } from "@/lib/glance";

export function LeadingAt27() {
  return (
    <section className="navy-wash relative overflow-hidden py-16 text-white lg:py-24">
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
      />
      <Container className="relative grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <Reveal className="flex justify-center lg:justify-start">
          <div className="drift-slow">
            <Image
              src="/media/leading-at-27-book.png"
              alt="Leading at 27 by Seyi Adisa"
              width={1526}
              height={1241}
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 70vw, 100vw"
              className="h-auto w-full max-w-[420px] cursor-default rounded-2xl shadow-[0_32px_70px_-24px_rgba(0,0,0,0.8)]"
            />
          </div>
        </Reveal>

        <Reveal delay={110}>
          <Eyebrow tone="light">The book behind the framework</Eyebrow>
          <h2 className="mt-4 text-[28px] leading-[1.18] font-extrabold tracking-[-0.02em] sm:text-[36px]">
            {leadingAt27.title}
            <span className="mt-2 block text-[17px] font-semibold tracking-normal text-gold-400 sm:text-[19px]">
              {leadingAt27.subtitle}
            </span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.9] text-navy-100/85">
            {leadingAt27.blurb} Written by {leadingAt27.author},
            and presented in {leadingAt27.launched}.
          </p>

          <dl className="mt-8 grid gap-5 border-t border-white/15 pt-6 sm:grid-cols-3">
            {(
              [
                { label: "Author", value: leadingAt27.author },
                { label: "Principles", value: "Character, Influence, Purpose" },
                { label: "Published", value: leadingAt27.launched },
              ] as const
            ).map((item, index) => (
              <div
                key={item.label}
                className="rule-grow rounded-lg p-3 transition-colors duration-300 hover:bg-white/[0.06]"
                style={{ transitionDelay: "0ms" }}
              >
                <dt className="text-[11.5px] font-bold tracking-[0.1em] text-white/60 uppercase">
                  {item.label}
                </dt>
                <dd className="mt-1.5 text-[14px] font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/leading-at-27" size="lg">
              About the book
            </ButtonLink>
            <ButtonLink
              href={leadingAt27.buyUrl}
              external
              variant="navyOutline"
              size="lg"
            >
              Get your copy
            </ButtonLink>
          </div>

          <p className="mt-6 max-w-[560px] text-[13px] leading-[1.8] text-navy-100/70">
            {leadingAt27.buyNote}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
