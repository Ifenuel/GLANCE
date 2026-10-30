"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { NG_LITE_BBOX, NG_LITE_STATES } from "@/lib/ng-map-lite";

import audienceClap from "@/assets/audience-clap.jpg";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import hallConversation from "@/assets/hall-conversation.jpg";
import heroCrowd from "@/assets/hero-crowd.jpg";
import leadingBook from "@/assets/leading-at-27-book.jpg";
import mediaInterview from "@/assets/media-interview.jpg";
import stageGroup from "@/assets/stage-group.jpg";
import studentNotes from "@/assets/student-notes.jpg";

export type BroadcastStats = {
  chapters: number;
  members: number;
  institutions: number;
  states: number;
};

const DURATION = 40;

const SCENES = [
  { id: "signal", from: 0, to: 5.4 },
  { id: "manifesto", from: 5.4, to: 12.0 },
  { id: "nameplate", from: 12.0, to: 18.6 },
  { id: "work", from: 18.6, to: 26.4 },
  { id: "numbers", from: 26.4, to: 33.4 },
  { id: "footprint", from: 33.4, to: 38.6 },
  { id: "outro", from: 38.6, to: 40 },
] as const;

type SceneId = (typeof SCENES)[number]["id"];

/** Narration, scene-synced: every line fits its scene's cut. */
const NARRATION: Record<SceneId, string> = {
  signal: "GLANCE. Look around you. See what needs to change.",
  manifesto:
    "Nigeria's next generation is not waiting for permission. It is organising — campus by campus.",
  nameplate:
    "Governance. Leadership. And National Civic Engagement. Four letters, one movement.",
  work: "Thirty weeks of character, mentorship and public service, in chapters run by students, for students.",
  numbers:
    "Thousands of young leaders across campuses, chapters and institutions — and every one of them multiplies.",
  footprint: "From Lagos to Maiduguri, chapter by chapter, the map keeps growing.",
  outro: "GLANCE. Join the movement.",
};

function sceneAt(t: number): SceneId | null {
  for (const scene of SCENES) {
    if (t >= scene.from && t < scene.to) return scene.id;
  }
  return null;
}

function timecode(t: number): string {
  const total = Math.floor(t);
  const frames = Math.floor((t - total) * 25);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  const ff = String(frames).padStart(2, "0");
  return `${mm}:${ss}:${ff}`;
}

/* ── Sound engine: a soft synthesized score + scene narration ─────────
 * Everything is generated in the browser (WebAudio + SpeechSynthesis), so
 * there is no audio download and no licensing question. The ambient bed is
 * a warm two-oscillator pad; a soft tick marks each scene change; the
 * narration is spoken by the browser's English voice. */
let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let padRunning = false;
let padVoices: Array<OscillatorNode> = [];

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx ??= new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function startAmbient() {
  const ctx = ensureAudioCtx();
  if (!ctx || padRunning) return;
  master ??= ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.032, ctx.currentTime + 2.2);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 520;
  lowpass.Q.value = 0.6;
  lowpass.connect(master);

  // A: root, breathing slowly via tremolo.
  const oscA = ctx.createOscillator();
  oscA.type = "sine";
  oscA.frequency.value = 110;
  const gainA = ctx.createGain();
  gainA.gain.value = 0.5;
  const trem = ctx.createOscillator();
  trem.type = "sine";
  trem.frequency.value = 0.07;
  const tremGain = ctx.createGain();
  tremGain.gain.value = 0.26;
  trem.connect(tremGain).connect(gainA.gain);

  const oscB = ctx.createOscillator();
  oscB.type = "sine";
  oscB.frequency.value = 165.2;
  const gainB = ctx.createGain();
  gainB.gain.value = 0.3;

  const oscC = ctx.createOscillator();
  oscC.type = "triangle";
  oscC.frequency.value = 220.5;
  const gainC = ctx.createGain();
  gainC.gain.value = 0.12;

  oscA.connect(gainA).connect(lowpass);
  oscB.connect(gainB).connect(lowpass);
  oscC.connect(gainC).connect(lowpass);
  oscA.start();
  oscB.start();
  oscC.start();
  trem.start();
  // Remember the pad voices so stopAmbient can fully tear them down and the
  // next replay builds a fresh, audible pad instead of early-returning on a
  // stale padRunning flag.
  padVoices = [oscA, oscB, oscC, trem];
  padRunning = true;
  startAnthem();
}

function duckAmbient(ducked: boolean) {
  if (!master || !audioCtx) return;
  // The pad is atmosphere; the anthem and the narration carry the film, so
  // the bed keeps to about a third of the anthem's level and backs off
  // further while a narrator is speaking.
  const target = ducked ? 0.012 : 0.032;
  master.gain.cancelScheduledValues(audioCtx.currentTime);
  master.gain.linearRampToValueAtTime(target, audioCtx.currentTime + 0.4);
}

function stopAmbient() {
  if (!master || !audioCtx) return;
  master.gain.cancelScheduledValues(audioCtx.currentTime);
  master.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
  const stopAt = audioCtx.currentTime + 0.9;
  master.gain.setValueAtTime(0.0001, stopAt);
  for (const voice of padVoices.splice(0)) {
    try {
      voice.stop(stopAt);
    } catch {
      // Voice not started yet; nothing to stop.
    }
  }
  padRunning = false;
  stopAnthem();
}

/* The anthem bed: a softly hummed instrumental read of "Nigeria, we hail
   thee" — the restored 2024 national anthem — playing behind the narration,
   never over it. The tune below is the real melody, transcribed note-for-note
   (with its exact dotted rhythm) from the soprano line of the public-domain
   Wikimedia Commons MIDI of the anthem: the whole first verse, from
   "Nigeria, we hail thee" to the final held "Motherland". At the Maestoso
   quarter kept here (0.8s) the verse runs about 39 seconds and resolves on
   the tonic right as the 40-second film ends. gap = beats until the next
   note's onset; len = how long the note itself is held (both in quarter
   beats). */
