"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui";

/** The founder's flagship film, resolved once at publish time. */
const FILM_ID = "7QL_ywcnh7E";
const FILM_URL = `https://www.youtube.com/watch?v=${FILM_ID}`;
const FILM_EMBED = `https://www.youtube-nocookie.com/embed/${FILM_ID}?rel=0&modestbranding=1&iv_load_policy=3`;
/**
 * The real video poster frame, served straight from YouTube's image CDN. The
 * browser only fetches it if it renders, and the click-to-load player starts
 * from the film's own opening shot rather than a blank board.
 */
const FILM_THUMB = `https://i.ytimg.com/vi/${FILM_ID}/hqdefault.jpg`;

/**
 * "The founder's word" — Seyi Adisa's flagship film, embedded straight on
 * the homepage. The player is click-to-load (no iframe until asked, no
 * YouTube tracking before consent) with a link out for sharing, and the
 * resting state shows the film's own poster, never a blank frame.
 */
export function FounderFilm() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="bg-navy-950 py-14 lg:py-20" aria-labelledby="founder-film-heading">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-[11.5px] font-bold tracking-[0.24em] text-gold-400 uppercase">
            Watch
          </p>
          <h2
            id="founder-film-heading"
            className="mt-2 text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]"
          >
            The word of the founder
          </h2>
          <p className="mt-4 max-w-[520px] text-[15px] leading-[1.85] text-white/70">
            Seyi Adisa, author of Leading at 27 and founder of the movement,
            on why young Nigerians must move when the room is against them.
            This is the film that set the tone for GLANCE’s campus sessions.
          </p>
          {/* Three separate calls to action, each on its own row: the YouTube
              link, the book and Instagram are different destinations — they
              must not read as one clustered link row. */}
          <div className="mt-7">
            <a
              href={FILM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="sheen inline-flex h-11 items-center gap-2 rounded-lg bg-white/10 px-5 text-[13px] font-bold text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/15 hover:ring-white/40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#ff0033]" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5z" />
              </svg>
              Watch on YouTube
            </a>
          </div>
          <div className="mt-5 border-t border-white/10 pt-5">
            <Link
              href="/leading-at-27"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-white underline decoration-gold-400/70 decoration-2 underline-offset-[6px] transition-colors hover:text-gold-300"
            >
              Leading at 27 — the book
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M4 1.5 10.5 8 4 14.5 2.4 13l5.2-5-5.2-5z" />
              </svg>
            </Link>
          </div>
          <div className="mt-4">
            <a
              href="https://www.instagram.com/glanceproject/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/70 transition-colors hover:text-gold-300"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              Follow the movement on Instagram
            </a>
          </div>
        </div>

        {/* Cinematic frame: a graded edge highlights the screen, and the
            poster drifts subtly with the scroll like an emerging title card. */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[2rem] border border-gold-400/15 bg-gradient-to-br from-gold-400/10 via-transparent to-navy-600/30"
          />
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-navy-900 shadow-[0_44px_100px_-40px_rgba(0,0,0,0.9)]">
          {loaded ? (
            <iframe
              src={`${FILM_EMBED}&autoplay=1`}
              title="Seyi Adisa — When they don't want you to succeed (GLANCE founder's word)"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="group absolute inset-0 text-center"
              aria-label="Play the founder's film"
            >
              {/* The film's own poster frame, letterboxed safely under the
                  scrim so any crop still reads as the video. */}
              {/* The film's real opening shot as the resting poster. */}
              <Image
                src={FILM_THUMB}
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover transition-transform duration-2000 ease-out group-hover:scale-[1.03]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(120%_100%_at_30%_20%,rgba(6,20,46,0.45),rgba(3,12,28,0.82))]"
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {/* The broadcast's play chip small, gilded and breathing,
                    instead of a flat disc — the same control language the
                    film band uses, so play reads as one system site-wide. */}
                <span className="relative inline-grid place-items-center">
                  <span
                    aria-hidden="true"
                    className="film-pulse absolute h-14 w-14 rounded-full border border-gold-400/40"
                  />
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-navy-950/85 text-white shadow-[0_10px_28px_-8px_rgba(3,12,28,0.9)] backdrop-blur-sm transition-all duration-300 group-hover:border-gold-400/70 group-hover:bg-navy-950 group-hover:text-gold-300">
                    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" aria-hidden="true">
                      <path d="M2 1.2v9.6L10.5 6z" />
                    </svg>
                  </span>
                </span>
                <span className="max-w-[85%] text-[16px] font-extrabold text-white sm:text-[18px]">
                  “When they don’t want you to succeed”
                </span>
                <span className="text-[12px] font-bold tracking-[0.18em] text-gold-300 uppercase">
                  Seyi Adisa · founder’s word
                </span>
              </span>
            </button>
          )}
          </div>
        </div>
      </Container>
    </section>
  );
}
