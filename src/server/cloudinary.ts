import "server-only";

import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
  return true;
}

export function cloudinaryConfigured() {
  return ensureConfigured();
}

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
  uploadUrl: string;
  maxBytes: number;
};

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Builds a short-lived signature for a browser upload. The folder and public ID
 * are always derived on the server so a client cannot write outside its scope.
 */
export function buildUploadSignature(input: {
  scope: "chapter-logo" | "member-avatar" | "post-cover" | "gallery-media";
  ownerKey: string;
}): UploadSignature | null {
  if (!ensureConfigured()) return null;

  const baseFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "glance";
  const folder = `${baseFolder}/${input.scope}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${input.ownerKey}-${timestamp}`;

  const signature = cloudinary.utils.api_sign_request(
    { folder, public_id: publicId, timestamp },
    process.env.CLOUDINARY_API_SECRET as string,
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    timestamp,
    folder,
    publicId,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    maxBytes: MAX_UPLOAD_BYTES,
  };
}

export type VerifiedAsset = {
  publicId: string;
  assetId: string | null;
  secureUrl: string;
  format: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
};

/**
 * Confirms that an upload really exists in our Cloudinary account and inside the
 * expected folder before the reference is persisted. A client-submitted URL on
 * its own is never trusted.
 */
export async function verifyUploadedAsset(input: {
  publicId: string;
  expectedFolder: string;
}): Promise<VerifiedAsset | null> {
  if (!ensureConfigured()) return null;

  const baseFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "glance";
  const expected = `${baseFolder}/${input.expectedFolder}`;
  if (!input.publicId.startsWith(`${expected}/`)) return null;

  try {
    const resource = await cloudinary.api.resource(input.publicId);
    return {
      publicId: resource.public_id,
      assetId: resource.asset_id ?? null,
      secureUrl: resource.secure_url,
      format: resource.format ?? null,
      bytes: resource.bytes ?? null,
      width: resource.width ?? null,
      height: resource.height ?? null,
    };
  } catch {
    return null;
  }
}

/** Delivery helper: transforms a stored public ID into an optimised URL. */
export function deliveryUrl(
  publicId: string | null | undefined,
  width: number,
): string | null {
  if (!publicId) return null;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;
  const transformation = `f_auto,q_auto,c_fill,w_${width}`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

export async function deleteAsset(publicId: string) {
  if (!ensureConfigured()) return false;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return true;
  } catch {
    return false;
  }
}
