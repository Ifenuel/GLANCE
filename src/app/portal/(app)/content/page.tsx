import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { PostForm } from "@/components/portal/forms/post-form";
import {
  deletePostAction,
  setPostPublishedAction,
} from "@/server/actions/post";

export const metadata: Metadata = {
  title: "Website Content Management | GLANCE Portal",
  description: "Publish news, impact stories and announcements to the public website.",
};

const statusStyles: Record<string, string> = {
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DRAFT: "border-line bg-white text-ink-500",
};

const categoryLabels: Record<string, string> = {
  NEWS: "News",
  STORY: "Impact story",
  ANNOUNCEMENT: "Announcement",
};

export default async function ContentCmsPage() {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN", "COMM_MANAGER"]);

  const posts = await db.post.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      authorName: true,
      excerpt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Website content</h1>
          <p className="mt-1 text-xs text-ink-500">
            Publish news, impact stories and announcements — they appear on the public
            website as soon as they are published.
          </p>
        </div>
        <Link
          href="/news"
          className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-bold text-navy-900 shadow-sm hover:bg-navy-50"
        >
          View the public news page
        </Link>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <Card className="min-w-0">
          <h3 className="border-b border-line pb-3 text-sm font-extrabold text-navy-950">
            Publish a story
          </h3>
          <div className="mt-5">
            <PostForm />
          </div>
        </Card>

        <Card className="min-w-0">
          <h3 className="border-b border-line pb-3 text-sm font-extrabold text-navy-950">
            Published and drafts ({posts.length})
          </h3>

          {posts.length === 0 ? (
            <p className="mt-5 text-[12.5px] text-ink-500">
              Nothing published yet. The public news page shows live posts from here.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {posts.map((post) => (
                <li key={post.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-gold-50 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-600">
                          {categoryLabels[post.category] ?? post.category}
                        </span>
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            statusStyles[post.status] ?? statusStyles.DRAFT
                          }`}
                        >
                          {post.status === "PUBLISHED" ? "Live on the website" : "Draft"}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-[13.5px] font-bold text-navy-900">
                        {post.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-ink-400">
                        {formatDate(post.publishedAt ?? post.createdAt)} · {post.authorName}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/news/${post.slug}`}
                        className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-navy-50"
                      >
                        View
                      </Link>
                      <form action={setPostPublishedAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <input
                          type="hidden"
                          name="published"
                          value={post.status === "PUBLISHED" ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className={
                            post.status === "PUBLISHED"
                              ? "rounded-lg border border-line bg-white px-3 py-1.5 text-[11px] font-bold text-ink-600 hover:bg-ink-50"
                              : "rounded-lg bg-navy-950 px-3 py-1.5 text-[11px] font-bold text-gold-400 hover:bg-navy-900"
                          }
                        >
                          {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
