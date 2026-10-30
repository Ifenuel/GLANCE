import type { Metadata } from "next";
import { EmbedPlayer } from "@/components/site/embed-player";
import { PageHeader } from "@/components/site/page-header";
import { pageBackgrounds } from "@/lib/page-backgrounds";
import { Container, EmptyState, Section, SectionHeading } from "@/components/ui";
import { videoEmbedSrc } from "@/lib/video-embed";
import { listPublishedMedia } from "@/server/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs and films from GLANCE campus activations, chapter sessions and GLANCE convenings.",
};

export default async function GalleryPage() {
  const media = await listPublishedMedia();
  const videos = media.filter((item) => item.kind === "VIDEO");
  const photos = media.filter((item) => item.kind === "IMAGE");

  /* Films and reels live in their own sections, as separate calls to action:
     the YouTube films keep their grid, and Instagram reels — with the
     "Open on Instagram" link standing on its own beneath the card — are
     presented separately so neither link is fused into the other. */
  const films = videos.filter((item) => {
    const embed = videoEmbedSrc(item);
    return embed ? !/instagram/i.test(embed) : false;
  });
  const reelLinks = videos.filter((item) => {
    const embed = videoEmbedSrc(item);
    return embed ? /instagram/i.test(embed) : true;
  });

  return (
    <>
      <PageHeader
        background={pageBackgrounds.gallery.image}
        backgroundAlt={pageBackgrounds.gallery.alt}
        eyebrow="Gallery"
        title="The movement, in pictures and film"
        intro={
          <p>
            Moments from campus activations, chapter sessions and GLANCE
            convenings, published by the GLANCE secretariat.
          </p>
        }
      />

      <Section>
        <Container>
          {media.length === 0 ? (
            <EmptyState
              title="Nothing published yet"
              description="Photos and films added by the GLANCE team will appear here."
            />
          ) : (
            <div className="space-y-16">
              {films.length > 0 ? (
                <div>
                  <SectionHeading
                    eyebrow="Watch"
                    title="Films from the network"
                    className="mb-8"
                  />
                  <div data-stagger="" className="grid gap-6 lg:grid-cols-2">
                    {films.map((item) => {
                      const embed = videoEmbedSrc(item);
                      const ytId = embed
                        ? /youtube-nocookie\.com\/embed\/([\w-]+)/.exec(embed)?.[1]
                        : null;
                      return (
                        <figure
                          key={item.id}
                          className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_60px_-45px_rgba(5,42,92,0.5)]"
                        >
                          {embed ? (
                            /* Click-to-load: the embed mounts only on the
                               visitor's tap, so nothing plays until asked —
                               especially the Instagram reel, which otherwise
                               starts by itself the moment the page renders. */
                            <EmbedPlayer
                              src={embed}
                              playSrc={
                                // The tap is the gesture; autoplay then plays
                                // exactly one video — the one they chose.
                                /youtube/i.test(embed)
                                  ? `${embed}&autoplay=1`
                                  : undefined
                              }
                              title={item.title}
                              posterUrl={
                                ytId
                                  ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
                                  : undefined
                              }
                            />
                          ) : (
                            /* Not embeddable — offer the original platform
                               as an explicit link instead of an iframe. */
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-navy-900 via-navy-800 to-violet-900 px-6 text-center text-white transition-opacity hover:opacity-95"
                            >
                              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-6 w-6 fill-white"
                                  aria-hidden="true"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </span>
                              <span className="text-[15px] font-extrabold">
                                {item.title}
                              </span>
                              <span className="text-[12px] text-white/75">
                                Opens on the original platform
                              </span>
                            </a>
                          )}
                          <figcaption className="p-5">
                            <p className="text-[14.5px] font-extrabold text-navy-900">
                              {item.title}
                            </p>
                            {item.caption ? (
                              <p className="mt-1.5 text-[12.5px] leading-[1.75] text-ink-500">
                                {item.caption}
                              </p>
                            ) : null}
                            {/* The book stands on its own below the film — a
                               separate underlined link, never fused into the
                               video or the YouTube cluster above it. */}
                            <div className="mt-4 border-t border-line pt-3">
                              <a
                                href="/leading-at-27"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-navy-800 underline decoration-gold-400 decoration-2 underline-offset-4 transition-colors hover:text-gold-600"
                              >
                                Leading at 27 — the book
                              </a>
                            </div>
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {reelLinks.length > 0 ? (
                <div>
                  <SectionHeading
                    eyebrow="On our socials"
                    title="The reel on Instagram"
                    className="mb-8"
                  />
                  {/* The reel sits in a two-panel arrangement: the portrait
                     card on one side, its story and link beside it — so no
                     single slab owns the whole row on a desktop screen. */}
                  <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center">
                    {reelLinks.map((item) => {
                      const embed = videoEmbedSrc(item);
                      return (
                        <figure
                          key={item.id}
                          className="w-full max-w-[340px] shrink-0 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_60px_-45px_rgba(5,42,92,0.5)]"
                        >
                          {embed ? (
                            /* Click-to-load, same as the film above: the reel
                               must never start by itself on page render. */
                            <EmbedPlayer
                              src={embed}
                              playSrc={embed}
                              social="instagram"
                              title={item.title}
                              aspect="portrait"
                            />
                          ) : (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-navy-900 via-navy-800 to-violet-900 px-6 text-center text-white transition-opacity hover:opacity-95"
                            >
                              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-6 w-6 fill-white"
                                  aria-hidden="true"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </span>
                              <span className="text-[15px] font-extrabold">
                                {item.title}
                              </span>
                              <span className="text-[12px] text-white/75">
                                Opens on the original platform
                              </span>
                            </a>
                          )}
                        </figure>
                      );
                    })}
                    {reelLinks.map((item) => (
                      <div key={item.id ?? "caption"} className="sm:max-w-[300px]">
                        <p className="text-[18px] font-extrabold tracking-tight text-navy-900">
                          {item.title}
                        </p>
                        {item.caption ? (
                          <p className="mt-2 text-[13px] leading-[1.75] text-ink-500">
                            {item.caption}
                          </p>
                        ) : (
                          <p className="mt-2 text-[13px] leading-[1.75] text-ink-500">
                            Highlights straight from the GLANCE Instagram feed.
                          </p>
                        )}
                        {/* The Instagram link stands on its own: a separate
                           row with its own glyph, never merged with the
                           playing reel or the film above. */}
                        <div className="mt-5 border-t border-line pt-4">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-navy-800 underline decoration-gold-400 decoration-2 underline-offset-4 transition-colors hover:text-gold-600"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4 shrink-0"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.5 1 .4.4.7.9.9 1.5.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-.9-1.5-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1 0-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1 0 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2 0 1.6.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1 0-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm5.2-2.1a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                            </svg>
                            Open on Instagram
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {photos.length > 0 ? (
                <div>
                  <SectionHeading
                    eyebrow="Moments"
                    title="From our campuses"
                    className="mb-8"
                  />
                  <div data-stagger="" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {photos.map((item) => (
                      <figure
                        key={item.id}
                        className="hover-zoom group overflow-hidden rounded-xl border border-line bg-white"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-navy-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                        <figcaption className="p-4">
                          <p className="text-[13px] font-bold text-navy-900">
                            {item.title}
                          </p>
                          {item.caption ? (
                            <p className="mt-1 text-[12px] leading-[1.7] text-ink-500">
                              {item.caption}
                            </p>
                          ) : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
