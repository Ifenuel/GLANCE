import Link from "next/link";
import { requireRole } from "@/server/auth";
import { ChapterForm } from "@/components/portal/forms";

/**
 * The network officer's "add a newly registered chapter" screen. Reached from
 * the dashboard quick action and the chapters toolbar. The unique chapter code
 * is issued on creation, so this form collects only the descriptive fields.
 */
export default async function NewChapterPage() {
  await requireRole(["SUPER_ADMIN", "AGID_ADMIN"]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/chapters"
          className="text-[12px] font-semibold text-navy-700 underline underline-offset-4 hover:text-navy-900"
        >
          ← Back to chapters
        </Link>
        <h1 className="mt-3 text-[26px] leading-tight font-extrabold tracking-tight text-navy-900">
          Register a new chapter
        </h1>
        <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-ink-500">
          Add a chapter that has just been registered on a campus. The unique
          chapter code is generated automatically and shown on the chapter page
          once it is created.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 lg:p-8">
        <ChapterForm />
      </div>
    </div>
  );
}
