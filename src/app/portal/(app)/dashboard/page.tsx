import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { auditSummary } from "@/server/audit";
import { AuditFeed } from "@/components/portal/audit-feed";
import { ROLES, requireUser } from "@/server/auth";
import { NigeriaInteractiveMap } from "@/components/portal/nigeria-map";
import { getNationalFootprint } from "@/server/footprint";
import { Badge } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";
import { GrowthLineChart, ChapterStatusDonut } from "@/components/portal/dashboard-charts";
import type { Role } from "@prisma/client";

// The dashboard is a live, per-user view; blocking is correct and avoids the
// "uncached data" prerender warning on every navigation.
export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your GLANCE workspace.",
};

const STATUS_TONE = {
  ACTIVE: "active",
  PENDING: "pending",
  SUSPENDED: "danger",
  DEACTIVATED: "neutral",
} as const;

const STATUS_LABEL = {
  ACTIVE: "Active",
  PENDING: "Pending",
  SUSPENDED: "Suspended",
  DEACTIVATED: "Deactivated",
} as const;

function greetingFor(name: string) {
  const first = name.trim().split(" ")[0];
  return first && first.toLowerCase() !== "glance" ? `Welcome back, ${first}` : "Welcome back";
}

/* ------------------------------------------------------------------ hero */

function HeroBand({
  roleLabel,
  name,
  today,
  links,
}: {
  roleLabel: string;
  name: string;
  today: string;
  links: { href: string; label: string }[];
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white shadow-[0_30px_60px_-30px_rgba(4,13,26,0.8)] sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(234,174,20,0.18),transparent_70%)] blur-2xl"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-400 uppercase">
            {roleLabel}
          </p>
          <h1 className="font-display mt-2 text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-[-0.03em]">
            {greetingFor(name)}
          </h1>
          <p className="font-data mt-1.5 text-[12.5px] text-white/60">{today}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11.5px] font-bold tracking-wide text-white transition-colors hover:border-gold-400/60 hover:bg-gold-400/10 hover:text-gold-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------- sparkline */

function Sparkline({ series }: { series: number[] }) {
  const width = 120;
  const height = 28;
  const max = Math.max(...series, 1);
  const points = series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * width;
      const y = height - (value / max) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-7 w-[120px] overflow-visible"
      fill="none"
    >
      <polyline
        points={points}
        stroke="#eaae14"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - (series[series.length - 1] / max) * (height - 4) - 2}
        r="3"
        fill="#eaae14"
      />
    </svg>
  );
}

function Kpi({
  label,
  value,
  hint,
  href,
  spark,
  pulse,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
  spark?: number[];
  pulse?: boolean;
}) {
  return (
    <Link
      href={href}
      className="card-lift group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(5,42,92,0.06),0_18px_40px_-28px_rgba(5,42,92,0.35)] hover:border-navy-200"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] rounded-full bg-gradient-to-r from-gold-400 via-gold-400/50 to-transparent opacity-70"
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-bold tracking-[0.14em] text-ink-400 uppercase">
          {label}
        </p>
        <span
          aria-hidden="true"
          className={`mt-1 h-1.5 w-1.5 rounded-full bg-gold-400 transition-opacity ${
            pulse ? "pulse-soft" : "opacity-0 group-hover:opacity-100"
          }`}
        />
      </div>
      <p className="font-data mt-3 text-[32px] leading-none font-bold tracking-tight text-navy-900">
        {value}
      </p>
      <p className="mt-2 text-[11.5px] text-ink-500">{hint}</p>
      {spark ? <Sparkline series={spark} /> : null}
    </Link>
  );
}

