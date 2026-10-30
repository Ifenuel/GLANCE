"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FootprintChapter, FootprintState, NationalFootprint } from "@/server/footprint";
import { NG_BBOX, ngStateFor } from "./ng-states";

/* Real geographic map of Nigeria, shaded by live member counts. */
const EMPTY_FILL = "#E9EEF4";
const SCALE = ["#DCEEE3", "#A9D6BC", "#63B489", "#2E8A5E", "#0F6A40"];
const SELECTED_FILL = "#0A2550";
const HOVER_FILL = "#EAAE14";

function fillFor(members: number, max: number, mode: "idle" | "hover" | "selected") {
  if (mode === "selected") return SELECTED_FILL;
  if (mode === "hover") return HOVER_FILL;
  if (!members || !max) return EMPTY_FILL;
  const t = members / max;
  if (t <= 0.25) return SCALE[0];
  if (t <= 0.5) return SCALE[1];
  if (t <= 0.75) return SCALE[2];
  if (t <= 0.95) return SCALE[3];
  return SCALE[4];
}

function ChapterRow({ chapter }: { chapter: FootprintChapter }) {
  return (
    <Link
      href={`/portal/chapters/${chapter.id}`}
      className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-navy-50/70"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-bold text-navy-900">
          {chapter.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-ink-500">
          {chapter.code} · {chapter.institution}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="font-data block text-[13px] font-bold text-navy-900">
          {chapter.members}
        </span>
        <span className="block text-[10px] text-ink-400">
          {chapter.members === 1 ? "member" : "members"}
        </span>
      </span>
    </Link>
  );
}

/**
 * The statistics map: real, geographic state polygons of Nigeria fed by the
 * live database. Hover previews, click opens the chapter list for that state
 * on the spot. Keyboard focusable per state for accessibility.
 */
export function NigeriaInteractiveMap({
  data,
  initialSelected,
}: {
  data: NationalFootprint;
  initialSelected?: string | null;
}) {
  const busiest = useMemo(
    () =>
      [...data.states].sort(
        (a, b) => b.members - a.members || b.chapters.length - a.chapters.length,
      )[0],
    [data.states],
  );
  const [selected, setSelected] = useState<string>(
    () =>
      initialSelected ??
      (busiest && busiest.chapters.length > 0 ? busiest.name : "Lagos"),
  );
  const [hovered, setHovered] = useState<string | null>(null);

  const byName = useMemo(() => {
    const map = new Map<string, FootprintState>();
    for (const state of data.states) map.set(state.name, state);
    return map;
  }, [data.states]);

  const maxMembers = Math.max(1, ...data.states.map((state) => state.members));
  const active = byName.get(selected) ?? data.states[0];
  const preview = hovered ? byName.get(hovered) : null;

  const [minX, minY, maxX, maxY] = NG_BBOX;
  const pad = 45;
  const    viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_70px_-60px_rgba(5,37,80,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-[#f3faf5] via-white to-[#f7f9fc] px-5 py-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-[#008751] uppercase">
            National footprint
          </p>
          <h3 className="font-display text-[17px] font-bold tracking-tight text-navy-900">
            GLANCE across Nigeria
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-400">
          <span>Fewer members</span>
          <span className="flex items-center gap-1">
            {SCALE.map((color) => (
              <span
                key={color}
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ background: color }}
              />
            ))}
          </span>
          <span>More</span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Real map */}
        <div className="relative border-b border-line px-4 py-5 lg:border-r lg:border-b-0">
          <svg
            viewBox={viewBox}
            role="group"
            aria-label="Interactive map of Nigeria with one shape per state. Choose a state to see its chapters and members."
            className="mx-auto h-auto w-full max-w-[440px]"
          >
            {/* The Highcharts coordinates are stored y-inverted (Borno at the
                bottom, Bayelsa at the top), so the whole map is mirrored back
                to the true orientation: north at the top, the Gulf of Guinea
                coast at the bottom. */}
            <g transform="scale(1 -1) translate(0 -813.5)">
              {data.states.map((state) => {
                const geometry = ngStateFor(state.name);
                if (!geometry) return null;
                const isSelected = selected === state.name;
                const isHovered = hovered === state.name;
                const mode = isSelected ? "selected" : isHovered ? "hover" : "idle";
                return (
                  <g key={state.name}>
                    <path
                      d={geometry.d}
                      fill={fillFor(state.members, maxMembers, mode)}
                      stroke={isSelected ? "#EAAE14" : isHovered ? "#0B2545" : "#FFFFFF"}
                      strokeWidth={isSelected ? 2.4 : isHovered ? 1.4 : 0.9}
                      className="cursor-pointer outline-none transition-[fill,stroke-width] duration-200 focus-visible:stroke-[#EAAE14]"
                      onClick={() => setSelected(state.name)}
                      onPointerEnter={() => setHovered(state.name)}
                      onPointerLeave={() => setHovered(null)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`${state.name === "FCT" ? "FCT (Abuja)" : state.name}: ${state.chapters.length} ${state.chapters.length === 1 ? "chapter" : "chapters"}, ${state.members} members`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected(state.name);
                        }
                      }}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Hover preview chip */}
          <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-center lg:inset-x-6">
            <span
              key={hovered ?? "none"}
              className="rounded-xl border border-line bg-white/95 px-4 py-2 text-center text-[11.5px] font-semibold text-navy-900 shadow-lg backdrop-blur transition-opacity"
              style={{ opacity: preview ? 1 : 0 }}
            >
              {preview
                ? `${preview.name === "FCT" ? "FCT (Abuja)" : preview.name} — ${preview.chapters.length} ${preview.chapters.length === 1 ? "chapter" : "chapters"}, ${preview.members} ${preview.members === 1 ? "member" : "members"}`
                : ""}
            </span>
          </div>
        </div>

        {/* Details for the chosen state */}
        <div className="flex min-h-[320px] flex-col px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-ink-400 uppercase">
                Selected state
              </p>
              <h4 className="font-display mt-1 text-[22px] font-bold tracking-tight text-navy-900">
                {active?.name === "FCT" ? "FCT (Abuja)" : active?.name}
              </h4>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="font-data text-[20px] leading-none font-bold text-navy-900">
                  {active?.chapters.length ?? 0}
                </p>
                <p className="mt-1 text-[10px] text-ink-400">
                  {active?.chapters.length === 1 ? "chapter" : "chapters"}
                </p>
              </div>
              <div>
                <p className="font-data text-[20px] leading-none font-bold text-navy-900">
                  {active?.members ?? 0}
                </p>
                <p className="mt-1 text-[10px] text-ink-400">
                  {active?.members === 1 ? "member" : "members"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-1 lg:max-h-[290px]">
            {active && active.chapters.length > 0 ? (
              <ul className="divide-y divide-line/70">
                {active.chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <ChapterRow chapter={chapter} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-navy-50/40 px-4 py-8 text-center">
                <p className="text-[13px] font-bold text-navy-900">
                  No chapter in {active?.name === "FCT" ? "the FCT" : active?.name} yet
                </p>
                <p className="mx-auto mt-1 max-w-[260px] text-[12px] leading-relaxed text-ink-500">
                  A state can hold five to ten chapters. This one is the next
                  place to plant the flag.
                </p>
                <Link
                  href={`/portal/chapters/new`}
                  className="mt-3 inline-flex h-9 items-center rounded-lg bg-navy-900 px-4 text-[12px] font-bold text-white transition-colors hover:bg-navy-800"
                >
                  Create a chapter here
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
            <div>
              <p className="font-data text-[17px] font-bold text-navy-900">{data.totals.chapters}</p>
              <p className="text-[10.5px] text-ink-400">Chapters</p>
            </div>
            <div>
              <p className="font-data text-[17px] font-bold text-navy-900">{data.totals.members}</p>
              <p className="text-[10.5px] text-ink-400">Members</p>
            </div>
            <div>
              <p className="font-data text-[17px] font-bold text-navy-900">
                {data.totals.statesCovered}
                <span className="text-[12px] font-semibold text-ink-400">/37</span>
              </p>
              <p className="text-[10.5px] text-ink-400">States live</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
