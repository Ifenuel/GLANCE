import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/server/db";
import { NIGERIA_STATES, canonicalStateKey } from "@/lib/nigeria-states";
import { safeQuery } from "@/server/content";

export type FootprintChapter = {
  id: string;
  name: string;
  code: string;
  institution: string;
  members: number;
  status: string;
};

export type FootprintState = {
  name: string;
  code: string;
  chapters: FootprintChapter[];
  members: number;
};

export type NationalFootprint = {
  states: FootprintState[];
  other: FootprintChapter[];
  totals: {
    chapters: number;
    members: number;
    statesCovered: number;
    institutions: number;
  };
  updatedAt: string;
};

const EMPTY: NationalFootprint = {
  states: NIGERIA_STATES.map((state) => ({
    name: state.name,
    code: state.code,
    chapters: [],
    members: 0,
  })),
  other: [],
  totals: { chapters: 0, members: 0, statesCovered: 0, institutions: 0 },
  updatedAt: new Date(0).toISOString(),
};

/**
 * Every active chapter with its live member count, grouped by state.
 *
 * One query feeds the interactive map, the dashboard summary and the public
 * footprint section, so the numbers on all three can never disagree.
 * `publicView` hides pending and suspended chapters, which are internal.
 */
export async function getNationalFootprint({
  publicView = false,
}: {
  publicView?: boolean;
} = {}): Promise<NationalFootprint> {
  "use cache";
  cacheTag("footprint");
  cacheLife("minutes");
  const rows = await safeQuery(
    "nationalFootprint",
    () =>
      db.chapter.findMany({
        where: publicView ? { status: "ACTIVE" } : {},
        select: {
          id: true,
          name: true,
          code: true,
          institution: true,
          state: true,
          status: true,
          _count: { select: { members: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { name: "asc" },
      }),
    null,
  );

  if (!rows) return EMPTY;

  const byState = new Map<string, FootprintState>();
  for (const state of NIGERIA_STATES) {
    byState.set(state.name, {
      name: state.name,
      code: state.code,
      chapters: [],
      members: 0,
    });
  }

  const other: FootprintChapter[] = [];
  const institutions = new Set<string>();

  for (const row of rows) {
    const chapter: FootprintChapter = {
      id: row.id,
      name: row.name,
      code: row.code,
      institution: row.institution,
      members: row._count.members,
      status: row.status,
    };
    const key = canonicalStateKey(row.state);
    if (key) {
      const entry = byState.get(key);
      if (entry) {
        entry.chapters.push(chapter);
        entry.members += chapter.members;
      } else {
        other.push(chapter);
      }
    } else {
      other.push(chapter);
    }
    if (row.status === "ACTIVE") institutions.add(row.institution.trim().toLowerCase());
  }

  const states = NIGERIA_STATES.map((state) => byState.get(state.name)!);
  const activeRows = rows.filter((row) => row.status === "ACTIVE");
  const activeChapters = activeRows.length;
  const activeMembers = activeRows.reduce((sum, row) => sum + row._count.members, 0);

  return {
    states,
    other,
    totals: {
      chapters: activeChapters,
      members: activeMembers,
      statesCovered: states.filter((state) => state.chapters.length > 0).length,
      institutions: institutions.size,
    },
    updatedAt: new Date().toISOString(),
  };
}
