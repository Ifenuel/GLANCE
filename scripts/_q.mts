import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
// Remove the duplicate YouTube entry (same providerId 7QL_ywcnh7E), keep the seed-managed one.
const del = await db.mediaAsset.deleteMany({ where: { publicId: "gallery_leading_at_27_film" } });
console.log("deleted dup youtube:", del.count);
// Report remaining old LINK-provider images (potential broken refs)
const links = await db.mediaAsset.findMany({ where: { provider: "LINK", kind: "IMAGE" }, select: { publicId: true, secureUrl: true, title: true } });
console.log("legacy LINK images:", JSON.stringify(links, null, 1));
await db.$disconnect();
