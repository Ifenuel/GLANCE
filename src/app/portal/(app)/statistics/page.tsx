import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { getNationalFootprint } from "@/server/footprint";
import { NigeriaInteractiveMap } from "@/components/portal/nigeria-map";
import { Card, SectionHeading } from "@/components/ui";
import { GrowthLineChart } from "@/components/portal/dashboard-charts";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Statistics",
  description: "Chapters and members across Nigeria, live from the database.",
};

const LEVELS: { key: string; label: string }[] = [
  { key: "YEAR_1", label: "Year 1" },
  { key: "YEAR_2", label: "Year 2" },
  { key: "YEAR_3", label: "Year 3" },
  { key: "YEAR_4", label: "Year 4" },
  { key: "YEAR_5", label: "Year 5" },
  { key: "ND", label: "ND" },
  { key: "HND", label: "HND" },
  { key: "PGD", label: "PGD" },
  { key: "MASTERS", label: "Masters" },
  { key: "DOCTORATE", label: "Doctorate" },
];

export default async function StatisticsPage() {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);
  const footprint = await getNationalFootprint();
  const ranked = [...footprint.states].sort(
    (a, b) => b.members - a.members || b.chapters.length - a.chapters.length,
  );
  const topStates = ranked.slice(0, 8);
  const coverage = Math.round((footprint.totals.statesCovered / 37) * 100);
  const maxStateMembers = Math.max(1, ...footprint.states.map((state) => state.members));

  // Coverage over the academic ladder.
  const [levelCounts, genderCounts, categoryCounts] = await Promise.all([
    db.memberProfile.groupBy({ by: ["academicLevel"], _count: true }),
    db.memberProfile.groupBy({ by: ["gender"], _count: true }),
    db.memberProfile.groupBy({ by: ["membershipCategory"], _count: true }),
  ]);

  const totalMembers = levelCounts.reduce((sum, row) => sum + row._count, 0) ||
    footprint.totals.members;

  const genderLabel: Record<string, string> = {
    FEMALE: "Female",
    MALE: "Male",
    OTHER: "Other",
    PREFER_NOT_TO_SAY: "Prefer not to say",
  };
  // Always render the four gender tiles in a fixed order so the card reads
  // the same way even when one group is empty; counts default to zero.
  const genderTiles = (Object.keys(genderLabel) as string[]).map((key) => ({
    key,
    count: genderCounts.find((row) => row.gender === key)?._count ?? 0,
  }));

  const comparedStates = topStates.map((state) => ({
    label: state.name,
    value: state.members,
  }));

  return (
    <div className="space-y-7">
      <SectionHeading
        eyebrow="Network intelligence"
        title="Statistics"
        intro={
          <p>
            One live view of where GLANCE stands. Every number here is queried
            from the database at request time — hover or pick a state on the map
            to see the chapters behind theirs.
          </p>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Active chapters", value: footprint.totals.chapters },
          { label: "Active members", value: footprint.totals.members },
          { label: "States with a chapter", value: `${footprint.totals.statesCovered}/37` },
          { label: "National coverage", value: `${coverage}%` },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5 transition-shadow hover:shadow-lg">
            <p className="text-[10.5px] font-bold tracking-[0.14em] text-ink-400 uppercase">
              {kpi.label}
            </p>
            <p className="font-data mt-3 text-[30px] leading-none font-bold tracking-tight text-navy-900">
              {kpi.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Real geographic map */}
      <NigeriaInteractiveMap data={footprint} />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Histogram of top states */}
        <Card>
          <h3 className="font-display text-[15px] font-bold text-navy-900">
            Top states by membership
          </h3>
          <p className="mt-0.5 text-[11.5px] text-ink-400">
            Where the network is strongest, measured by active members.
          </p>
          <ul className="mt-4 space-y-3">
            {comparedStates.map((state) => (
              <li key={state.label}>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="font-bold text-navy-900">{state.label}</span>
                  <span className="font-data font-semibold text-ink-500">
                    {formatNumber(state.value)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-navy-500 to-navy-900 transition-[width]"
                    style={{ width: `${Math.max(6, (state.value / maxStateMembers) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Composition donut-style lists */}
        <div className="space-y-5">
          <Card>
            <h3 className="font-display text-[15px] font-bold text-navy-900">
              Membership composition
            </h3>
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              Category split across every registered member.
            </p>
            <div className="mt-4 space-y-2.5">
              {categoryCounts.map((row) => (
                <div key={row.membershipCategory} className="flex items-center gap-3">
                  <span className="w-24 text-[12px] font-bold text-navy-900">
                    {row.membershipCategory === "STUDENT"
                      ? "Student"
                      : row.membershipCategory === "NON_STUDENT"
                        ? "Non-student"
                        : "Alumni"}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-50">
                    <div
                      className="h-full rounded-full bg-gold-400"
                      style={{ width: `${totalMembers ? (row._count / totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-data w-10 text-right text-[12px] font-bold text-navy-900">
                    {row._count}
                  </span>
                </div>
              ))}
              {categoryCounts.length === 0 ? (
                <p className="text-[12.5px] text-ink-500">No members recorded yet.</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-[15px] font-bold text-navy-900">
              Gender representation
            </h3>
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              How members self-report. Anyone who declines to share is counted
              as “Prefer not to say”, never guessed.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {genderTiles.map((row) => (
                <div key={row.key} className="rounded-xl border border-line bg-navy-50/40 p-3 text-center">
                  <p className="font-data text-[19px] font-bold text-navy-900">{row.count}</p>
                  <p className="mt-0.5 text-[10.5px] text-ink-400">{genderLabel[row.key]}</p>
                </div>
              ))}
              {genderTiles.every((row) => row.count === 0) ? (
                <p className="col-span-full text-[12.5px] text-ink-500">No members recorded yet.</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-[15px] font-bold text-navy-900">
              Academic ladder
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LEVELS.map((level) => {
                const row = levelCounts.find((entry) => entry.academicLevel === level.key);
                return (
                  <div key={level.key} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <span className="text-[11.5px] font-semibold text-ink-500">{level.label}</span>
                    <span className="font-data text-[13px] font-bold text-navy-900">
                      {row?._count ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-[15px] font-bold text-navy-900">
            Every state, ranked by members
          </h2>
          <p className="mt-0.5 text-[11.5px] text-ink-400">
            Chapters are clickable and open the directory filtered to that state.
          </p>
        </div>
        <table className="w-full min-w-[480px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[10.5px] font-bold tracking-[0.14em] text-ink-400 uppercase">
              <th className="py-3 pr-4 pl-5">State</th>
              <th className="py-3 pr-4">Chapters</th>
              <th className="py-3 pr-5">Members</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((state) => (
              <tr
                key={state.name}
                className="border-b border-line/60 transition-colors last:border-0 hover:bg-navy-50/60"
              >
                <td className="py-2.5 pr-4 pl-5 font-bold text-navy-900">
                  {state.name === "FCT" ? "FCT (Abuja)" : state.name}
                </td>
                <td className="py-2.5 pr-4 text-ink-500">
                  {state.chapters.length > 0 ? (
                    <Link
                      href={`/portal/chapters?query=${encodeURIComponent(state.name)}`}
                      className="underline decoration-gold-400 decoration-2 underline-offset-2 hover:text-navy-900"
                    >
                      {state.chapters.length}
                    </Link>
                  ) : (
                    <span className="text-ink-300">0</span>
                  )}
                </td>
                <td className="font-data py-2.5 pr-5 font-semibold text-ink-500">
                  {state.members}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
