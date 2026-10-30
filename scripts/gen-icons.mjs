/**
 * One-shot icon generator: rebuilds the favicon / app icons from the real
 * GLANCE emblem so the tab icon actually matches the logo. The emblem sits on
 * a white plate (same treatment as the site header).
 *
 *   node scripts/gen-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const EMBLEM = "public/_brand/glance-emblem.png";
const PLATE = { r: 255, g: 255, b: 255, alpha: 1 };

/** White square plate with the emblem fitted to `fill` of the plate. */
async function render(size, fill = 0.86) {
  const emblem = await sharp(EMBLEM)
    .resize({
      width: Math.round(size * fill),
      height: Math.round(size * fill),
      fit: "inside",
    })
    .png()
    .toBuffer();

  const { width: ew, height: eh } = await sharp(emblem).metadata();

  return sharp({
    create: { width: size, height: size, channels: 4, background: PLATE },
  })
    .composite([
      {
        input: emblem,
        left: Math.round((size - ew) / 2),
        top: Math.round((size - eh) / 2),
      },
    ])
    .png()
    .toBuffer();
}

// Tab icon.
writeFileSync("src/app/icon.png", await render(512));

// iOS home-screen icon (app-router convention + the public copy).
const apple = await render(180, 0.78);
writeFileSync("src/app/apple-icon.png", apple);
writeFileSync("public/apple-icon.png", apple);

// favicon.ico: PNG-in-ICO at 256px (browsers scale down fine).
const png256 = await render(256);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count
header.writeUInt8(0, 6); // width (0 = 256)
header.writeUInt8(0, 7); // height (0 = 256)
header.writeUInt8(0, 8); // palette size
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png256.length, 14); // data length
header.writeUInt32LE(22, 18); // data offset
writeFileSync("src/app/favicon.ico", Buffer.concat([header, png256]));

console.log("icons written: src/app/icon.png, public/apple-icon.png, src/app/favicon.ico");
