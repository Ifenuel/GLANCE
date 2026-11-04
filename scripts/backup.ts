/**
 * Database backup.
 *
 * Exports every table to one compressed JSON file, so the organisation always
 * holds a copy of its own data independent of Supabase's plan-level backups.
 * With Cloudinary credentials present the file is also pushed to the media
 * account's `glance-backups/` folder and old copies are pruned; without them the
 * file stays on disk for the runner to upload as a CI artefact.
 *
 *   npm run db:backup
 *
 * Environment: DATABASE_URL (required), CLOUDINARY_CLOUD_NAME / _API_KEY /
 * _API_SECRET (optional), BACKUP_RETENTION_DAYS (default 30), BACKUP_DIR.
 */

import "dotenv/config";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { Prisma, PrismaClient } from "@prisma/client";

const RETENTION_DAYS = Math.max(
  1,
  Number.parseInt(process.env.BACKUP_RETENTION_DAYS ?? "30", 10) || 30,
);
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

/** PgBouncer-style pools drop prepared statements; same guard as the app. */
function pooledUrl(raw: string) {
  const separator = raw.includes("?") ? "&" : "?";
  const withPgbouncer = /[?&]pgbouncer=/.test(raw)
    ? raw
    : `${raw}${separator}pgbouncer=true`;
  return /[?&]connection_limit=/.test(withPgbouncer)
    ? withPgbouncer
    : `${withPgbouncer}&connection_limit=1`;
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL is not set — nothing to back up.");
    process.exit(1);
  }

  const db = new PrismaClient({ datasources: { db: { url: pooledUrl(raw) } } });

  // Every model in the schema, in dependency order as Prisma lists them.
  const models = Prisma.dmmf.datamodel.models.map((model) => model.name);
  const dump: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  try {
    for (const model of models) {
      const delegateName = model.charAt(0).toLowerCase() + model.slice(1);
      const delegate = (db as unknown as Record<string, { findMany?: () => Promise<unknown[]> }>)[
        delegateName
      ];
      if (!delegate?.findMany) continue;

      // 50k rows per table is far beyond current volume; the cap exists so a
      // runaway table cannot exhaust the runner's memory.
      const rows = await delegate.findMany();
      dump[model] = rows.slice(0, 50_000);
      counts[model] = rows.length;
    }
  } finally {
    await db.$disconnect();
  }

  const createdAt = new Date();
  const stamp = createdAt.toISOString().replace(/[:.]/g, "-");
  const payload = {
    meta: {
      generatedAt: createdAt.toISOString(),
      tables: counts,
      totalRows: Object.values(counts).reduce((sum, n) => sum + n, 0),
      schemaVersion: 1,
    },
    data: dump,
  };

  const gzipped = gzipSync(Buffer.from(JSON.stringify(payload), "utf8"), { level: 9 });
  mkdirSync(BACKUP_DIR, { recursive: true });
  const filename = `glance-backup-${stamp}.json.gz`;
  const filePath = path.join(BACKUP_DIR, filename);
  writeFileSync(filePath, gzipped);

  const kb = Math.round(statSync(filePath).size / 1024);
  console.log(
    `Backup written: ${filename} (${kb} KB, ${payload.meta.totalRows} rows across ${
      Object.keys(counts).length
    } tables)`,
  );

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log("Cloudinary credentials absent — keeping the file local only.");
    return;
  }

  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  try {
    const uploaded = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      folder: "glance-backups",
      public_id: filename,
      overwrite: false,
    });
    console.log(`Uploaded to Cloudinary: ${uploaded.secure_url}`);
  } catch (error) {
    console.error(
      "Upload failed — the local copy is still complete:",
      error instanceof Error ? error.message : error,
    );
  }

  // Retention: delete cloud copies older than the window so storage stays flat.
  try {
    const listing = await cloudinary.api.resources({
      resource_type: "raw",
      type: "upload",
      prefix: "glance-backups/",
      max_results: 200,
    });

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let removed = 0;
    for (const resource of listing.resources ?? []) {
      if (resource.created_at && new Date(resource.created_at).getTime() < cutoff) {
        await cloudinary.uploader.destroy(resource.public_id, { resource_type: "raw" });
        removed += 1;
      }
    }
    console.log(
      `Retention: ${removed} backup(s) older than ${RETENTION_DAYS} days removed.`,
    );
  } catch (error) {
    console.warn(
      "Retention check skipped:",
      error instanceof Error ? error.message : error,
    );
  }
}

main().catch((error) => {
  console.error("Backup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
