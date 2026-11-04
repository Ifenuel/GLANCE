import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { buildUploadSignature, cloudinaryConfigured } from "@/server/cloudinary";

type Scope =
  | "chapter-logo"
  | "member-avatar"
  | "gallery-media"
  | "post-cover"
  | "event-video"
  | "report-media";

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
  const kind: "image" | "video" = body.scope === "event-video" ? "video" : "image";
  const scope: Scope =
    body.scope === "member-avatar"
      ? "member-avatar"
      : body.scope === "gallery-media"
        ? "gallery-media"
        : body.scope === "post-cover"
          ? "post-cover"
          : body.scope === "event-video"
            ? "event-video"
            : body.scope === "report-media"
              ? "report-media"
              : "chapter-logo";

  // Every signed-in account may replace its own profile photo — staff carry
  // theirs on the account, members on the member record — so member-avatar is
  // the one scope never gated by role.
  if (
    scope !== "gallery-media" &&
    scope !== "post-cover" &&
    scope !== "member-avatar" &&
    scope !== "report-media" &&
    user.role !== "CHAPTER_ADMIN" &&
    user.role !== "AGID_ADMIN"
  ) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  // Story covers are CMS work: the same people who can publish a story can
  // give it an uploaded cover image.
  if (
    scope === "post-cover" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "AGID_ADMIN" &&
    user.role !== "COMM_MANAGER"
  ) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  // The shared media gallery is a CMS surface as well.
  if (
    scope === "gallery-media" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "AGID_ADMIN" &&
    user.role !== "COMM_MANAGER"
  ) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  // Event video teasers belong to whoever manages events.
  const canManageEvents =
    user.role === "SUPER_ADMIN" || user.role === "AGID_ADMIN";
  if (scope === "event-video" && !canManageEvents) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const ownerKey =
    scope === "member-avatar"
      ? (user.profile?.id ?? user.id)
      : scope === "chapter-logo"
        ? (user.chapterId ?? `agid-${user.id}`)
        : scope === "post-cover"
          ? `post-${user.id}`
          : scope === "event-video"
            ? `event-${user.id}`
            : scope === "report-media"
              ? (user.chapterId ?? `report-${user.id}`)
              : `media-${user.id}`;

  const signature = buildUploadSignature({ scope, ownerKey, kind });
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
