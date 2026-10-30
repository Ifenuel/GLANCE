import type { Metadata } from "next";
import Link from "next/link";
import { ROLES, requireUser } from "@/server/auth";
import { Badge } from "@/components/ui";
import type { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: "Roles and access",
  description: "What each GLANCE portal account can see and do.",
};

const DETAIL: Partial<
  Record<Role, { scope: string; can: string[]; cannot: string[]; tone: string }>
> = {
  SUPER_ADMIN: {
    scope: "The whole GLANCE network, unconditionally",
    tone: "gold",
    can: [
      "Everything the GLANCE team can do",
      "Create additional GLANCE team accounts directly",
      "Access, correct or export any record in the system",
    ],
    cannot: [
      "Bypass the audit log — all actions are recorded like any other",
    ],
  },
  AGID_ADMIN: {
    scope: "The whole GLANCE network",
    tone: "navy",
    can: [
      "Create, activate, suspend and deactivate chapters",
      "Review chapter applications and membership applications",
      "Manage every member record in every chapter",
      "Issue administrator invitations and reset accounts",
      "Publish news, events and gallery items",
      "Read the full audit trail and export member data",
    ],
    cannot: [
      "Delete the audit trail (records are retained by design)",
      "Grant themselves a role outside the administrator role",
    ],
  },
  COMM_MANAGER: {
    scope: "Content and communications for the whole network",
    tone: "gold",
    can: [
      "Create and publish upcoming events with teaser videos",
      "Manage the media gallery: add, publish and remove items",
      "See everything published on the public site from one place",
    ],
    cannot: [
      "Manage chapters, members or applications",
      "Issue invitations or reset accounts",
      "Read the audit trail",
    ],
  },
  CHAPTER_ADMIN: {
    scope: "One chapter only",
    tone: "gold",
    can: [
      "Approve or reject membership applications for their chapter",
      "Add members directly and keep their records current",
      "Edit the chapter profile and contact details",
      "Submit activity reports for the chapter",
      "Invite members to their own chapter",
    ],
    cannot: [
      "See or manage any other chapter",
      "Create new chapters or change network settings",
      "Read the audit trail or export the full member list",
    ],
  },
};

export default async function RolesPage() {
  const viewer = await requireUser();
  const order: Role[] = ["AGID_ADMIN", "COMM_MANAGER", "CHAPTER_ADMIN"];

  return (
    <div className="space-y-6">
      <header className="rise">
        <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-600 uppercase">
          Access model
        </p>
        <h1 className="mt-2 text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-navy-900">
          Roles and access
        </h1>
        <p className="mt-2 max-w-[680px] text-[13.5px] leading-[1.8] text-ink-500">
          Every GLANCE account carries exactly one role. The role decides which
          pages open after sign in and which records the account can change.
          Nothing else needs to be configured per person.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {order.map((role, index) => {
          const detail = DETAIL[role]!
          const meta = ROLES[role];
          const isYou = viewer.role === role;

          return (
            <section
              key={role}
              className={`rise rounded-xl border bg-white p-5 ${
                isYou ? "border-gold-300 ring-1 ring-gold-200" : "border-line"
              }`}
              style={{ "--d": `${80 + index * 70}ms` } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-semibold text-navy-900">
                    {meta.label}
                  </h2>
                  <p className="mt-0.5 text-[11.5px] text-ink-400">
                    {detail.scope}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge tone={detail.tone as "navy"}>{meta.label}</Badge>
                  {isYou ? (
                    <span className="text-[10px] font-bold tracking-[0.12em] text-gold-600 uppercase">
                      Your role
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 text-[12.5px] leading-[1.75] text-ink-600">
                {meta.description}
              </p>

              <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-700 uppercase">
                    Can do
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {detail.can.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[12px] leading-[1.6] text-ink-600"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-emerald-500"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.12em] text-ink-400 uppercase">
                    Cannot do
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {detail.cannot.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[12px] leading-[1.6] text-ink-500"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ink-300"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="rise rounded-xl border border-line bg-navy-50/50 p-5">
        <h2 className="text-[15px] font-bold text-navy-900">
          Changing someone&apos;s role
        </h2>
        <p className="mt-1.5 max-w-[720px] text-[12.5px] leading-[1.75] text-ink-600">
          Roles are changed by the GLANCE team from the member record. A
          member moving to another campus keeps one account; the chapter on the
          record is updated instead of creating a second login.
        </p>
        <Link
          href="/portal/members"
          className="mt-3 inline-flex text-[12px] font-bold text-navy-900 underline decoration-gold-400 decoration-2 underline-offset-4"
        >
          Open member records
        </Link>
      </section>
    </div>
  );
}
