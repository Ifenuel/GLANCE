"use client";

import { useId } from "react";

export type GrowthPoint = { month: string; value: number };

/**
 * Monthly member-registration chart. The series comes straight from the
 * database (registration timestamps grouped by month), so the curve is the
 * truth, never a placeholder.
 */
export function GrowthLineChart({ series }: { series: GrowthPoint[] }) {
  const gradientId = useId();

  const max = Math.max(1, ...series.map((p) => p.value));
  const total = series.reduce((sum, p) => sum + p.value, 0);
  const last = series.at(-1)?.value ?? 0;
  const previous = series.at(-2)?.value ?? 0;
  const delta =
    previous > 0 ? Math.round(((last - previous) / previous) * 1000) / 10 : null;

  const width = 500;
  const height = 180;
  const padding = 24;
  const count = Math.max(series.length, 2);

  const coords = series.map((p, i) => ({
    x: padding + (i / (count - 1)) * (width - padding * 2),
    y: height - padding - (p.value / max) * (height - padding * 2),
    ...p,
  }));

  // Flat-line the curve when there is one or two non-varying point, so the
  // path math stays valid for any series shape.
  const allSameY = coords.length > 1 && coords.every((c) => c.y === coords[0].y);
  const pathD = allSameY
    ? `M ${coords[0].x} ${coords[0].y} L ${coords[coords.length - 1].x} ${coords[0].y}`
    : coords.reduce((acc, c, i) => {
        if (i === 0) return `M ${c.x} ${c.y}`;
        const prev = coords[i - 1];
        const cpX = (prev.x + c.x) / 2;
        return `${acc} C ${cpX} ${prev.y}, ${cpX} ${c.y}, ${c.x} ${c.y}`;
      }, "");

  const areaD = count > 1
    ? `${pathD} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`
    : "";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h4 className="text-[13px] font-bold text-navy-900">Member growth</h4>
          <p className="text-[11px] text-ink-400">
            New registrations per month · {total} total in the last 12 months
          </p>
        </div>
        {delta === null ? null : (
          <span
            className={`rounded px-2 py-0.5 text-[11px] font-bold ${
              delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}% last month
          </span>
        )}
      </div>

      <div className="relative h-[180px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" />

          {count > 1 ? <path d={areaD} fill={`url(#${gradientId})`} /> : null}
          <path d={pathD} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />

          {coords.map((c, i) => (
            <g key={i}>
              <title>{`${c.month}: ${c.value} new member${c.value === 1 ? "" : "s"}`}</title>
              <circle
                cx={c.x}
                cy={c.y}
                r={i === coords.length - 1 ? "4" : "2"}
                fill={i === coords.length - 1 ? "#1e3a8a" : "#2563eb"}
                stroke="#fff"
                strokeWidth="1.5"
                className="transition-[r] duration-150 hover:r-5"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex justify-between pt-1 text-[9px] text-ink-400">
        {series.map((p, i) => (
          <span key={`${p.month}-${i}`}>{p.month}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * Chapter-status donut. Every slice number is passed in by the server from
 * groupBy counts — nothing is defaulted or invented here.
 */
export function ChapterStatusDonut({
  active,
  pending,
  suspended,
}: {
  active: number;
  pending: number;
  suspended: number;
}) {
  const total = active + pending + suspended;
  const c = 251.2;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const activePct = pct(active);
  const pendingPct = pct(pending);
  const suspendedPct = pct(suspended);

  const activeOffset = 0;
  const pendingOffset = -((activePct / 100) * c);
  const suspendedOffset = -(((activePct + pendingPct) / 100) * c);

  const rows = [
    { label: "Active", value: active, color: "bg-emerald-500" },
    { label: "Pending", value: pending, color: "bg-amber-500" },
    { label: "Suspended", value: suspended, color: "bg-rose-500" },
  ];

  return (
    <div className="w-full">
      <div className="pb-2">
        <h4 className="text-[13px] font-bold text-navy-900">Chapter status</h4>
        <p className="text-[11px] text-ink-400">Live distribution across the network</p>
      </div>

      {total === 0 ? (
        <p className="px-1 py-10 text-center text-[12.5px] text-ink-500">
          No chapters recorded yet. Create the first one from the Chapters page.
        </p>
      ) : (
        <div className="flex items-center gap-6 pt-3">
          <div className="relative h-28 w-28 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
              {active > 0 ? (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="14"
                  strokeDasharray={`${(activePct / 100) * c} ${c}`} strokeDashoffset={activeOffset} />
              ) : null}
              {pending > 0 ? (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="14"
                  strokeDasharray={`${(pendingPct / 100) * c} ${c}`} strokeDashoffset={pendingOffset} />
              ) : null}
              {suspended > 0 ? (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="14"
                  strokeDasharray={`${(suspendedPct / 100) * c} ${c}`} strokeDashoffset={suspendedOffset} />
              ) : null}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-extrabold text-navy-900">{total}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">
                Total
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-[11px]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                  <span className="font-medium text-ink-600">{row.label}</span>
                </div>
                <span className="font-bold text-navy-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
