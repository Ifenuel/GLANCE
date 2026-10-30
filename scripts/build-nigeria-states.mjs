/**
 * Builds src/components/portal/ng-states.json from real geoBoundaries ADM-1
 * (Nigeria state) polygons.
 *
 * - Projects lon/lat with Web Mercator so shapes are correct on screen.
 * - Simplifies each ring with Douglas-Peucker so the JSON stays small.
 * - Normalizes names to the canonical list used by the app ("FCT",
 *   "Akwa Ibom", no trailing "State").
 *
 * Usage: node scripts/build-nigeria-states.mjs
 * Source: .tmp/nga-simplified.geojson (geoBoundaries gbOpen NGA ADM1)
 */

import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(".tmp/nga-simplified.geojson");
const OUT = path.resolve("src/components/portal/ng-states.json");

const NAME_OVERRIDES = {
  "Abuja Federal Capital Territory": "Federal Capital Territory",
};

// Standard 2-letter-ish state codes.
const ABBRS = {
  Abia: "AB", Adamawa: "AD", Akwa_Ibom: "AK", Anambra: "AN", Bauchi: "BA",
  Bayelsa: "BY", Benue: "BE", Borno: "BO", Cross_River: "CR", Delta: "DE",
  Ebonyi: "EB", Edo: "ED", Ekiti: "EK", Enugu: "EN", FCT: "FC", Gombe: "GO",
  Imo: "IM", Jigawa: "JI", Kaduna: "KD", Kano: "KN", Katsina: "KT",
  Kebbi: "KE", Kogi: "KO", Kwara: "KW", Lagos: "LA", Nasarawa: "NA",
  Niger: "NI", Ogun: "OG", Ondo: "ON", Osun: "OS", Oyo: "OY", Plateau: "PL",
  Rivers: "RI", Sokoto: "SO", Taraba: "TA", Yobe: "YO", Zamfara: "ZA",
};

const geo = JSON.parse(fs.readFileSync(SRC, "utf8"));

// ---- projection ------------------------------------------------------------
const R = 6378137;
const D2R = Math.PI / 180;
const proj = ([lon, lat]) => [lon * D2R * R, Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2)) * R];

// ---- Douglas-Peucker -------------------------------------------------------
function sqSegDist(p, a, b) {
  let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 0 && t < 1) { x += t * dx; y += t * dy; }
  }
  dx = p[0] - x; dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyDP(points, eps, first, last, keep) {
  let maxDist = eps, index = -1;
  for (let i = first + 1; i < last; i++) {
    const d = sqSegDist(points[i], points[first], points[last]);
    if (d > maxDist) { maxDist = d; index = i; }
  }
  if (index !== -1) {
    keep.add(index);
    simplifyDP(points, eps, first, index, keep);
    simplifyDP(points, eps, index, last, keep);
  }
}

function simplify(points, eps) {
  const last = points.length - 1;
  if (last < 2) return points;
  const keep = new Set([0, last]);
  simplifyDP(points, eps, 0, last, keep);
  return points.filter((_, i) => keep.has(i));
}

const rnd = (v) => Math.round(v * 10) / 10;

// First pass: project everything, find the national span for a shared epsilon.
const projected = geo.features.map((f) => {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys.map((poly) => poly[0].map(proj));
});

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const polys of projected)
  for (const ring of polys)
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
const span = Math.max(maxX - minX, maxY - minY);
// Project onto a compact uniform 0..1000 grid to keep the JSON small.
const K = 1000 / span;
const sx = (x) => (x - minX) * K;
const sy = (y) => (y - minY) * K;
const EPS = span * 0.0012; // ≈0.12% of the national extent → few points, right shape

const states = [];
for (let fi = 0; fi < geo.features.length; fi++) {
  const feature = geo.features[fi];
  const rawName = feature.properties.shapeName;
  let name = NAME_OVERRIDES[rawName] ?? rawName.replace(/ State$/i, "");
  const key =
    name === "Federal Capital Territory"
      ? "FCT"
      : name.includes(" ")
        ? name.replace(/ /g, "_")
        : name;
  const abbr = ABBRS[key] ?? null;
  if (!abbr) {
    console.warn("No abbr for", rawName, "→", name);
    continue;
  }
  if (states.some((s) => s.n === name)) {
    console.warn("Duplicate name", rawName);
    continue;
  }

  const polys = projected[fi];
  const d = polys
    .map((outer) => {
      const pts = simplify(outer, EPS).map(([x, y]) => [sx(x), sy(y)]);
      let out = "";
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        out += (i === 0 ? "M" : "L") + rnd(x) + "," + rnd(y);
      }
      return out + "Z";
    })
    .join("");
  states.push({ a: abbr, n: name, d });
}

states.sort((x, y) => x.n.localeCompare(y.n));

const data = { bbox: [0, 0, rnd(sx(maxX)), rnd(sy(maxY))], states };
fs.writeFileSync(OUT, JSON.stringify(data));
console.log(
  "Wrote", OUT, "—", states.length, "states,",
  (fs.statSync(OUT).size / 1024).toFixed(0) + "KB,",
  "eps", EPS.toFixed(0)
);
