"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/icons";

export type ProgrammeScene = {
  title: string;
  body: string;
  image: StaticImageData;
  href: string;
};

/**
 * "Our Programmes" as scrollytelling: the desktop left column pins and the
 * photograph + programme index crossfade while the visitor scrolls through
 * each of the four strands on the right; on phones nothing pins — each
 * strand simply carries its own photo, so the story scrolls naturally.
 *
 * Scene switching is an IntersectionObserver, not a scroll handler: change
 * tracking costs nothing while idle. The active-step highlight is purely
 * visual; the text stays visible and accessible whatever the viewport.
 */
export function ProgrammeScrolly({ programmes }: { programmes: ProgrammeScene[] }) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;
    const blocks = Array.from(
      container.querySelectorAll<HTMLElement>("[data-programme-step]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number(entry.target.getAttribute("data-programme-step")));
          }
        }
      },
      // A block counts as "the story now" while its middle band crosses the
      // viewport's centre — the pinned visual sits visually there.
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    blocks.forEach((b) => observer.observe(b));
    return () => observer.disconnect();
  }, [programmes.length]);

  const desktop = (
    <div className="mt-12 hidden gap-16 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      {/* Pinned visual */}
      <div className="relative">
        <div className="sticky top-[16vh] h-[68vh]">
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-line bg-navy-950 shadow-[0_44px_90px_-46px_rgba(5,36,94,0.65)]">
            {programmes.map((programme, index) => (
              <div
                key={programme.title}
                aria-hidden={index !== active}
                className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out ${
                  index === active
                    ? "scale-100 opacity-100"
                    : "scale-[1.05] opacity-0"
                }`}
              >
                <Image
                  src={programme.image}
                  alt={`GLANCE ${programme.title.toLowerCase()}`}
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className={`programme-ken object-cover`}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-transparent to-navy-950/25"
                />
              </div>
            ))}

            {/* Scene index + title */}
            <div className="absolute inset-x-0 bottom-0 p-7">
              <p className="font-data text-[12px] font-bold tracking-[0.3em] text-gold-400">
                {String(active + 1).padStart(2, "0")} ·{" "}
                {String(programmes.length).padStart(2, "0")}
              </p>
              <div key={active} className="scene-title-in">
                <p className="scene-title font-display mt-2 text-[clamp(24px,2.6vw,38px)] leading-tight font-extrabold text-white">
                  {programmes[active]?.title}
                </p>
              </div>
            </div>

            {/* Progress rail */}
            <div className="absolute top-7 right-7 flex flex-col gap-2">
              {programmes.map((programme, index) => (
                <span
                  key={programme.title}
                  aria-hidden="true"
                  className={`h-6 w-0.5 rounded-full transition-colors duration-500 ${
                    index === active ? "bg-gold-400" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling story blocks */}
      <div>
        {programmes.map((programme, index) => (
          <article
            key={programme.title}
            data-programme-step={index}
            className="flex min-h-[72vh] flex-col justify-center py-10"
          >
            <p
              className={`font-data text-[13px] font-bold tracking-[0.3em] transition-colors duration-500 ${
                index === active ? "text-gold-600" : "text-ink-400"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3
              className={`mt-3 text-[clamp(26px,3vw,42px)] leading-[1.08] font-extrabold tracking-[-0.02em] transition-colors duration-500 ${
                index === active ? "text-navy-900" : "text-navy-900/30"
              }`}
            >
              {programme.title}
            </h3>
            <p className="mt-5 max-w-[480px] text-[15px] leading-[1.9] text-ink-500">
              {programme.body}
            </p>
            <Link
              href={programme.href}
              className="mt-6 inline-flex w-fit items-center gap-2 text-[13px] font-bold text-navy-900 transition-all hover:gap-3 hover:text-navy-500"
            >
              Learn more
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );

  const mobile = (
    <div className="mt-10 grid gap-10 lg:hidden">
      {programmes.map((programme, index) => (
        <article key={programme.title} data-programme-step={index}>
          <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-line">
            <Image
              src={programme.image}
              alt={`GLANCE ${programme.title.toLowerCase()}`}
              fill
              sizes="90vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent"
            />
            <p className="font-data absolute bottom-3 left-4 text-[12px] font-bold tracking-[0.3em] text-gold-400">
              {String(index + 1).padStart(2, "0")}
            </p>
          </div>
          <h3 className="mt-4 text-[22px] leading-tight font-extrabold tracking-[-0.01em] text-navy-900">
            {programme.title}
          </h3>
          <p className="mt-2.5 text-[13.5px] leading-[1.8] text-ink-500">
            {programme.body}
          </p>
          <Link
            href={programme.href}
            className="mt-3.5 inline-flex items-center gap-2 text-[13px] font-bold text-navy-900"
          >
            Learn more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </article>
      ))}
    </div>
  );

  return <div ref={rootRef}>{desktop}{mobile}</div>;
}
