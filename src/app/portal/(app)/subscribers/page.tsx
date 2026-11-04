import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { setSubscriberStatusAction } from "@/server/actions/subscribers";
import { Badge, ButtonLink, Card, SectionHeading, VerifiedNote } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Subscribers",
  description: "The GLANCE mailing list: who confirmed, who is pending, and who left.",
};

const ROLES = ["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"] as const;

const filters = [
  { key: "", label: "All" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PENDING", label: "Pending" },
  { key: "UNSUBSCRIBED", label: "Unsubscribed" },
] as const;

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole([...ROLES]);
  const { status } = await searchParams;

  const [counts, subscribers] = await Promise.all([
    db.subscriber.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    db.subscriber
      .findMany({
        where: status ? { status: status as never } : undefined,
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          id: true,
          email: true,
          name: true,
          source: true,
          status: true,
          createdAt: true,
          confirmedAt: true,
        },
      })
      .catch(() => []),
  ]);

  const total = (key: string) =>
    counts.find((row) => row.status === key)?._count._all ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Audience"
          title="Newsletter subscribers"
          intro={
            <p>
              People who asked to hear from GLANCE. An address only becomes
              confirmed after the person clicks the link in their own inbox, so
              this list is one you can mail honestly.
            </p>
          }
        />
        <ButtonLink href="/api/export/subscribers" variant="outline">
          Export CSV
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Confirmed", value: total("CONFIRMED"), hint: "Ready to receive updates" },
          { label: "Awaiting confirmation", value: total("PENDING"), hint: "Have not clicked yet" },
          { label: "Unsubscribed", value: total("UNSUBSCRIBED"), hint: "Asked not to be contacted" },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-[10.5px] font-bold tracking-[0.16em] text-ink-400 uppercase">
              {item.label}
            </p>
            <p className="mt-2 font-mono text-[30px] leading-none font-extrabold text-navy-900">
              {item.value === 0 ? "—" : item.value.toLocaleString("en-NG")}
            </p>
            <p className="mt-2 text-[11.5px] text-ink-500">{item.hint}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const active = (status ?? "") === filter.key;
            return (
              <Link
                key={filter.label}
                href={filter.key ? `/portal/subscribers?status=${filter.key}` : "/portal/subscribers"}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
                  active
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-line bg-white text-navy-800 hover:bg-navy-50"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11.5px] font-bold tracking-[0.1em] text-ink-400 uppercase">
                <th className="pb-3 pr-3 font-semibold text-navy-900">Email</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Name</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Status</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Source</th>
                <th className="pb-3 pr-3 font-semibold text-navy-900">Joined</th>
                <th className="pb-3 font-semibold text-navy-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td className="py-3 pr-3 font-semibold text-navy-900">{subscriber.email}</td>
                  <td className="py-3 pr-3 text-ink-500">{subscriber.name ?? "—"}</td>
                  <td className="py-3 pr-3">
                    <Badge
                      tone={
                        subscriber.status === "CONFIRMED"
                          ? "active"
                          : subscriber.status === "PENDING"
                            ? "pending"
                            : "neutral"
                      }
                    >
                      {subscriber.status === "CONFIRMED"
                        ? "Confirmed"
                        : subscriber.status === "PENDING"
                          ? "Pending"
                          : "Left"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-ink-500">{subscriber.source ?? "site"}</td>
                  <td className="py-3 pr-3 font-mono text-[11.5px] text-ink-500">
                    {formatDate(subscriber.createdAt)}
                  </td>
                  <td className="py-3">
                    <form action={setSubscriberStatusAction}>
                      <input type="hidden" name="id" value={subscriber.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          subscriber.status === "UNSUBSCRIBED" ? "CONFIRMED" : "UNSUBSCRIBED"
                        }
                      />
                      <button
                        type="submit"
                        className="text-[12px] font-bold text-navy-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-navy-950"
                      >
                        {subscriber.status === "UNSUBSCRIBED" ? "Restore" : "Remove"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-ink-500">
                    <p className="text-base font-bold text-navy-900">No subscribers yet</p>
                    <p className="text-[12.5px]">
                      The form in the site footer is where people add themselves.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <VerifiedNote>
          Only confirmed addresses should ever be mailed. Removing someone keeps
          the record of their consent but stops all future messages.
        </VerifiedNote>
      </Card>
    </div>
  );
}