type AnthemNote = { f: number; gap: number; len: number };
const ANTHEM_MELODY: AnthemNote[] = [
  // "Ni-ge-ri-a, we hail thee,"
  { f: 293.66, gap: 0, len: 0.83 }, // Ni     (D4)
  { f: 392.0, gap: 1, len: 1.33 }, //   ge    (G4, dotted)
  { f: 293.66, gap: 1.5, len: 0.49 }, // ri   (D4)
  { f: 246.94, gap: 0.5, len: 0.83 }, // a    (B3)
  { f: 261.63, gap: 1, len: 0.83 }, //   we   (C4)
  { f: 293.66, gap: 1, len: 1.75 }, //   hail thee (D4, held)
  // "Our-own dear na-tive land,"
  { f: 293.66, gap: 2, len: 0.83 }, //   Our (D4)
  { f: 293.66, gap: 1, len: 0.83 }, //   own  (D4)
  { f: 392.0, gap: 1, len: 0.83 }, //   dear (G4)
  { f: 293.66, gap: 1, len: 0.83 }, //   na   (D4)
  { f: 392.0, gap: 1, len: 0.83 }, //   tive (G4)
  { f: 493.88, gap: 1, len: 0.83 }, //   B4
  { f: 587.33, gap: 1, len: 2.75 }, //   land (D5, held)
  // "Though tribe and tongue may dif-fer,"
  { f: 587.33, gap: 3, len: 0.83 }, //   Though  (D5)
  { f: 523.25, gap: 1, len: 0.83 }, //   tribe  (C5)
  { f: 493.88, gap: 1, len: 0.83 }, //   and    (B4)
  { f: 440.0, gap: 1, len: 0.83 }, //   tongue (A4)
  { f: 523.25, gap: 1, len: 0.83 }, //   may    (C5)
  { f: 493.88, gap: 1, len: 0.83 }, //   dif    (B4)
  { f: 440.0, gap: 1, len: 0.83 }, //   fer    (A4)
  { f: 392.0, gap: 1, len: 0.83 }, //        (G4 pass)
  { f: 493.88, gap: 1, len: 0.83 }, //   B4
  { f: 440.0, gap: 1, len: 0.83 }, //   A4
  { f: 369.99, gap: 1, len: 0.83 }, //   F#4
  { f: 369.99, gap: 1, len: 0.83 }, //   F#4
  { f: 329.63, gap: 1, len: 0.83 }, //   E4
  { f: 293.66, gap: 1, len: 2.75 }, //   D4 held
  // "Our sovereign Mo-ther-land." — the verse closes on the do, held.
  { f: 293.66, gap: 3, len: 0.83 }, //      (D4)
  { f: 587.33, gap: 1, len: 1.33 }, //      (D5, dotted)
  { f: 523.25, gap: 1.5, len: 0.49 }, //    (C5)
  { f: 493.88, gap: 0.5, len: 0.83 }, //    (B4)
  { f: 587.33, gap: 1, len: 0.83 }, //      (D5)
  { f: 523.25, gap: 1, len: 0.83 }, //      (C5)
  { f: 493.88, gap: 1, len: 0.83 }, //      (B4)
  { f: 440.0, gap: 1, len: 1.33 }, //      (A4, dotted)
  { f: 523.25, gap: 1.5, len: 0.49 }, //    (C5)
  { f: 493.88, gap: 0.5, len: 0.83 }, //    (B4)
  { f: 392.0, gap: 1, len: 0.83 }, //      (G4)
  { f: 392.0, gap: 1, len: 0.83 }, //      (G4)
  { f: 440.0, gap: 1, len: 0.83 }, //      (A4)
  { f: 392.0, gap: 1, len: 2.75 }, //      (G4, final do, held)
];

const ANTHEM_BEAT = 0.8; // Maestoso quarter as heard in the film, in seconds
const ANTHEM_LEVEL = 0.14; // audible behind the narration, never over it
const ANTHEM_DUCKED_LEVEL = 0.05; // while narration plays, the anthem backs off

let anthemGain: GainNode | null = null;
let anthemRunning = false;

function anthemBell(frequency: number, at: number, beats: number) {
  const ctx = audioCtx;
  if (!ctx || !anthemGain) return;
  const dur = beats * ANTHEM_BEAT;
  const voice = ctx.createOscillator();
  voice.type = "sine";
  voice.frequency.value = frequency;
  const octave = ctx.createOscillator();
  octave.type = "sine";
  octave.frequency.value = frequency * 2;
  const octaveGain = ctx.createGain();
  octaveGain.gain.value = 0.16;
  const bell = ctx.createGain();
  // Slow dignified swell in, long decay out — a hummed choir line, not a beep.
  bell.gain.setValueAtTime(0.0001, at);
  bell.gain.linearRampToValueAtTime(1, at + 0.28);
  bell.gain.setValueAtTime(1, at + Math.max(0.3, dur - 0.5));
  bell.gain.linearRampToValueAtTime(0.0001, at + dur);
  voice.connect(bell);
  octave.connect(octaveGain).connect(bell);
  bell.connect(anthemGain);
  voice.start(at);
  octave.start(at);
  voice.stop(at + dur + 0.1);
  octave.stop(at + dur + 0.1);
}

function startAnthem() {
  const ctx = ensureAudioCtx();
  if (!ctx || !master || anthemRunning) return;
  anthemRunning = true;
  anthemGain ??= ctx.createGain();
  // The anthem speaks straight to the speakers, deliberately soft so the
  // narration always carries over it, but loud enough to actually be heard.
  anthemGain.gain.value = ANTHEM_LEVEL;
  anthemGain.connect(ctx.destination);
  // The whole verse is scheduled against one start point, so no timer can
  // bend the rhythm: each note lands exactly on its beat, and drifting
  // setTimeout chains — which also broke replays by never resetting the
  // melody position — are gone entirely.
  const t0 = ctx.currentTime + 0.5; // one beat of breath after the pad rises
  // Each note's gap is measured from the PREVIOUS note's onset (that is how
  // the transcription was taken), so the accumulation belongs BEFORE the
  // note it positions — scheduling first and advancing afterwards collapsed
  // every phrase into the first beat.
  let at = t0;
  for (let i = 0; i < ANTHEM_MELODY.length; i++) {
    const note = ANTHEM_MELODY[i];
    if (i > 0) at += note.gap * ANTHEM_BEAT;
    anthemBell(note.f, at, note.len);
  }
}

function duckAnthem(ducked: boolean) {
  if (!anthemGain || !audioCtx) return;
  anthemGain.gain.cancelScheduledValues(audioCtx.currentTime);
  anthemGain.gain.linearRampToValueAtTime(
    ducked ? ANTHEM_DUCKED_LEVEL : ANTHEM_LEVEL,
    audioCtx.currentTime + 0.4,
  );
}

/** The duck used by play/pause/restart: backs off the whole bed — pad and
 *  anthem together — during narration pauses. */
function duckScore(ducked: boolean) {
  duckAmbient(ducked);
  duckAnthem(ducked);
}

