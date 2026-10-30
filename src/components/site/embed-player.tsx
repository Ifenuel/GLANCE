"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Click-to-load wrapper for third-party video embeds (YouTube films, Instagram
 * reels). The embed iframe does not exist until a visitor taps the poster, so
 * nothing plays — not even a muted autoplay — while they are just moving
 * around the website. The founder film on the homepage follows the same
 * pattern, and this is the gallery's version of it.
 *
 * `playSrc` is the URL loaded on activation. When it is a YouTube embed the
 * `autoplay=1` flag is expected to be part of it: the tap that mounts the
 * iframe is the visitor's own gesture, so it is legitimate — and it is the only
 * path to playback, unlike the live iframe, which played on page load.
 */
export function EmbedPlayer({
  src,
  playSrc,
  title,
  posterUrl,
  label,
  social,
  aspect = "video",
}: {
  /** Embed URL shown on the resting poster (not matched until asked for). */
  src: string;
  /** Embed URL used when the visitor taps play. YouTube items pass a copy
   *  with `autoplay=1`; other providers leave it out. */
  playSrc?: string;
  title: string;
  /** Optional poster image (the YouTube film's own real opening frame). */
  posterUrl?: string;
  /** Visible label when there is no poster image to show. */
  label?: string;
  /** Branded resting card instead of blank navy. Instagram reels get the
   *  Instagram gradient + glyph so the card reads as real content. */
  social?: "instagram";
  /** Frame ratio — reels are portrait, films are 16:9. */
  aspect?: "video" | "portrait";
}) {
  const [loaded, setLoaded] = useState(false);

  const frame = aspect === "portrait" ? "aspect-4/5" : "aspect-video";

  /** On portrait frames the iframe unfits the rectangle — Instagram embeds
   *  letterbox themselves, so centring beats stretching. */
  const frameFit = aspect === "portrait" ? "flex items-center justify-center" : "";

  return (
    <div className={`relative w-full overflow-hidden bg-navy-950 ${frame}`}>
      {loaded ? (
        <iframe
          src={playSrc ?? src}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className={`absolute inset-0 h-full w-full ${frameFit}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="group absolute inset-0 text-center"
          aria-label={`Play ${title.toLowerCase()}`}
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          ) : null}
          <span
            aria-hidden="true"
            className={
              social === "instagram"
                ? "absolute inset-0 bg-[radial-gradient(140%_120%_at_15%_0%,#fcaf45_0%,#f77737_25%,#dd2a7b_55%,#8134af_82%,#515bd4_100%)]"
                : posterUrl
                  ? "absolute inset-0 bg-[radial-gradient(120%_100%_at_30%_20%,rgba(6,20,46,0.45),rgba(3,12,28,0.82))]"
                  : "absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-violet-900"
            }
          />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
            {social === "instagram" ? (
              /* Instagram camera glyph — the card announces itself as an
                 Instagram reel instead of a blank gradient block. */
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 fill-white/95"
                aria-hidden="true"
              >
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.5 1 .4.4.7.9.9 1.5.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-.9-1.5-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1 0-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1 0 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2 0 1.6.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1 0-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm5.2-2.1a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-110">
                <svg
                  viewBox="0 0 12 12"
                  className="h-4 w-4 translate-x-[1px]"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M2 1.2v9.6L10.5 6z" />
                </svg>
              </span>
            )}
            <span className="max-w-[85%] text-[15px] font-extrabold text-white">
              {label ?? title}
            </span>
            <span className="text-[11.5px] font-bold tracking-[0.18em] text-white/70 uppercase">
              Tap to play
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