function SectionCard({
  title,
  detail,
  action,
  children,
}: {
  title: string;
  detail?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(5,42,92,0.06),0_18px_40px_-28px_rgba(5,42,92,0.3)]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] rounded-full bg-gradient-to-r from-gold-400 via-gold-400/50 to-transparent opacity-60"
      />
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-[15px] font-bold text-navy-900">{title}</h2>
          {detail ? <p className="mt-0.5 text-[11.5px] text-ink-400">{detail}</p> : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 text-[11.5px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4 transition-colors hover:text-gold-600"
          >
            {action.label}
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-[12.5px] text-ink-500">{children}</p>;
}

export default async function DashboardPage() {
  const viewer = await requireUser();

  if (viewer.role === "MEMBER" || viewer.role === "ALUMNI") {
    redirect("/portal/profile");
  }

  const role = viewer.role as Role;
  const access = ROLES[role];
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  /* ------------------------------------------------------- network officer & super admin */
  if (role === "SUPER_ADMIN" || role === "AGID_ADMIN") {
    const [
      footprint,
      audit,
      memberApps,
      chapterApps,
      chaptersCount,
      membersCount,
      chapterStatusCounts,
      registrationDates,
    ] = await Promise.all([
      getNationalFootprint(),
      auditSummary(),
      db.joinApplication.count({ where: { status: "PENDING" } }),
      db.chapterApplication.count({ where: { status: "PENDING" } }),
      db.chapter.count({ where: { status: "ACTIVE" } }),
      db.memberProfile.count(),
      db.chapter.groupBy({ by: ["status"], _count: true }),
      // The growth chart is fed purely by real registration timestamps, so the
      // curve always agrees with the member list it comes from.
      db.memberProfile.findMany({
        select: { registeredAt: true },
        orderBy: { registeredAt: "asc" },
      }),
    ]);

    // Monthly registration counts for the trailing 12 months, oldest first.
    const monthly = new Map<string, number>();
    for (const { registeredAt } of registrationDates) {
      const key = `${registeredAt.getUTCFullYear()}-${String(registeredAt.getUTCMonth() + 1).padStart(2, "0")}`;
      monthly.set(key, (monthly.get(key) ?? 0) + 1);
    }
    const growthSeries: { month: string; value: number }[] = [];
    const cursor = new Date();
    cursor.setUTCDate(1);
    cursor.setUTCHours(0, 0, 0, 0);
    for (let i = 11; i >= 0; i--) {
      const point = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
      const key = `${point.getUTCFullYear()}-${String(point.getUTCMonth() - i + 1).padStart(2, "0")}`;
      void key;
      growthSeries.push({
        month: point.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
        value: monthly.get(
          `${point.getUTCFullYear()}-${String(point.getUTCMonth() + 1).padStart(2, "0")}`
        ) ?? 0,
      });
    }
    const cumulativeSpark: number[] = [];
    let running = 0;
    for (const point of growthSeries) {
      running += point.value;
      cumulativeSpark.push(running);
    }
    const statusCount = (status: string) =>
      chapterStatusCounts.find((row) => row.status === status)?._count ?? 0;

    const pending = memberApps + chapterApps;

    return (
      <div className="space-y-6">
        <HeroBand
          roleLabel={access?.label ?? "GLANCE portal"}
          name={viewer.name}
          today={today}
          links={[
            { href: "/portal/applications", label: "Review queue" },
            { href: "/portal/chapters", label: "Chapters" },
            { href: "/portal/members", label: "Members" },
          ]}
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi
            label="Active chapters"
            value={formatNumber(chaptersCount)}
            hint={`${footprint.totals.statesCovered} of 37 states`}
            href="/portal/chapters"
            spark={growthSeries.map((point) => point.value)}
          />
          <Kpi
            label="Total members"
            value={formatNumber(membersCount)}
            hint="Registered in the database"
            href="/portal/members"
            spark={cumulativeSpark}
          />
          <Kpi
            label="Pending applications"
            value={formatNumber(pending)}
            hint={`${memberApps} member, ${chapterApps} chapter`}
            href="/portal/applications"
            pulse={pending > 0}
          />
          <Kpi
            label="Institutions"
            value={formatNumber(footprint.totals.institutions)}
            hint="Host campuses"
            href="/portal/statistics"
          />
        </div>

        {/* Charts matching board layout */}
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(5,42,92,0.06),0_18px_40px_-28px_rgba(5,42,92,0.3)]">
            <GrowthLineChart series={growthSeries} />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(5,42,92,0.06),0_18px_40px_-28px_rgba(5,42,92,0.3)]">
            <ChapterStatusDonut
              active={statusCount("ACTIVE")}
              pending={statusCount("PENDING")}
              suspended={statusCount("SUSPENDED")}
            />
          </div>
        </div>

        <div className="card-lift">
          <NigeriaInteractiveMap data={footprint} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
          <SectionCard
            title="Waiting on you"
            detail={pending > 0 ? `${pending} open decision${pending === 1 ? "" : "s"}` : "Nothing waiting"}
            action={{ href: "/portal/applications", label: "Review" }}
          >
            {pending === 0 ? (
              <EmptyNote>Every application has been reviewed. The queue is clear.</EmptyNote>
            ) : (
              <ul className="divide-y divide-line">
                <li className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-[13px] font-bold text-navy-900">Membership applications</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-400">
                      People waiting to join a chapter
                    </p>
                  </div>
                  <span className="pulse-soft font-data shrink-0 rounded-lg bg-navy-900 px-3.5 py-2 text-[12px] font-bold text-white">
                    {memberApps} open
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-[13px] font-bold text-navy-900">Chapter applications</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-400">
                      New campuses asking to open a chapter
                    </p>
                  </div>
                  <span className="pulse-soft font-data shrink-0 rounded-lg border border-line px-3.5 py-2 text-[12px] font-bold text-navy-800">
                    {chapterApps} open
                  </span>
                </li>
              </ul>
            )}
            <div className="grid grid-cols-3 gap-2 border-t border-line p-4">
              {[
                { href: "/portal/chapters/new", label: "New chapter" },
                { href: "/portal/invitations/new", label: "Invite admin" },
                { href: "/portal/reports", label: "Reports" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rule-grow rounded-xl border border-line px-3 py-2.5 text-center text-[12px] font-bold text-navy-900 transition-colors hover:border-navy-200 hover:bg-navy-50/50"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Recent activity"
            detail="Who did what, newest first"
            action={{ href: "/portal/audit", label: "Audit log" }}
          >
            <AuditFeed entries={audit} limit={7} />
          </SectionCard>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------- communication manager */
  if (role === "COMM_MANAGER") {
    const now = new Date();
    const [published, upcoming, pastEvents, media, recentEvents] = await Promise.all([
      db.post.count({ where: { status: "PUBLISHED" } }),
      db.event.count({ where: { status: "PUBLISHED", startsAt: { gte: now } } }),
      db.event.count({ where: { startsAt: { lt: now } } }),
      db.mediaAsset.count({ where: { published: true } }),
      db.event.findMany({
        where: { startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 4,
        select: { id: true, title: true, startsAt: true, location: true, status: true },
      }),
    ]);

    return (
      <div className="space-y-6">
        <HeroBand
          roleLabel={access?.label ?? "GLANCE portal"}
          name={viewer.name}
          today={today}
          links={[
            { href: "/portal/events", label: "Manage events" },
            { href: "/portal/media", label: "Gallery" },
            { href: "/news", label: "Public feed" },
          ]}
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi
            label="Published stories"
            value={formatNumber(published)}
            hint="Live on the public site"
            href="/news"
          />
          <Kpi
            label="Upcoming events"
            value={formatNumber(upcoming)}
            hint="On the public calendar"
            href="/portal/events"
            pulse={upcoming > 0}
          />
          <Kpi
            label="Gallery items"
            value={formatNumber(media)}
            hint="Live on the website"
            href="/portal/media"
          />
          <Kpi
            label="Past events"
            value={formatNumber(pastEvents)}
            hint="In the events archive"
            href="/portal/events"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
          <SectionCard
            title="Coming up"
            detail="The next events the public will see"
            action={{ href: "/portal/events", label: "Manage events" }}
          >
            {recentEvents.length === 0 ? (
              <EmptyNote>No events scheduled yet. Add one so the calendar stays alive.</EmptyNote>
            ) : (
              <ul className="divide-y divide-line">
                {recentEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-navy-900">{event.title}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-400">
                        {formatDate(event.startsAt)} · {event.location}
                      </p>
                    </div>
                    <Badge tone={event.status === "PUBLISHED" ? "active" : "pending"}>
                      {event.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Publish something today" detail="Three moves that keep the site current">
            <div className="space-y-2 p-4">
              {[
                {
                  href: "/portal/events",
                  title: "Add an event",
                  detail: "Date, venue and a short description is enough.",
                },
                {
                  href: "/portal/media",
                  title: "Upload a photo set",
                  detail: "Gallery images show up on the public site immediately.",
                },
                {
                  href: "/news",
                  title: "Check the public feed",
                  detail: "See the site exactly as visitors do.",
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group block rounded-xl border border-line p-4 transition-colors hover:border-navy-200 hover:bg-navy-50/40"
                >
                  <p className="text-[13px] font-bold text-navy-900">{action.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{action.detail}</p>
                  <span className="mt-2 block h-[2px] w-6 bg-gold-400 transition-all group-hover:w-12" />
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------- chapter admin */
  if (role === "CHAPTER_ADMIN") {
    if (!viewer.chapterId) {
      return (
        <div className="space-y-6">
          <HeroBand
            roleLabel={access?.label ?? "GLANCE portal"}
            name={viewer.name}
            today={today}
            links={[{ href: "/portal/profile", label: "My profile" }]}
          />
          <div className="rounded-2xl border border-gold-200 bg-gold-100/40 p-6 shadow-[0_18px_40px_-28px_rgba(5,42,92,0.35)]">
            <h2 className="font-display text-[18px] font-bold text-navy-900">
              No chapter attached to this account yet
            </h2>
            <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed text-ink-600">
              The secretariat sets up your chapter before this desk goes live.
              Contact the GLANCE team and it will be linked within
              minutes.
            </p>
          </div>
        </div>
      );
    }

    const [chapter, activeMembers, reports, pendingInvites, recentMembers, recentReports] =
      await Promise.all([
        db.chapter.findUnique({
          where: { id: viewer.chapterId },
          select: {
            id: true,
            name: true,
            code: true,
            institution: true,
            state: true,
            status: true,
            _count: { select: { events: true, invitations: true } },
          },
        }),
        db.memberProfile.count({ where: { chapterId: viewer.chapterId, status: "ACTIVE" } }),
        db.activityReport.count({ where: { chapterId: viewer.chapterId } }),
        db.invitation.count({ where: { chapterId: viewer.chapterId, status: "PENDING" } }),
        db.memberProfile.findMany({
          where: { chapterId: viewer.chapterId },
          orderBy: { registeredAt: "desc" },
          take: 5,
          select: { id: true, fullName: true, memberCode: true, position: true, registeredAt: true },
        }),
        db.activityReport.findMany({
          where: { chapterId: viewer.chapterId },
          orderBy: { activityDate: "desc" },
          take: 4,
          select: { id: true, title: true, activityDate: true, attendeeCount: true },
        }),
      ]);

    return (
      <div className="space-y-6">
        <HeroBand
          roleLabel={access?.label ?? "GLANCE portal"}
          name={viewer.name}
          today={today}
          links={[
            { href: "/portal/reports/new", label: "Submit report" },
            { href: "/portal/members/register", label: "Register member" },
            { href: "/portal/chapter", label: "Chapter" },
          ]}
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Active members" value={formatNumber(activeMembers)} hint="On your roster" href="/portal/members" />
          <Kpi
            label="Reports filed"
            value={formatNumber(reports)}
            hint="Activity on record"
            href="/portal/reports"
            pulse={pendingInvites > 0}
          />
          <Kpi label="Pending invites" value={formatNumber(pendingInvites)} hint="Awaiting activation" href="/portal/invitations" />
          <Kpi label="Chapter events" value={formatNumber(chapter?._count.events ?? 0)} hint="Held on your campus" href="/portal/chapter" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
          <SectionCard
            title={chapter?.name ?? "Your chapter"}
            detail={
              chapter
                ? `${chapter.code} · ${chapter.institution}, ${chapter.state}`
                : "Chapter details"
            }
            action={{ href: "/portal/chapter", label: "Open chapter" }}
          >
            {chapter ? (
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[chapter.status]}>{STATUS_LABEL[chapter.status]}</Badge>
                  <span className="text-[11.5px] text-ink-400">
                    {chapter._count.invitations} invitation{chapter._count.invitations === 1 ? "" : "s"} issued
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { href: "/portal/members/register", label: "Register a member" },
                    { href: "/portal/invitations/new", label: "Invite a member" },
                    { href: "/portal/reports/new", label: "Submit a report" },
                    { href: "/portal/chapter", label: "Update chapter" },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="rule-grow rounded-xl border border-line px-3 py-3 text-[12px] font-bold text-navy-900 transition-colors hover:border-navy-200 hover:bg-navy-50/50"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyNote>This chapter record could not be loaded.</EmptyNote>
            )}
          </SectionCard>

          <SectionCard
            title="Newest members"
            detail="The last five people added"
            action={{ href: "/portal/members", label: "All members" }}
          >
            {recentMembers.length === 0 ? (
              <EmptyNote>No members yet. Register the first one to start the roster.</EmptyNote>
            ) : (
              <ul className="divide-y divide-line">
                {recentMembers.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-navy-900">{member.fullName}</p>
                      <p className="font-data mt-0.5 truncate text-[11px] text-ink-400">
                        {member.memberCode}
                        {member.position ? ` · ${member.position}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-[11px] text-ink-400">{formatDate(member.registeredAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Latest reports"
          detail="Your chapter's activity record"
          action={{ href: "/portal/reports", label: "All reports" }}
        >
          {recentReports.length === 0 ? (
            <EmptyNote>No activity report yet. The first one is always the hardest.</EmptyNote>
          ) : (
            <ul className="divide-y divide-line">
              {recentReports.map((report) => (
                <li key={report.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-navy-900">{report.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-400">
                      {formatDate(report.activityDate)}
                    </p>
                  </div>
                  <p className="font-data shrink-0 text-[12px] font-semibold text-ink-500">
                    {report.attendeeCount ?? 0} attendees
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    );
  }

  redirect("/portal/profile");
}
