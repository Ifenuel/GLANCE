"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NIGERIA_STATES } from "@/lib/nigeria-states";
import type { FootprintChapter, FootprintState, NationalFootprint } from "@/server/footprint";

const WIDTH = 47;
const HEIGHT = 41;
const R = 21;

function hexPath(cx: number, cy: number): string {
  const h = (Math.sqrt(3) / 2) * R;
  return [
    `M ${cx + R} ${cy}`,
    `L ${cx + R / 2} ${cy + h}`,
    `L ${cx - R / 2} ${cy + h}`,
    `L ${cx - R} ${cy}`,
    `L ${cx - R / 2} ${cy - h}`,
    `L ${cx + R / 2} ${cy - h}`,
    "Z",
  ].join(" ");
}

/* Green reads as Nigeria, and the selected state carries the gold. */
const EMPTY_TILE = "#E8EEF3";
const SCALE = ["#DFF0E4", "#B7DEC2", "#7FC096", "#3F9668", "#126B44"];

function tileFill(members: number, max: number, selected: boolean): string {
  if (selected) return "#0A2550";
  if (!members || !max) return EMPTY_TILE;
  const t = members / max;
  if (t <= 0.25) return SCALE[0];
  if (t <= 0.5) return SCALE[1];
  if (t <= 0.75) return SCALE[2];
  if (t <= 0.95) return SCALE[3];
  return SCALE[4];
}

function FlagMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      role="img"
      aria-label="Flag of Nigeria"
      className={className}
    >
      <rect width="10" height="20" fill="#008751" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#008751" />
    </svg>
  );
}

function ChapterRow({
  chapter,
  variant,
}: {
  chapter: FootprintChapter;
  variant: "portal" | "public";
}) {
  const body = (
    <>
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
    </>
  );

  if (variant === "portal") {
    return (
      <Link
        href={`/portal/chapters/${chapter.id}`}
        className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-navy-50/70"
      >
        {body}
      </Link>
    );
  }

  return <div className="flex items-center gap-3 px-2.5 py-2">{body}</div>;
}

/**
 * The national footprint: every state as one tile, shaded by membership.
 *
 * Selecting a state opens its chapter list on the spot, because a state holds
 * several chapters and the count alone hides the thing people actually want to
 * see. The same component powers the officer dashboard, the statistics page,
 * the reports analysis and the public homepage, so all four are fed by the
 * same database query and can never drift apart.
 */
export function NationalFootprint({
  data,
  variant = "portal",
  compact = false,
}: {
  data: NationalFootprint;
  variant?: "portal" | "public";
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<string>(() => {
    const busiest = [...data.states].sort((a, b) => b.members - a.members)[0];
    return busiest && busiest.chapters.length > 0 ? busiest.name : "Lagos";
  });

  const byName = useMemo(() => {
    const map = new Map<string, FootprintState>();
    for (const state of data.states) map.set(state.name, state);
    return map;
  }, [data.states]);

  const active = byName.get(selected) ?? data.states[0];
  const maxMembers = Math.max(1, ...data.states.map((state) => state.members));
  const xMax = Math.max(...NIGERIA_STATES.map((state) => state.col)) * WIDTH + R;
  const coverage = Math.round((data.totals.statesCovered / 37) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_70px_-60px_rgba(5,37,80,0.55)]">
      {/* Flag header: the one place green earns its keep. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-[#f3faf5] via-white to-[#f7f9fc] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6e8db] bg-white shadow-sm">
            <FlagMark className="h-5 w-auto rounded-[2px] shadow-sm" />
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#008751] uppercase">
              National footprint
            </p>
            <h3 className="font-display text-[17px] font-bold tracking-tight text-navy-900">
              GLANCE across Nigeria
            </h3>
          </div>
        </div>
        <p className="font-data text-[11px] font-semibold text-ink-400">
          {coverage}% state coverage
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Map */}
        <div className="border-b border-line px-4 py-5 lg:border-r lg:border-b-0">
          <svg
            viewBox={`-26 -26 ${xMax + R + 40} ${8 * HEIGHT + 20}`}
            role="group"
            aria-label="Map of Nigeria. Choose a state to see its chapters."
            className="mx-auto h-auto w-full max-w-[430px]"
          >
            {NIGERIA_STATES.map((state) => {
              const stat = byName.get(state.name);
              const members = stat?.members ?? 0;
              const chapters = stat?.chapters.length ?? 0;
              const cx = state.col * WIDTH + (state.row % 2 ? WIDTH / 2 : 0);
              const cy = state.row * HEIGHT + R;
              const isSelected = selected === state.name;
              return (
                <g key={state.name} aria-label={`${state.name === "FCT" ? "FCT (Abuja)" : state.name}: ${chapters} ${chapters === 1 ? "chapter" : "chapters"}, ${members} ${members === 1 ? "member" : "members"}`}>
                  <path
                    d={hexPath(cx, cy)}
                    fill={tileFill(members, maxMembers, isSelected)}
                    stroke={isSelected ? "#EAAE14" : "#0B2545"}
                    strokeWidth={isSelected ? 3 : 1.1}
                    strokeOpacity={isSelected ? 1 : 0.35}
                    className="cursor-pointer transition-[fill,stroke] duration-200 hover:brightness-[0.97]"
                    onClick={() => setSelected(state.name)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${state.name}: ${chapters} chapters, ${members} members`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(state.name);
                      }
                    }}
                  />
                  <text
                    x={cx}
                    y={cy}
                    dy={4}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontWeight={700}
                    fill={isSelected ? "#FFFFFF" : members > 0 ? "#083A2A" : "#5B6B81"}
                    className="pointer-events-none font-data select-none"
                  >
                    {state.code}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10.5px] font-semibold text-ink-400">
            <span>No members</span>
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
            <span>Most members</span>
          </div>
        </div>

        {/* Details for the chosen state */}
        <div className="flex min-h-[300px] flex-col px-5 py-5">
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
                    <ChapterRow chapter={chapter} variant={variant} />
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
                {variant === "public" ? (
                  <Link
                    href="/start-a-chapter"
                    className="mt-3 inline-flex h-9 items-center rounded-lg bg-navy-900 px-4 text-[12px] font-bold text-white"
                  >
                    Start a chapter here
                  </Link>
                ) : (
                  <Link
                    href="/portal/chapters/new"
                    className="mt-3 inline-flex h-9 items-center rounded-lg bg-navy-900 px-4 text-[12px] font-bold text-white"
                  >
                    Create a chapter
                  </Link>
                )}
              </div>
            )}
          </div>

          {!compact ? (
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
              <div>
                <p className="font-data text-[17px] font-bold text-navy-900">
                  {data.totals.chapters}
                </p>
                <p className="text-[10.5px] text-ink-400">Chapters</p>
              </div>
              <div>
                <p className="font-data text-[17px] font-bold text-navy-900">
                  {data.totals.members}
                </p>
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