function stopAnthem() {
  anthemRunning = false;
  if (anthemGain && audioCtx) {
    const node = anthemGain;
    node.gain.cancelScheduledValues(audioCtx.currentTime);
    node.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
    window.setTimeout(() => {
      try {
        node.disconnect();
      } catch {
        // Already torn down with the page; nothing to clean up.
      }
    }, 900);
    anthemGain = null;
  }
}

function softTick() {
  const ctx = ensureAudioCtx();
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(198, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.09, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
  osc.connect(gain).connect(master);
  osc.start();
  osc.stop(ctx.currentTime + 0.7);
}

/**
 * Voice selection for a Nigerian-English narrator — clear standard English,
 * never pidgin. Browsers expose different voices per machine, so the match
 * runs from the specific to the general: an en-NG voice if the OS has one,
 * then other African/Nigerian-adjacent English variants, then RP (en-gb,
 * closest cadence), then any English. Voice names are matched too because
 * Windows labels its local voices by name, not always by lang.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const lang = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  const name = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  return (
    voices.find((v) => lang(v).startsWith("en-ng")) ??
    voices.find((v) => name(v).includes("nigeria")) ??
    voices.find((v) =>
      ["gh", "ke", "za", "zw", "ug", "tz"].some((suffix) => lang(v).startsWith(`en-${suffix}`)),
    ) ??
    voices.find((v) => name(v).match(/ghana|kenya|africa/)) ??
    voices.find((v) => lang(v).startsWith("en-gb") && name(v).match(/uk english female|libby|sonia|maisie/)) ??
    voices.find((v) => lang(v).startsWith("en-gb")) ??
    voices.find((v) => lang(v).startsWith("en")) ??
    voices[0]
  );
}

function speak(line: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  // Chrome drops an utterance that starts in the same tick as cancel(); a
  // short async gap keeps every narration line audible.
  window.speechSynthesis.cancel();
  const speech = window.setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(line);
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.rate = 1;
    // A touch lower than the default gives the line the darker timbre and
    // even cadence of a Nigerian newsreader without changing the words.
    utter.pitch = 0.94;
    utter.volume = 0.92;
    window.speechSynthesis.speak(utter);
  }, 60);
  speakTimers.push(speech);
}

/** Pending utterance timers, so a cancel also erases queued speech. */
const speakTimers: number[] = [];

function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    for (const timer of speakTimers.splice(0)) window.clearTimeout(timer);
  }
}

/* ── Shared helpers ───────────────────────────────────────────────
 */

function useCountUp(target: number, duration = 4200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Wrapper that guarantees its children become fully visible: if the
 *  entrance animations never advance (throttled tabs, embedded/preview
 *  canvases), the scene would otherwise stay stuck at its hidden keyframe
 *  while the clock runs on. Mounted once per element it guards — a fresh
 *  instance per scene — and reveals everything ~1.4s in, after the fades
 *  would normally finish, so a healthy browser shows no seam. */
function Settle({ className, children }: { className?: string; children: ReactNode }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);
  return <div className={`${className ?? ""} ${settled ? "bc-settled" : ""}`}>{children}</div>;
}

