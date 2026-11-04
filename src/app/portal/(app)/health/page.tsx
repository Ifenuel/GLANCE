import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { emailDeliveryConfigured } from "@/server/email";
import { Badge, Card, SectionHeading, VerifiedNote } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "System health",
  description: "Live checks on the database, email, media storage and recent failures.",
};

export default async function HealthPage() {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);

  const started = Date.now();
  let database: "up" | "down" = "down";
  try {
    await db.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }
  const latency = Date.now() - started;

  const [errors, totalErrors] = await Promise.all([
    db.errorLog
      .findMany({ orderBy: { lastSeenAt: "desc" }, take: 25 })
      .catch(() => []),
    db.errorLog.aggregate({ _sum: { count: true } }).catch(() => ({ _sum: { count: 0 } })),
  ]);

  const checks = [
    {
      label: "Database",
      state: database === "up" ? "ok" : "down",
      detail:
        database === "up"
          ? `Answering in ${latency} ms`
          : "Not answering — pages that read data will fail",
    },
    {
      label: "Transactional email",
      state: emailDeliveryConfigured() ? "ok" : "warn",
      detail: emailDeliveryConfigured()
        ? "Brevo key present; invitations and resets will send"
        : "No Brevo key: forms still work, but no email leaves the platform",
    },
    {
      label: "Media storage",
      state: process.env.CLOUDINARY_CLOUD_NAME ? "ok" : "warn",
      detail: process.env.CLOUDINARY_CLOUD_NAME
        ? "Cloudinary configured for photos and videos"
        : "No Cloudinary credentials: uploads will be refused",
    },
    {
      label: "Rate limiting",
      state: "ok",
      detail:
        process.env.REDIS_ENABLED === "true"
          ? "Shared through Redis across all servers"
          : "In-memory per server — fine for now, Redis when traffic grows",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Operations"
        title="System health"
        intro={
          <p>
            What is working right now, and what has failed recently. The public
            endpoint at <code className="font-mono text-[12px]">/api/health</code>{" "}
            returns the same picture as JSON for an external uptime monitor.
          </p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {checks.map((check) => (
          <Card key={check.label}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[14px] font-extrabold text-navy-900">{check.label}</h3>
              <Badge tone={check.state === "ok" ? "active" : check.state === "warn" ? "pending" : "neutral"}>
                {check.state === "ok" ? "Working" : check.state === "warn" ? "Not set up" : "Down"}
              </Badge>
            </div>
            <p className="mt-2 text-[12.5px] leading-[1.7] text-ink-500">{check.detail}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-base font-extrabold text-navy-900">Recent failures</h3>
          <p className="text-[12px] text-ink-500">
            {(totalErrors._sum.count ?? 0) === 0
              ? "No errors recorded"
              : `${(totalErrors._sum.count ?? 0).toLocaleString("en-NG")} occurrences across ${errors.length} distinct issues`}
          </p>
        </div>

        {errors.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-navy-50/40 px-4 py-6 text-center text-[13px] text-ink-500">
            Nothing has failed since this log was switched on. That is the state
            you want to keep finding here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {errors.map((error) => (
              <li key={error.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={error.count > 20 ? "pending" : "neutral"}>
                    ×{error.count}
                  </Badge>
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-navy-900">
                    {error.message}
                  </p>
                  <span className="font-mono text-[11px] text-ink-400">
                    {formatDateTime(error.lastSeenAt)}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-ink-500">
                  {error.path ?? "unknown page"} · {error.source}
                  {error.userAgent ? ` · ${error.userAgent.slice(0, 60)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}

        <VerifiedNote>
          Errors are grouped by where they happened, so one failing page creates
          one line with a counter rather than hundreds of rows. No visitor
          content, passwords or form values are recorded.
        </VerifiedNote>
      </Card>
    </div>
  );
}
