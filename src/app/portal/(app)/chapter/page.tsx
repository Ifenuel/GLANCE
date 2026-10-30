import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";

/**
 * "My chapter" landing page for chapter administrators: resolves the assigned
 * chapter and forwards to its management page.
 */
export default async function MyChapterPage() {
  const user = await requireUser();
  if (!user.chapterId) redirect("/portal/profile");
  redirect(`/portal/chapters/${user.chapterId}`);
}
