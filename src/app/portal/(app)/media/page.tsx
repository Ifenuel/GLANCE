import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { MediaForm } from "@/components/portal/forms/media-form";
import {
  deleteMediaAction,
  setMediaPublishedAction,
} from "@/server/actions/media";
import { Badge, EmptyState } from "@/components/ui";
import { ActionMenu } from "@/components/portal/action-menu";

export const metadata: Metadata = {
  title: "Media gallery",
  description: "Publish photos and films to the public GLANCE gallery.",
};

export default async function PortalMediaPage() {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"]);

  const items = await db.mediaAsset
    .findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        kind: true,
        providerId: true,
        secureUrl: true,
        title: true,
        caption: true,
        published: true,
        createdAt: true,
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.2em] text-gold-600 uppercase">
            Content
          </p>
          <h1 className="mt-2 text-[26px] leading-[1.2] font-extrabold tracking-[-0.02em] text-navy-900">
            Media gallery
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-500">
            Publish photos and YouTube films to the public gallery. Every item is
            contained in a fixed frame, so the page stays stable however much you
            add.
          </p>
        </div>
        <Link
          href="/gallery"
          className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-line bg-white px-4 text-[12.5px] font-bold text-navy-800 transition-colors hover:bg-navy-50"
        >
          View public gallery
        </Link>
      </div>

      {/* Explicit minmax(0,1fr) tracks instead of an implicit auto column:
          automatic tracks size to the content's max-content width, so a long
          paragraph could otherwise push the panel past the phone viewport. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">
            Add an item
          </h2>
          <p className="mt-1 text-[12px] leading-[1.7] text-ink-500">
            Photos upload straight from this device — phone gallery or laptop —
            and a link works too. Videos play inside the page from a YouTube
            link.
          </p>
          <div className="mt-5">
            <MediaForm />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-[15px] font-extrabold text-navy-900">
                Gallery items
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-400">
                {items.length} on record ·{" "}
                {items.filter((item) => item.published).length} published
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No media yet"
                description="Add your first photo or film using the form on the left. It will appear on the public gallery straight away."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-navy-50">
                    {item.kind === "VIDEO" && item.providerId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://i.ytimg.com/vi/${item.providerId}/mqdefault.jpg`}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.secureUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-bold text-navy-900">
                        {item.title ?? "Untitled"}
                      </p>
                      <Badge tone={item.kind === "VIDEO" ? "navy" : "neutral"}>
                        {item.kind === "VIDEO" ? "Video" : "Photo"}
                      </Badge>
                      <Badge tone={item.published ? "active" : "pending"}>
                        {item.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {item.caption ? (
                      <p className="mt-1 line-clamp-1 text-[12px] text-ink-500">
                        {item.caption}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <form id={`media-toggle-${item.id}`} action={setMediaPublishedAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={item.published ? "false" : "true"}
                      />
                    </form>
                    <form id={`media-delete-${item.id}`} action={deleteMediaAction}>
                      <input type="hidden" name="id" value={item.id} />
                    </form>
                    <ActionMenu
                      label={`Actions for ${item.title ?? "Untitled"}`}
                      items={[
                        {
                          kind: "submit",
                          label: item.published ? "Unpublish" : "Publish",
                          formId: `media-toggle-${item.id}`,
                        },
                        {
                          kind: "link",
                          label: "Open preview",
                          href: item.kind === "VIDEO" && item.providerId
                            ? `https://www.youtube.com/watch?v=${item.providerId}`
                            : item.secureUrl,
                        },
                        {
                          kind: "submit",
                          label: "Delete",
                          formId: `media-delete-${item.id}`,
                          danger: true,
                        },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
