"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import chapterAudience from "@/assets/chapter-audience.jpg";
import chapterCheer from "@/assets/chapter-cheer.jpg";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import pathwayInfluence from "@/assets/pathway-influence.jpg";
import { ButtonLink } from "@/components/button-link";
import { ArrowRight } from "@/components/icons";
import { KineticHeading, MaskReveal, prefersReducedMotion } from "@/components/site/motion";
import { Container } from "@/components/ui";

const programmes = [
  {
    title: "Leadership Development",
    body: "Structured sessions that build character and credible leadership, from campus to community.",
    image: chapterLecture,
    alt: "A GLANCE leadership session in progress on campus",
  },
  {
    title: "Civic Engagement",
    body: "Members learn how governance actually works, then practise engaging with it.",
    image: chapterAudience,
    alt: "GLANCE members at a civic engagement session",
  },
  {
    title: "Mentorship",
    body: "Guidance rooted in the Leading at 27 principles — Character, Influence, Purpose.",
    image: pathwayInfluence,
    alt: "A mentor guiding GLANCE members through the pathway",
  },
  {
    title: "Community Projects",
    body: "Every pathway ends with members committing skills to a real public need.",
    image: chapterCheer,
    alt: "GLANCE members celebrating a completed community project",
  },
];

/**
 * "Our Programmes" — directed as a showreel rather than a curtain of cards.
 * On desktop the stage pins while the visitor scrolls the four strands past
 * it; each step's photograph dissolves into the frame and the copy answers
 * it. On phones the film keeps its scenes: each scene is a masked photograph
 * revealing itself with its own caption. The links and copy are unchanged.
 */
export function Programmes() {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const stepsRef = useRef<HTMLDivElement>(null);

  // The scrolling scene column drives the pinned stage: whichever step sits
  // closest to the viewport's middle becomes the frame on the left. A single
  // IntersectionObserver — no scroll math, no per-frame listeners, and it
  // stays correct as the visitor scrolls back up.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const steps = stepsRef.current?.querySelectorAll("[data-programme-step]");
    if (!steps || steps.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const midway = window.innerHeight / 2;
        const entry = visible.reduce(
          (best, current) => {
            const centre = (node: Element) => {
              const r = node.getBoundingClientRect();
              return r.top + r.height / 2;
            };
            return Math.abs(centre(current.target) - midway) <
              Math.abs(centre(best.target) - midway)
              ? current
              : best;
          },
          visible[0],
        );
        const next = Number((entry.target as HTMLElement).dataset.programmeStep);
        if (Number.isInteger(next) && next !== activeRef.current) {
          activeRef.current = next;
          setActive(next);
        }
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0.15 },
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="programmes" className="bg-navy-50/50 py-16 lg:py-24">
      <Container>
        <div className="max-w-[720px]">
          <p className="text-[11.5px] font-bold tracking-[0.24em] text-gold-400 uppercase">
            Our Programmes
          </p>
          <KineticHeading
            as="h2"
            text="We provide young leaders with real skills,"
            className="mt-3"
          />
          <KineticHeading
            as="p"
            text="real opportunities and real responsibility."
            className="text-[clamp(22px,3.2vw,34px)] leading-[1.18] font-extrabold tracking-[-0.02em] text-navy-500"
            delay={0.12}
          />
          <p className="mt-4 text-[14px] leading-[1.85] text-ink-500">
            Chapters deliver a structured programme: leadership formation,
            civic learning, mentorship and community projects, over 30 weeks on
            each campus.
          </p>
        </div>

        {/* ---- Desktop showreel: pinned stage, scrolling scenes ---- */}
        <div className="mt-12 hidden gap-12 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="lg:sticky lg:top-[12vh] lg:h-[72vh] lg:self-start">
            <div className="relative h-full overflow-hidden rounded-3xl border border-navy-800/30 bg-navy-950 shadow-[0_60px_120px_-60px_rgba(5,36,94,0.8)]">
              {programmes.map((programme, index) => (
                <div
                  key={programme.title}
                  aria-hidden={index !== active}
                  className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out ${
                    index === active ? "opacity-100 scale-100" : "opacity-0 scale-[1.05]"
                  }`}
                >
                  <Image
                    src={programme.image}
                    alt={programme.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_20%_100%,rgba(5,36,94,0.35),rgba(3,16,38,0.72))]"></div>
                  <div className="absolute inset-x-0 bottom-0 p-8">
                    <p className="text-[11px] font-bold tracking-[0.24em] text-gold-300 uppercase">
                      {`0${index + 1} — ${programme.title.toUpperCase()}`}
                    </p>
                  </div>
                </div>
              ))}

              {/* Gold hairline progress across the pinned stage's bottom. */}
              <div className="absolute inset-x-8 top-8 h-px w-auto bg-white/15">
                <span
                  className="block h-full origin-left bg-gradient-to-r from-gold-400 to-gold-300"
                  style={{
                    transform: `scaleX(${(active + 1) / programmes.length})`,
                    transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
            </div>
          </div>

          <div ref={stepsRef} className="h-fit">
            {programmes.map((programme, index) => (
              <article
                key={programme.title}
                data-programme-step={index}
                className="flex min-h-[45vh] flex-col justify-center border-l-2 py-10 pr-2 pl-8 transition-colors duration-500 first:border-t-0"
                style={{ borderColor: index === active ? "var(--color-gold-400)" : "rgb(0 12 30 / 0.08)" }}
              >
                <p
                  className="font-data text-[11px] font-bold tracking-[0.3em] transition-colors duration-500"
                  style={{ color: index === active ? "var(--color-gold-400)" : "rgb(10 30 60 / 0.25)" }}
                >
                  {`0${index + 1}`}
                </p>
                <h3 className="mt-3 text-[24px] leading-snug font-extrabold tracking-[-0.02em] text-navy-900">
                  {programme.title}
                </h3>
                <p className="mt-3 max-w-[380px] text-[14px] leading-[1.85] text-ink-500">
                  {programme.body}
                </p>
                <Link
                  href="/about"
                  className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold text-navy-900 transition-all group-hover:gap-3 group-hover:text-navy-500"
                >
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* ---- Mobile: the film's scenes stacked, each mask-revealed ---- */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:hidden">
          {programmes.map((programme) => (
            <MaskReveal key={programme.title}>
              <article className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="relative aspect-16/11">
                  <Image
                    src={programme.image}
                    alt={programme.alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-gold-400 to-gold-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-[15.5px] leading-snug font-extrabold text-navy-900">
                    {programme.title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-[1.75] text-ink-500">
                    {programme.body}
                  </p>
                  <Link
                    href="/about"
                    className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-bold text-navy-900"
                  >
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            </MaskReveal>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white px-6 py-5">
          <p className="text-[13.5px] leading-[1.8] text-ink-600">
            Delivered through peer-led campus clubs, guided by the{" "}
            <strong className="font-semibold text-navy-900">Leading at 27</strong>{" "}
            framework.
          </p>
          <ButtonLink href="/leading-at-27" variant="outline" size="sm">
            About the framework
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