/** One documentary still with a slow Ken-Burns push and a gold label chip. */
function Still({
  src,
  alt,
  label,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  label?: string;
  className?: string;
}) {
  return (
    <figure className={`bc-still relative h-full w-full overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes="900px" className="object-cover bc-ken" />
      {label ? (
        <figcaption className="bc-still-label absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-navy-950/80 py-1.5 pr-3.5 pl-2 backdrop-blur">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          <span className="bc-caption font-bold tracking-[0.14em] text-white/90 uppercase">
            {label}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}

/* ── Scene 1 — the signal flickers in ────────────────────────────────── */

function SignalScene() {
  const letters = ["G", "L", "A", "N", "C", "E"];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-navy-950">
      <div className="bc-scan absolute inset-0" aria-hidden="true" />
      <div className="relative flex items-baseline">
        {letters.map((letter, i) => (
          <span
            key={letter}
            className="bc-flicker bc-letter font-display font-extrabold tracking-[0.06em]"
            style={{ animationDelay: `${i * 0.28}s` }}
          >
            <span className={i % 2 === 0 ? "text-gold-400" : "text-white"}>{letter}</span>
          </span>
        ))}
      </div>
      <div className="bc-fade-up overflow-hidden px-6 text-center" style={{ animationDelay: "2.4s" }}>
        <p className="bc-kicker font-bold tracking-[0.34em] text-gold-300/90 uppercase">
          Governance · Leadership · National Civic Engagement
        </p>
      </div>
      <div
        className="bc-grow h-px w-48 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
        style={{ animationDelay: "3s" }}
        aria-hidden="true"
      />
    </div>
  );
}

/* ── Scene 2 — the manifesto over a drifting photograph ──────────────── */

function ManifestoScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-950">
      <div className="absolute inset-0 opacity-70">
        <Image src={heroCrowd} alt="" fill sizes="100vw" className="object-cover bc-ken-slow" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_30%_20%,rgba(6,20,46,0.55),rgba(3,12,28,0.95))]" />
      <div
        className="bc-drift absolute -right-24 top-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative h-full w-full">
        <div className="bc-slide-left absolute right-0 bottom-0 hidden h-[46%] w-[44%] overflow-hidden rounded-tl-2xl border-t border-l border-gold-400/30 sm:block">
          <Still src={stageGroup} alt="GLANCE members together on stage" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-center px-[7%]">
          <p className="bc-fade-up bc-kicker font-bold tracking-[0.3em] text-gold-400 uppercase">
            The premise
          </p>
          <h3
            className="bc-fade-up bc-head mt-5 font-extrabold text-white"
            style={{ animationDelay: "0.4s" }}
          >
            Nigeria&apos;s next generation of leaders is{" "}
            <span className="bc-shine bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
              not waiting for permission.
            </span>
          </h3>
          <p
            className="bc-fade-up bc-copy mt-4 max-w-[88%] text-white/80 sm:max-w-[60%]"
            style={{ animationDelay: "1.1s" }}
          >
            They are organising — campus by campus, community by community —
            and they needed a structure to do it well.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Scene 3 — the name, unpacked ────────────────────────────────────── */

const NAME_ROWS = [
  {
    letter: "G",
    word: "Governance",
    line: "Young citizens who understand power — and hold it to account.",
  },
  {
    letter: "L",
    word: "Leadership",
    line: "Captains, mentors and chapter executives grown from the ranks.",
  },
  {
    letter: "A",
    word: "And",
    line: "One thread binding the letters into a single movement.",
  },
  {
    letter: "NCE",
    word: "National Civic Engagement",
    line: "Campuses across Nigeria wired into one civic network.",
  },
];

function NameplateScene() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[3.5%] bg-navy-950 px-[7%] py-[5%]">
      <p className="bc-fade-up bc-kicker font-bold tracking-[0.3em] text-gold-400 uppercase">
        G.L.A.N.C.E — four ideas, one name
      </p>
      {NAME_ROWS.map((row, i) => (
        <div
          key={row.letter}
          className="bc-bar-in relative flex items-center gap-4 border-l-2 border-gold-400/70 pl-4"
          style={{ animationDelay: `${0.35 * i + 0.35}s` }}
        >
          <span
            className="bc-pop bc-name-letter font-display shrink-0 text-gold-400 font-extrabold"
            style={{ animationDelay: `${0.35 * i + 0.5}s` }}
          >
            {row.letter}
          </span>
          <span className="min-w-0">
            <span className="bc-word block font-extrabold tracking-tight text-white">
              {row.word}
            </span>
            <span className="bc-copy block text-white/70">{row.line}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Scene 4 — the work, in documentary stills ───────────────────────── */

const WORK_STILLS: { src: StaticImageData; alt: string; label: string }[] = [
  { src: chapterLecture, alt: "A GLANCE campus chapter in session", label: "Campus chapter sessions" },
  { src: studentNotes, alt: "Members taking notes during a civic training", label: "The 30-week programme" },
  { src: leadingBook, alt: "Copies of Leading at 27 on display", label: "Leading at 27" },
  { src: mediaInterview, alt: "The founder in conversation with the media", label: "The founder on air" },
  { src: hallConversation, alt: "Conversations in the hall after a session", label: "Rooms that stay talking" },
  { src: audienceClap, alt: "The audience applauding a chapter event", label: "Young Nigerians who show up" },
];

function WorkScene() {
  return (
    <div className="absolute inset-0 bg-navy-950 px-[5%] py-[5.5%]">
      <div className="flex h-full flex-col">
        <p className="bc-fade-up bc-kicker font-bold tracking-[0.3em] text-gold-400 uppercase">
          Inside the movement
        </p>
        <div className="mt-[2.5%] grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2 sm:grid-cols-3 sm:grid-rows-2 lg:gap-4">
          {WORK_STILLS.map((still, i) => (
            <div
              key={still.label}
              className="bc-wipe-pop h-full min-h-0 overflow-hidden rounded-xl border border-white/10"
              style={{ animationDelay: `${i * 0.85}s` }}
            >
              <Still src={still.src} alt={still.alt} label={still.label} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Scene 5 — the record ────────────────────────────────────────────── */

function NumbersScene({ stats }: { stats: BroadcastStats }) {
  const chapters = useCountUp(stats.chapters);
  const members = useCountUp(stats.members);
  const institutions = useCountUp(stats.institutions);
  const states = useCountUp(stats.states);
  const goal = useCountUp(10000, 5200);

  const small = [
    { label: "Chapters", value: chapters },
    { label: "Members", value: members },
    { label: "Institutions", value: institutions },
    { label: "States reached", value: states },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950 px-[6%] text-center">
      <p className="bc-fade-up bc-kicker font-bold tracking-[0.3em] text-gold-400 uppercase">
        The record
      </p>
      <div className="bc-pop mt-2" style={{ animationDelay: "0.3s" }}>
        <p className="bc-num font-display leading-none font-extrabold text-white">
          {goal.toLocaleString()}
        </p>
        <p className="bc-copy mt-1 font-semibold text-white/85">
          young leaders the movement is equipping —{" "}
          <span className="text-gold-400">each one multiplying others</span>
        </p>
      </div>
      <div className="mt-[4%] grid w-full max-w-[680px] grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {small.map((item, i) => (
          <div
            key={item.label}
            className="bc-fade-up"
            style={{ animationDelay: `${1 + i * 0.25}s` }}
          >
            <p className="stat-num font-data leading-none font-extrabold text-gold-400">
              {item.value.toLocaleString()}
            </p>
            <p className="bc-kicker mt-1 font-bold tracking-[0.12em] text-white/65 uppercase">
              {item.label}
            </p>
            <span
              className="bc-grow mx-auto mt-1.5 block h-0.5 w-10 bg-gold-400/60"
              style={{ animationDelay: `${1.2 + i * 0.25}s` }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Scene 6 — the footprint across Nigeria ──────────────────────────── */

/* Showcase states for gold pulses + labels (real geography via ng-map-lite). */
const SHOWCASE: { label: string; aliases?: string[] }[] = [
  { label: "Lagos" },
  { label: "Oyo" },
  { label: "Abuja", aliases: ["Federal Capital Territory"] },
  { label: "Kano" },
  { label: "Enugu" },
  { label: "Maiduguri", aliases: ["Borno"] },
  { label: "Rivers" },
  { label: "Kaduna" },
];

type ShowcaseState = { label: string; cx: number; cy: number };

function findStateCents(names: string[]): Map<string, { cx: number; cy: number }> {
  const result = new Map<string, { cx: number; cy: number }>();
  for (const name of names) {
    const state = NG_LITE_STATES.find((s) => s.n === name || s.a === name);
    if (!state) continue;
    let sx = 0;
    let sy = 0;
    let count = 0;
    const re = /([-\d.]+),([-\d.]+)/g;
    for (const m of state.d.matchAll(re)) {
      sx += parseFloat(m[1]);
      sy += parseFloat(m[2]);
      count += 1;
    }
    if (count > 0) result.set(name, { cx: sx / count, cy: sy / count });
  }
  return result;
}

/** Memoised once per module: bbox centres of the showcased states. */
const SHOWCASE_MAP: ShowcaseState[] = (() => {
  const labels = SHOWCASE.map((entry) => ({
    label: entry.label,
    names: [entry.label, ...(entry.aliases ?? [])],
  }));
  const cents = findStateCents(labels.flatMap((l) => l.names));
  const out: ShowcaseState[] = [];
  for (const entry of labels) {
    for (const name of entry.names) {
      const cent = cents.get(name);
      if (cent) {
        out.push({ label: entry.label, cx: cent.cx, cy: cent.cy });
        break;
      }
    }
  }
  return out;
})();

/** Hot triangles of the real map: the showcased state shapes pulse gold. */
const HOT_STATES = new Set(
  SHOWCASE.flatMap((entry) =>
    NG_LITE_STATES.filter((s) => s.n === entry.label || (entry.aliases ?? []).includes(s.n)).map((s) => s.n),
  ),
);

function FootprintScene({ stats }: { stats: BroadcastStats }) {
  const [minX, minY, maxX, maxY] = NG_LITE_BBOX;
  const pad = 26;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  return (
    <div className="absolute inset-0 flex items-center bg-navy-950">
      {/* The map: one real state shape per path, y-inverted back upright.
          On phones the column is width-capped so the aspect-ratio SVG can
          never crowd the copy off the stage. */}
      <div
        className="bc-fade-up relative h-full w-[40%] shrink-0 sm:w-[38%]"
        style={{ animationDelay: "0.2s" }}
      >
        <svg viewBox={viewBox} className="bc-map h-full" aria-hidden="true">
          <g transform="scale(1 -1) translate(0 -813.5)">
            {NG_LITE_STATES.map((state) => (
              <path
                key={state.n}
                d={state.d}
                fill={
                  HOT_STATES.has(state.n)
                    ? "rgba(251,191,36,0.16)"
                    : "rgba(13,42,87,0.92)"
                }
                stroke="rgba(251,191,36,0.42)"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            ))}
            {SHOWCASE_MAP.map((spot, i) => (
              <g
                key={spot.label}
                className="bc-pop"
                style={{ animationDelay: `${0.8 + i * 0.22}s`, transformOrigin: `${spot.cx}px ${spot.cy}px` }}
              >
                <circle
                  cx={spot.cx}
                  cy={spot.cy}
                  r="9"
                  fill="rgba(251,191,36,0.85)"
                  className="bc-ping"
                  style={{
                    animationDelay: `${1 + i * 0.22}s`,
                    transformOrigin: `${spot.cx}px ${spot.cy}px`,
                  }}
                />
                <circle cx={spot.cx} cy={spot.cy} r="4.6" fill="#fbbf24" />
              </g>
            ))}
          </g>
          {/* Labels live outside the y-flip so text reads upright. */}
          {SHOWCASE_MAP.map((spot) => (
            <text
              key={spot.label}
              x={spot.cx}
              y={813.5 - spot.cy - 13}
              textAnchor="middle"
              className="bc-map-label"
              fill="#fde68a"
              fontSize="17"
              fontWeight="700"
              style={{ letterSpacing: "1px" }}
            >
              {spot.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="min-w-0 flex-1 px-[5%]">
        <p
          className="bc-fade-up bc-kicker font-bold tracking-[0.3em] text-gold-400 uppercase"
          style={{ animationDelay: "0.5s" }}
        >
          The footprint
        </p>
        <h3
          className="bc-fade-up bc-head mt-2 font-extrabold text-white"
          style={{ animationDelay: "0.9s" }}
        >
          From Lagos to Maiduguri,{" "}
          <span className="text-gold-400">chapter by chapter.</span>
        </h3>
        <p
          className="bc-fade-up bc-copy mt-3 text-white/75"
          style={{ animationDelay: "1.5s" }}
        >
          Every chapter stands in one of the 36 states and the FCT.{" "}
          {stats.states > 0
            ? `${stats.states} state${stats.states === 1 ? "" : "s"} are live — and the map keeps growing.`
            : "The map keeps growing."}
        </p>
      </div>
    </div>
  );
}

/* ── Scene 7 — the closing card ──────────────────────────────────────── */

function OutroScene({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-navy-950 px-6">
      <div
        className="bc-drift absolute left-[8%] top-[12%] h-40 w-40 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="bc-drift absolute right-[10%] bottom-[15%] h-52 w-52 rounded-full bg-gold-400/10 blur-3xl"
        aria-hidden="true"
        style={{ animationDelay: "-3s" }}
      />
      <h3 className="bc-fade-up bc-head max-w-[86%] text-center font-extrabold text-white">
        GLANCE — <span className="text-gold-400">look around, rally, act.</span>
      </h3>
      {compact ? null : (
        <p className="bc-fade-up bc-copy max-w-[70%] text-center text-white/70" style={{ animationDelay: "0.4s" }}>
          Join a campus chapter, start one, or partner with the movement.
        </p>
      )}
      <div className="bc-fade-up flex flex-wrap justify-center gap-3" style={{ animationDelay: compact ? "0.4s" : "0.8s" }}>
        <Link
          href="/join"
          className="sheen inline-flex h-11 items-center rounded-lg bg-gold-400 px-6 text-[13px] font-bold text-navy-950 transition-colors hover:bg-gold-300"
        >
          Join GLANCE
        </Link>
        <Link
          href="/chapters"
          className="inline-flex h-11 items-center rounded-lg border border-white/25 bg-white/5 px-6 text-[13px] font-bold text-white backdrop-blur transition-colors hover:border-white/50 hover:bg-white/10"
        >
          Explore chapters
        </Link>
      </div>
    </div>
  );
}

/* ── The player ──────────────────────────────────────────────────────── */

export function GlanceBroadcast({
  stats,
  mode = "standalone",
  onDone,
}: {
  stats: BroadcastStats;
  /** "standalone": poster first, tap to play. "intro": the opening moment —
   *  autoplays muted (a browser gesture is needed for audio) with a sound
   *  unlock button, and calls onDone when the studio light fades out. */
  mode?: "standalone" | "intro";
  onDone?: () => void;
}) {
  const intro = mode === "intro";
  const [state, setState] = useState<"idle" | "playing" | "paused" | "done">(
    intro ? "idle" : "idle",
  );
  const [t, setT] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const spokenRef = useRef<SceneId | null>(null);

  const activeScene = state === "idle" || state === "done" ? null : sceneAt(t);

  const intervalRef = useRef(0);

  /** Stop both clock drivers. Safe to call repeatedly. */
  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearInterval(intervalRef.current);
  }, []);

  /** One frame: advance the clock, and end the film at the last frame. */
  const advance = useCallback(() => {
    const next = (performance.now() - startRef.current) / 1000;
    if (next >= DURATION) {
      stopLoop();
      setT(DURATION);
      setState("done");
      return;
    }
    setT(next);
  }, [stopLoop]);

  /** Drive the clock by rAF when the tab paints, plus a steady interval
   *  watchdog so the film also runs in tab types where rAF never fires
   *  (embedded/preview canvases). Both call advance(); it dedupes. */
  const startLoop = useCallback(() => {
    stopLoop();
    const frame = () => {
      rafRef.current = requestAnimationFrame(frame);
      advance();
    };
    rafRef.current = requestAnimationFrame(frame);
    intervalRef.current = window.setInterval(advance, 90);
  }, [advance, stopLoop]);

  useEffect(() => {
    if (state !== "playing") return undefined;
    // The watchdog keeps time even when the tab is throttled or does not
    // paint (startLoop's rAF is the smooth path; this interval is the floor).
    const id = window.setInterval(advance, 220);
    return () => window.clearInterval(id);
  }, [state, advance]);

  const stopSound = useCallback(() => {
    stopSpeaking();
    stopAmbient();
  }, []);

  const setSound = useCallback((on: boolean) => {
    setSoundOn(on);
    if (on) {
      startAmbient();
    } else {
      stopSound();
    }
  }, [stopSound]);

  const play = useCallback(() => {
    startRef.current = performance.now() - t * 1000;
    setState("playing");
    spokenRef.current = null;
    startLoop();
    duckScore(false);
    if (soundOn) startAmbient();
  }, [startLoop, t, soundOn]);

  const pause = useCallback(() => {
    stopLoop();
    setState("paused");
    stopSpeaking();
    duckScore(true);
  }, [stopLoop]);

  const restart = useCallback(() => {
    setT(0);
    startRef.current = performance.now();
    spokenRef.current = null;
    setState("playing");
    startLoop();
    duckScore(false);
    if (soundOn) startAmbient();
  }, [startLoop, soundOn]);

  const seek = useCallback(
    (fraction: number) => {
      const clamped = Math.min(0.999, Math.max(0, fraction));
      const nextT = clamped * DURATION;
      startRef.current = performance.now() - nextT * 1000;
      setT(nextT);
      spokenRef.current = null;
      if (state === "done") setState("paused");
    },
    [state],
  );

  useEffect(() => {
    stopLoop();
  }, [stopLoop]);

  /* Narration + scene tick: whenever the active scene changes while
     playing — including at the very first frame — speak its line. */
  useEffect(() => {
    if (state !== "playing" || !activeScene) return;
    if (spokenRef.current === activeScene) return;
    spokenRef.current = activeScene;
    if (!soundOn) return;
    stopSpeaking();
    speak(NARRATION[activeScene]);
    softTick();
  }, [activeScene, state, soundOn]);

  /* Intro autoplay: the opening moment starts by itself, muted, because a
     gesture is required before any audio — the sound button unlocks it.
     The first frame is scheduled through rAF so the state update does not
     cascade synchronously out of the effect body. */
  const startedRef = useRef(false);
  useEffect(() => {
    if (!intro || state !== "idle" || startedRef.current) return;
    startedRef.current = true;
    // setTimeout rather than rAF: some embedded canvases never fire rAF, and
    // the opening moment must not hang on it.
    const timer = window.setTimeout(() => play(), 16);
    return () => window.clearTimeout(timer);
  }, [intro, state, play]);

  /* Sound unlock gesture inside the intro: turn audio on mid-flight and
     speak the line of the scene we are currently in. */
  const unlockSound = useCallback(() => {
    setSound(true);
    startRef.current = performance.now() - t * 1000;
    spokenRef.current = null;
  }, [setSound, t]);

  /* Both modes — intro embedded and standalone on the homepage — must fall
     silent the moment the film reaches its end: the narration has stopped
     speaking and the score (pad + anthem) fades out with it. Previously the
     stop was wired only for the intro, which is why the standalone player
     kept playing after the last words. */
  useEffect(() => {
    if (state !== "done") return;
    stopSpeaking();
    stopAmbient();
  }, [state]);

  /* Leaving the film mid-play — navigating to another page, the intro's
     parent dismissing it, a hot reload — must fall silent too. Without
     this, the WebAudio score and the speech queue outlived the component
     and drifted over whatever came next: from the visitor's side the
     broadcast's sound simply refused to stop. */
  useEffect(
    () => () => {
      stopLoop();
      stopSpeaking();
      stopAmbient();
    },
    [stopLoop],
  );

  /* Report the intro's natural end so the site reveals the page. */
  const reportedDone = useRef(false);
  useEffect(() => {
    if (!intro || state !== "done" || reportedDone.current) return;
    reportedDone.current = true;
    const finish = window.setTimeout(() => onDone?.(), 750);
    return () => window.clearTimeout(finish);
  }, [intro, state, onDone]);

  const overlay = state === "idle" || state === "done";

  const player = (
    <div
      className={`glance-broadcast ${state === "paused" ? "bc-frozen" : ""} ${intro ? "glance-broadcast--intro" : ""}`}
    >
      <style>{CSS}</style>

      <div
        className="bc-stage relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-navy-950 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]"
        role="img"
        aria-label="GLANCE broadcast: a 40-second motion account of the movement, with optional narration."
      >
        {/* Stage: the active scene crossfades in as its own layer. The
            Settle wrapper remounts per scene (key) and guarantees the
            scene content shows even when animations never advance. */}
        <Settle className="bc-scene absolute inset-0" key={activeScene ?? "none"}>
          {activeScene === "signal" ? <SignalScene /> : null}
          {activeScene === "manifesto" ? <ManifestoScene /> : null}
          {activeScene === "nameplate" ? <NameplateScene /> : null}
          {activeScene === "work" ? <WorkScene /> : null}
          {activeScene === "numbers" ? <NumbersScene stats={stats} /> : null}
          {activeScene === "footprint" ? <FootprintScene stats={stats} /> : null}
          {activeScene === "outro" ? <OutroScene compact={intro} /> : null}
        </Settle>

        {/* Broadcast chrome */}
        {!overlay ? (
          <>
            <div className="bc-chip pointer-events-none absolute top-3 left-4 z-20 flex items-center gap-2 rounded-full bg-navy-950/70 py-1 pr-3 pl-2 backdrop-blur">
              <span aria-hidden="true" className="bc-blink h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="bc-chip-text font-bold tracking-[0.22em] text-white/80 uppercase">
                GLANCE Broadcast
              </span>
            </div>
            <div className="bc-chip pointer-events-none absolute top-3 right-4 z-20 rounded-full bg-navy-950/70 px-3 py-1 backdrop-blur">
              <span className="bc-timecode font-data font-semibold tracking-[0.14em] text-gold-300">
                {timecode(t)}
              </span>
            </div>

            {/* Click-to-pause surface */}
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={state === "paused" ? "Resume the GLANCE broadcast" : "Pause the GLANCE broadcast"}
              onClick={() => (state === "paused" ? play() : pause())}
            />

            {/* Progress rail: click or arrow-key to scrub any scene */}
            <div className="absolute right-0 bottom-0 left-0 z-20 h-8 bg-gradient-to-t from-navy-950/85 to-transparent">
              <div
                role="slider"
                tabIndex={0}
                aria-label="Seek in the broadcast"
                aria-valuemin={0}
                aria-valuemax={DURATION}
                aria-valuenow={Math.round(t)}
                aria-valuetext={`${Math.round(t)} seconds of ${DURATION}`}
                className="absolute top-1/2 right-4 left-4 h-4 -translate-y-1/2 cursor-pointer"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  seek((event.clientX - rect.left) / rect.width);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    seek((t + (event.key === "ArrowRight" ? 1 : -1)) / DURATION);
                  }
                }}
              >
                <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gold-400"
                    style={{ width: `${(t / DURATION) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Pause badge. pointer-events-none is essential: it covers the
                whole stage above the resume surface, so without it the badge
                itself would swallow the tap that should resume playback.
                Anchored top-centre (the chips are hidden on phones) so it
                never collides with the sound pill or the progress rail. */}
            {state === "paused" ? (
              <div className="pointer-events-none absolute inset-0 z-[15] flex items-start justify-center bg-navy-950/55 pt-[14%] backdrop-blur-[2px]">
                <span className="bc-pop inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-navy-950/90 px-5 py-2.5 text-[11.5px] font-bold tracking-[0.18em] text-gold-300 uppercase">
                  <svg viewBox="0 0 12 12" className="h-3 w-3 translate-x-[1px]" fill="currentColor" aria-hidden="true">
                    <path d="M2 1.2v9.6L10.5 6z" />
                  </svg>
                  Paused — tap anywhere to continue
                </span>
              </div>
            ) : null}
          </>
        ) : (
          /* Poster / replay overlay (standalone mode only; the intro
             autoplays, so it lives on the stage). */
          <Settle className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 overflow-hidden bg-navy-950 px-4 sm:gap-5 sm:px-0">
            <div className="absolute inset-0 opacity-40">
              <Image src={audienceClap} alt="" fill sizes="100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(90%_90%_at_50%_40%,rgba(3,12,28,0.55),rgba(3,12,28,0.95))]" />
            <p className="bc-fade-up relative font-bold tracking-[0.3em] text-gold-400 uppercase">
              {state === "done" ? "Thanks for watching" : "GLANCE presents"}
            </p>
            <div className="bc-fade-up relative px-6" style={{ animationDelay: "0.15s" }}>
              <p className="font-display text-[clamp(28px,5.4vw,58px)] leading-none font-extrabold tracking-[0.02em] text-white">
                Look around. Rally. Act.
              </p>
            </div>
            <p
              className="bc-fade-up relative hidden max-w-[480px] px-6 text-center text-[clamp(11px,1.6vw,14.5px)] leading-relaxed text-white/70 sm:block"
              style={{ animationDelay: "0.3s" }}
            >
              A short film about the movement — chapters, mentorship and real
              civic work, told by the people in the room.
            </p>
            <button
              type="button"
              onClick={() => (state === "done" ? restart() : play())}
              className="sheen bc-fade-up relative mt-2 inline-flex h-14 shrink-0 items-center gap-3 rounded-full bg-gold-400 px-8 text-[14px] font-bold text-navy-950 shadow-[0_18px_40px_-14px_rgba(251,202,75,0.55)] transition-transform hover:scale-[1.03]"
              style={{ animationDelay: "0.45s" }}
            >
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center rounded-full bg-navy-950 text-gold-400 transition-transform group-hover:scale-110"
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3 translate-x-[1px]" fill="currentColor">
                  <path d="M2 1.2v9.6L10.5 6z" />
                </svg>
              </span>
              {state === "done" ? "Watch again" : "Play the film"}
            </button>
          </Settle>
        )}

        {/* Sound toggle — the narration and score unlock with one tap. */}
        {!overlay || intro ? (
          <button
            type="button"
            title={soundOn ? "Turn sound off" : "Turn sound on (narration + score)"}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
            onClick={() => (soundOn ? setSound(false) : unlockSound())}
            className="absolute top-3 right-4 bottom-auto z-30 flex h-9 items-center gap-2 rounded-full border border-white/20 bg-navy-950/85 px-3 backdrop-blur transition-colors hover:border-gold-400/60 sm:top-auto sm:bottom-11 sm:left-4 sm:right-auto sm:h-10 sm:px-4"
          >
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${soundOn ? "bg-gold-400" : "bg-white/40"}`} />
            {/* On phones the pill is icon-only and docks at the top-right —
                the chips hide there anyway, and a wide pill at the bottom
                covered the scene copy. From sm it keeps its labelled pill. */}
            <span className="bc-chip-text hidden text-[10.5px] font-bold tracking-[0.18em] text-white/85 uppercase sm:inline">
              {soundOn ? "Sound on" : "Sound on — tap"}
            </span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-gold-400" aria-hidden="true">
              {soundOn ? (
                <path d="M3 10v4h4l5 4V6L7 10H3z M16.5 12a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z M14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
              ) : (
                <path d="M3 10v4h4l5 4V6L7 10H3z M19.8 8.4l-1.4 1.4 1.8 1.8-1.8 1.8 1.4 1.4 1.8-1.8 1.8 1.8 1.4-1.4-1.8-1.8 1.8-1.8-1.4-1.4-1.8 1.8z" />
              )}
            </svg>
          </button>
        ) : null}
      </div>

      {intro ? null : (
        <p className="mt-3 text-center text-[11px] font-semibold tracking-[0.16em] text-white/45 uppercase">
          A GLANCE film · best with sound · tap the frame to pause
        </p>
      )}
    </div>
  );

  /* In intro mode the player is shown full-viewport as the site's opening
     moment; standalone it simply sits in its section. */
  if (!intro) return player;

  return (
    <div className="intro-broadcast fixed inset-0 z-[9999] flex items-center justify-center bg-navy-950 p-3 sm:p-6">
      {/* Gold breath behind the stage */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="drift-slow absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.10)_0%,transparent_70%)] blur-3xl" />
      </div>
      <div className="w-full" style={{ maxWidth: "min(100%, calc(100dvh * 16 / 9))" }}>
        {player}
      </div>
      <button
        type="button"
        onClick={() => {
          stopSpeaking();
          stopAmbient();
          onDone?.();
        }}
        className="absolute top-4 right-4 z-40 rounded-full border border-white/25 bg-navy-950/85 px-5 py-2.5 text-[12px] font-bold tracking-[0.16em] text-white/85 uppercase backdrop-blur transition-colors hover:border-gold-400/70 hover:text-gold-300"
      >
        Skip intro
      </button>
      <div className="intro-broadcast__ traveller hidden sm:block" aria-hidden="true" />
    </div>
  );
}

/* ── Scoped animation styles ─────────────────────────────────────────── */

const CSS = `
.glance-broadcast .bc-fade-up { opacity: 0; animation: bcFadeUp .8s cubic-bezier(.22,.9,.3,1) forwards; }
.glance-broadcast .bc-pop { opacity: 0; animation: bcPop .7s cubic-bezier(.3,1.5,.45,1) forwards; }
.glance-broadcast .bc-flicker { opacity: 0; animation: bcFlicker .5s steps(3, end) forwards; }
.glance-broadcast .bc-grow { transform: scaleX(0); transform-origin: left; animation: bcGrow ease-out forwards; }
.glance-broadcast .bc-bar-in { opacity: 0; animation: bcBarIn .55s cubic-bezier(.22,.9,.3,1) forwards; }
.glance-broadcast .bc-wipe-pop { opacity: 0; animation: bcWipePop .6s cubic-bezier(.22,.9,.3,1) forwards; }
.glance-broadcast .bc-slide-left { opacity: 0; animation: bcSlideLeft .8s cubic-bezier(.22,.9,.3,1) forwards .5s; }
.glance-broadcast .bc-ping { animation: bcPing 2.4s ease-out infinite; }
.glance-broadcast .bc-blink { animation: bcBlink 1.1s steps(2, start) infinite; }
.glance-broadcast .bc-scene { animation: bcSceneIn .55s ease-out both; }

.glance-broadcast .bc-ken { animation: bcKen 11s ease-in-out infinite alternate; }
.glance-broadcast .bc-ken-slow { animation: bcKen 26s ease-in-out infinite alternate; }
.glance-broadcast .bc-drift { animation: bcDrift 9s ease-in-out infinite alternate; }
.glance-broadcast .bc-scan {
  background-image: repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.045) 3px 4px);
  animation: bcScan 4s linear infinite;
}
.glance-broadcast .bc-shine {
  background-size: 220% 100%;
  animation: bcShine 3.4s ease-in-out infinite;
}
.glance-broadcast .bc-frozen * { animation-play-state: paused !important; }

/* Settle: if entrance animations never advanced (throttled tab), reveal
   the content outright. Targets only the entrance classes — ambient motion
   (bc-ken, bc-ping, bc-blink, bc-drift, bc-scan, bc-shine) keeps running. */
.glance-broadcast .bc-scene.bc-settled,
.glance-broadcast .bc-settled .bc-fade-up,
.glance-broadcast .bc-settled .bc-pop,
.glance-broadcast .bc-settled .bc-flicker,
.glance-broadcast .bc-settled .bc-grow,
.glance-broadcast .bc-settled .bc-bar-in,
.glance-broadcast .bc-settled .bc-wipe-pop,
.glance-broadcast .bc-settled .bc-slide-left {
  opacity: 1 !important;
  animation: none !important;
  transform: none !important;
  clip-path: none !important;
}

/* Typography clamp: the stage copy stays legible on phones, where the
   viewport-based vw terms would otherwise collapse the sizes used on the
   desktop stage. */
.glance-broadcast .bc-letter { font-size: clamp(34px, 8vw, 96px); }
.glance-broadcast .bc-name-letter { font-size: clamp(20px, 4vw, 48px); }
.glance-broadcast .bc-kicker { font-size: clamp(10.5px, 1.35vw, 14px); }
.glance-broadcast .bc-copy { font-size: clamp(13px, 1.42vw, 15px); line-height: 1.7; }
.glance-broadcast .bc-head { font-size: clamp(21px, 3.3vw, 44px); line-height: 1.14; }
.glance-broadcast .bc-word { font-size: clamp(15px, 2.5vw, 30px); }
.glance-broadcast .bc-num { font-size: clamp(48px, 11vw, 140px); }
.glance-broadcast .stat-num { font-size: clamp(20px, 3vw, 34px); }
.glance-broadcast .bc-caption { font-size: 10px; }
.glance-broadcast .bc-still { min-height: 96px; }
.glance-broadcast .bc-map-label { display: block; font-family: var(--font-display); }

@media (max-width: 640px) {
  .glance-broadcast .bc-chip { display: none; }
  .glance-broadcast .bc-stage { border-radius: 1rem; }
  .glance-broadcast .bc-letter { font-size: clamp(30px, 9vw, 56px); }
  .glance-broadcast .bc-kicker { font-size: 10px; letter-spacing: 0.18em; }
  .glance-broadcast .bc-copy { font-size: 12.5px; line-height: 1.6; }
  .glance-broadcast .bc-head { font-size: clamp(19px, 5.6vw, 27px); line-height: 1.2; }
  .glance-broadcast .bc-word { font-size: 15px; }
  .glance-broadcast .bc-num { font-size: clamp(44px, 15vw, 82px); }
  .glance-broadcast .stat-num { font-size: clamp(18px, 5.2vw, 26px); }
  .glance-broadcast .bc-caption { display: none; }
  .glance-broadcast .bc-map-label { display: none; }
  .glance-broadcast .bc-still { min-height: 74px; border-radius: 0.6rem; }
  .glance-broadcast .bc-map-label { font-size: 21px; }
  .glance-broadcast .bc-name-letter { font-size: 24px; }
}

.intro-broadcast {
  animation: introIn .5s ease-out both;
}

@keyframes introIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bcSceneIn { from { opacity: 0; transform: scale(1.012); } to { opacity: 1; transform: none; } }
@keyframes bcFadeUp { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
@keyframes bcPop { 0% { opacity: 0; transform: scale(.72); } 60% { transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
@keyframes bcFlicker { 0% { opacity: 0; } 20% { opacity: .55; } 35% { opacity: 0; } 55% { opacity: .8; } 70% { opacity: 0; } 100% { opacity: 1; } }
@keyframes bcGrow { to { transform: scaleX(1); } }
@keyframes bcBarIn { from { opacity: 0; transform: translateX(-14%); } to { opacity: 1; transform: none; } }
@keyframes bcWipePop { from { opacity: 0; transform: translateY(18px) scale(.96); clip-path: inset(0 100% 0 0); } to { opacity: 1; transform: none; clip-path: inset(0 0 0 0); } }
@keyframes bcSlideLeft { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: none; } }
@keyframes bcPing { 0%, 100% { opacity: .35; transform: scale(1); } 50% { opacity: .05; transform: scale(1.5); } }
@keyframes bcBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes bcKen { from { transform: scale(1.02); } to { transform: scale(1.14); } }
@keyframes bcDrift { from { transform: translate(0, 0); } to { transform: translate(-18px, 22px); } }
@keyframes bcScan { from { transform: translateY(-40px); } to { transform: translateY(40px); } }
@keyframes bcShine { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

@media (prefers-reduced-motion: reduce) {
  .glance-broadcast *, .glance-broadcast *::before, .glance-broadcast *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
  .intro-broadcast { display: none; }
}
`;
