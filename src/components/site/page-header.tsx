"use client";

import type { ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import { KineticHeading, Parallax } from "@/components/site/motion";
import { Container } from "@/components/ui";

/**
 * The page-opening hero, directed like every film's establishing shot:
 * the headline rises line by line out of its own masks, a photographic
 * background (when supplied) breathes on parallax, and the gold seam draws
 * itself as the visitor settles into the page. The copy and props are the
 * same as before — the delivery is now part of the site's motion language.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  actions,
  aside,
  /** Optional photographic background behind the deep-navy wash. */
  background,
  backgroundAlt,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  background?: StaticImageData;
  backgroundAlt?: string;
}) {
  return (
    <section className="navy-wash relative overflow-hidden text-white">
      {background ? (
        <div aria-hidden="true" className="absolute inset-0">
          <Parallax
            range={8}
            mobileRange={5}
            scaleTo={1.02}
            scaleFrom={1.16}
            className="absolute inset-x-0 -inset-y-[8%]"
          >
            <Image
              src={background}
              alt={backgroundAlt ?? ""}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </Parallax>
          {/* Scrims keep the navy character but let the photo breathe. */}
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,24,53,0.95)_0%,rgba(6,24,53,0.86)_42%,rgba(6,24,53,0.58)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_10%,transparent_40%,rgba(6,24,53,0.75)_100%)]" />
        </div>
      ) : null}
      {/* Glow behind the headline block. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.10)_0%,transparent_70%)] blur-3xl"
      />

      <Container className="relative grid gap-10 pb-14 pt-16 sm:pt-20 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center lg:pb-20 lg:pt-24">
        <div className="page-header-reveal">
          <p className="kicker">{eyebrow}</p>
          <KineticHeading
            as="h1"
            text={title}
            className="display-cinematic mt-5 max-w-[760px] text-[clamp(34px,4.8vw,58px)]"
            delay={0.1}
          />
          <div
            aria-hidden="true"
            className="mt-6 h-px w-24 bg-gradient-to-r from-gold-400 via-gold-400/40 to-transparent"
          />
          {intro ? (
            <div className="mt-6 max-w-[640px] space-y-4 text-[15px] leading-[1.85] text-white/75">
              {intro}
            </div>
          ) : null}
          {actions ? (
            <div className="mt-9 flex flex-wrap gap-3">{actions}</div>
          ) : null}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </Container>

      {/* Seam into the page body. */}
      <div
        aria-hidden="true"
        className="relative h-px w-full bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
      />
    </section>
  );
}
