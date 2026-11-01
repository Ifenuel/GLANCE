"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, SearchIcon } from "@/components/icons";
import { ButtonLink } from "@/components/button-link";

const PAGE_SIZE = 8;

type ChapterRow = {
  id: string;
  code: string;
  name: string;
  institution: string;
  city: string;
  state: string;
  memberCount: number;
  logoUrl: string | null;
};

type SortKey = "name" | "institution" | "code" | "location" | "members";

/**
 * Declared at module level so it is not recreated on every parent render.
 * The active sort comes in as props instead of closing over parent state.
 */
function SortLabel({
  label,
  column,
  sortKey,
  ascending,
  sortBy,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  ascending: boolean;
  sortBy: (key: SortKey) => void;
}) {
  const active = sortKey === column;
  return (
    <button
      type="button"
      onClick={() => sortBy(column)}
      className="inline-flex items-center gap-1.5 font-bold tracking-[0.08em] uppercase transition-colors hover:text-navy-900"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span
        aria-hidden="true"
        className={`text-[9px] transition-opacity ${active ? "opacity-100" : "opacity-30"}`}
      >
        {active && !ascending ? "▲" : "▼"}
      </span>
    </button>
  );
}

/**
 * The chapter directory as a proper data table: search, institution and state
 * filters, sortable columns, and a stacked list on phones so nothing is
 * squashed. All data is already loaded server-side; filtering is client-side
 * because the directory is a single page of activated chapters.
 */
