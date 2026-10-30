import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { buildUploadSignature, cloudinaryConfigured } from "@/server/cloudinary";

type Scope = "chapter-logo" | "member-avatar" | "gallery-media";

/**
 * Issues a short-lived signature so an authenticated administrator can upload
 * directly to Cloudinary. The folder and public ID are derived on the server and
 * bound to the caller, so a client cannot write outside its own scope.
 */
export async function POST(request: Request) {
  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Media storage is not configured on this environment." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { scope?: Scope };
  const scope: Scope =
    body.scope === "member-avatar"
      ? "member-avatar"
      : body.scope === "gallery-media"
        ? "gallery-media"
        : "chapter-logo";

  if (
    scope !== "gallery-media" &&
    user.role !== "CHAPTER_ADMIN" &&
    user.role !== "AGID_ADMIN"
  ) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  if (scope === "member-avatar" && !user.profile) {
    return NextResponse.json({ error: "No member record." }, { status: 403 });
  }

  if (
    scope === "gallery-media" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "AGID_ADMIN" &&
    user.role !== "COMM_MANAGER"
  ) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const ownerKey =
    scope === "member-avatar"
      ? user.profile!.id
      : scope === "chapter-logo"
        ? (user.chapterId ?? `agid-${user.id}`)
        : `media-${user.id}`;

  const signature = buildUploadSignature({ scope, ownerKey });
  if (!signature) {
    return NextResponse.json(
      { error: "Media storage is not configured on this environment." },
      { status: 503 },
    );
  }

  return NextResponse.json(signature, {
    headers: { "Cache-Control": "no-store" },
  });
}
