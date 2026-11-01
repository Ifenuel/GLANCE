"use client";

import { useEffect, useState } from "react";
import {
  loadVoicePrefs,
  saveVoicePrefs,
  type VoicePrefs,
} from "@/components/site/glance-broadcast";

/**
 * The broadcast narrator's tuning, saved on this device and read back by
 * the film's sound engine. The studio recording carries speed and volume;
 * accent and pitch shape the fallback browser voice that speaks when the
 * recording cannot be loaded — so a portal owner who tweaks "accent" on a
 * machine with multiple English voices hears it there.
 */
export function BroadcastVoiceForm() {
  const [prefs, setPrefs] = useState<VoicePrefs>({
    voiceURI: null,
    pitch: 0.94,
    rate: 1,
    volume: 0.92,
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saved, setSaved] = useState(false);

  // Stored device preferences are only readable on the client, so load them
  // one frame after mount (the same settle pattern CountUp uses): the server
  // and the first client frame agree on the defaults, then the stored values
  // appear. Avoids both a hydration mismatch and a cascading render.
  useEffect(() => {
    const settle = requestAnimationFrame(() => setPrefs(loadVoicePrefs()));
    return () => cancelAnimationFrame(settle);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () =>
      setVoices(window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en")));
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  function update(next: Partial<VoicePrefs>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    saveVoicePrefs(merged);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const input =
    "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-navy-900 focus:border-navy-500 focus:outline-none";
  const label = "text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400";

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className={label}>Narrator accent</p>
        <select
          value={prefs.voiceURI ?? ""}
          onChange={(event) => update({ voiceURI: event.target.value || null })}
          className={input}
        >
          <option value="">Automatic — best match for an English-Nigerian read</option>
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11.5px] leading-[1.6] text-ink-400">
          Applies when the studio recording is unavailable, on your device&apos;s
          browser voice.
        </p>
      </div>

      <div>
        <p className={label}>Voice pitch</p>
        <input
          type="range"
          min={0.8}
          max={1.1}
          step={0.02}
          value={prefs.pitch}
          onChange={(event) => update({ pitch: Number(event.target.value) })}
          className="mt-2 w-full accent-navy-700"
          aria-label="Narrator pitch"
        />
        <p className="mt-1 text-[11.5px] text-ink-400">
          {prefs.pitch > 1.03 ? "Brighter" : prefs.pitch < 0.9 ? "Deeper" : "Neutral newsroom"}
        </p>
      </div>

      <div>
        <p className={label}>Narration speed</p>
        <input
          type="range"
          min={0.85}
          max={1.15}
          step={0.01}
          value={prefs.rate}
          onChange={(event) => update({ rate: Number(event.target.value) })}
          className="mt-2 w-full accent-navy-700"
          aria-label="Narration speed"
        />
        <p className="mt-1 text-[11.5px] text-ink-400">
          {prefs.rate < 0.95 ? "Measured, deliberate" : prefs.rate > 1.05 ? "Brisk" : "Natural pace"}
        </p>
      </div>

      <div>
        <p className={label}>Voiceover volume</p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={prefs.volume}
          onChange={(event) => update({ volume: Number(event.target.value) })}
          className="mt-2 w-full accent-navy-700"
          aria-label="Voiceover volume"
        />
        <p className="mt-1 text-[11.5px] text-ink-400">
          {prefs.volume === 0 ? "Silent" : `${Math.round(prefs.volume * 100)}%`}
        </p>
      </div>

      <div className="flex items-end gap-3">
        <button
          type="button"
          onClick={() => {
            const defaults = { voiceURI: null, pitch: 0.94, rate: 1, volume: 0.92 } as VoicePrefs;
            setPrefs(defaults);
            saveVoicePrefs(defaults);
          }}
          className="h-10 rounded-lg border border-line px-4 text-[12px] font-bold text-ink-500 transition-colors hover:border-navy-200 hover:text-navy-900"
        >
          Reset
        </button>
        <p role="status" className="pb-2.5 text-[11.5px] font-semibold text-emerald-700">
          {saved ? "Saved on this device ✓" : "Changes apply instantly."}
        </p>
      </div>
    </div>
  );
}