export function ChaptersDirectory({ chapters }: { chapters: ChapterRow[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [institution, setInstitution] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [ascending, setAscending] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const states = useMemo(
    () => Array.from(new Set(chapters.map((chapter) => chapter.state))).sort(),
    [chapters],
  );

  const institutions = useMemo(
    () => Array.from(new Set(chapters.map((chapter) => chapter.institution))).sort(),
    [chapters],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = chapters.filter((chapter) => {
      if (state && chapter.state !== state) return false;
      if (institution && chapter.institution !== institution) return false;
      if (!needle) return true;
      return [chapter.name, chapter.institution, chapter.city, chapter.state, chapter.code]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    const value = (chapter: ChapterRow) => {
      switch (sortKey) {
        case "institution":
          return chapter.institution.toLowerCase();
        case "code":
          return chapter.code.toLowerCase();
        case "location":
          return `${chapter.state} ${chapter.city}`.toLowerCase();
        case "members":
          return chapter.memberCount;
        default:
          return chapter.name.toLowerCase();
      }
    };

    return [...filtered].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (typeof av === "number" && typeof bv === "number") {
        return ascending ? av - bv : bv - av;
      }
      return ascending
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [chapters, query, state, institution, sortKey, ascending]);

  // Keep the list scannable: show a page of results and let visitors expand,
  // instead of dumping every chapter on the page at once.
  const visible =
    showAll || results.length <= PAGE_SIZE ? results : results.slice(0, PAGE_SIZE);



  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setAscending((value) => !value);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  }

  return (
    <div className="transition-opacity">
      {/* Filter bar ------------------------------------------------------- */}
      <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]">
        <div className="flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 focus-within:border-navy-500 focus-within:ring-2 focus-within:ring-navy-500/15">
          <SearchIcon className="h-4 w-4 shrink-0 text-navy-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by chapter name, institution, location or code…"
            aria-label="Search chapters"
            className="w-full bg-transparent text-[14px] text-navy-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>

        <select
          value={state}
          onChange={(event) => setState(event.target.value)}
          aria-label="Filter by state"
          className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        >
          <option value="">All States</option>
          {states.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={institution}
          onChange={(event) => setInstitution(event.target.value)}
          aria-label="Filter by institution"
          className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] text-navy-900 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none"
        >
          <option value="">All Institutions</option>
          {institutions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mt-5 text-[13px] text-ink-500">
          Showing <strong className="font-semibold text-navy-900">{visible.length}</strong> of{" "}
          {results.length} matching {results.length === 1 ? "chapter" : "chapters"} ({chapters.length} in
          total)
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-navy-50 via-white to-[#F7F3E4] p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
            <SearchIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-6 text-[20px] font-bold tracking-tight text-navy-950 sm:text-[24px]">
            GLANCE is not here yet
          </h3>
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-[1.9] text-ink-500">
            We could not find an activated GLANCE chapter matching that search — yet.
            Every chapter starts exactly this way: with someone who believes their
            community deserves prepared young leaders.
          </p>
          <p className="mx-auto mt-4 max-w-[520px] text-[15px] font-semibold text-navy-900">
            Will you be the first to pioneer a GLANCE chapter here?
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/start-a-chapter">
              Apply to start a chapter
            </ButtonLink>
            <ButtonLink href="/join" variant="outline">
              Join an existing chapter
            </ButtonLink>
          </div>
          <p className="mt-6 text-[12px] text-ink-400">
            Every application is reviewed by the GLANCE secretariat before a chapter is
            activated. Photos, news and updates appear on a chapter’s page once it
            launches.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet table -------------------------------------- */}
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Activated GLANCE chapters</caption>
              <thead>
                <tr className="border-b border-line bg-navy-50/60 text-[10.5px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                  <th scope="col" className="px-5 py-3.5">
                    <SortLabel label="Chapter Name" column="name" sortKey={sortKey} ascending={ascending} sortBy={sortBy} />
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <SortLabel label="Institution" column="institution" sortKey={sortKey} ascending={ascending} sortBy={sortBy} />
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <SortLabel label="Code" column="code" sortKey={sortKey} ascending={ascending} sortBy={sortBy} />
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    <SortLabel label="Location" column="location" sortKey={sortKey} ascending={ascending} sortBy={sortBy} />
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    <SortLabel label="Members" column="members" sortKey={sortKey} ascending={ascending} sortBy={sortBy} />
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    <span className="sr-only">Open chapter</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((chapter) => (
                  <tr
                    key={chapter.id}
                    className="group border-b border-line/70 transition-colors last:border-0 hover:bg-navy-50/40"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/chapters/${chapter.code}`}
                        className="text-[13.5px] font-bold text-navy-900 hover:text-navy-600"
                      >
                        {chapter.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-ink-600">
                      {chapter.institution}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-data rounded-md bg-navy-50 px-2 py-1 text-[11.5px] font-bold tracking-[0.04em] text-navy-800">
                        {chapter.code}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-ink-600">
                      {chapter.city}, {chapter.state}
                    </td>
                    <td className="font-data px-4 py-4 text-right text-[13.5px] font-bold text-navy-900 tabular-nums">
                      {chapter.memberCount}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAAE14]/15 px-2.5 py-1 text-[11px] font-bold text-[#8a6100]">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#EAAE14]" />
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/chapters/${chapter.code}`}
                        aria-label={`Open ${chapter.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-navy-900 transition-colors group-hover:border-navy-900 group-hover:bg-navy-900 group-hover:text-white"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: the same rows, stacked ------------------------------- */}
          <ul className="mt-5 space-y-3 md:hidden">
            {visible.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={`/chapters/${chapter.code}`}
                  className="lift sheen block rounded-xl border border-line bg-white p-4 hover:border-navy-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold tracking-[0.1em] text-gold-600 uppercase">
                        {chapter.code}
                      </p>
                      <p className="mt-1 truncate text-[14px] font-bold text-navy-900">
                        {chapter.name}
                      </p>
                      <p className="mt-1 text-[12.5px] text-ink-500">
                        {chapter.institution}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-400">
                        {chapter.city}, {chapter.state}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-data text-[18px] leading-none font-bold text-navy-900">
                        {chapter.memberCount}
                      </p>
                      <p className="mt-1 text-[10.5px] text-ink-400">members</p>
                    </div>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EAAE14]/15 px-2.5 py-1 text-[10.5px] font-bold text-[#8a6100]">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#EAAE14]" />
                    Active
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Expand beyond the first page of results ------------------------ */}
          {results.length > PAGE_SIZE ? (
            <div className="mt-6 flex items-center justify-center gap-4">
              {!showAll ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-5 text-[13px] font-bold text-navy-900 transition-colors hover:border-navy-900 hover:bg-navy-50"
                  >
                    Show all {results.length} chapters
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[12px] text-ink-400 hidden sm:block">
                    Can’t find yours? Use the search above.
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-5 text-[13px] font-bold text-navy-900 transition-colors hover:border-navy-900 hover:bg-navy-50"
                >
                  Show fewer
                </button>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
