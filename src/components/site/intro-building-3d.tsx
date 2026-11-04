"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

/**
 * The GLANCE House, rebuilt as a real-time 3D building.
 *
 * A glass headquarter tower on a stone podium with an annex wing, golden-hour
 * lighting, thousands of individually lit office windows and the movement's
 * gold rooftop sign. The visitor walks around it by hand and it keeps a slow
 * carousel turn on its own — the same "six doors, one look around" idea, now
 * with a building that behaves like architecture instead of a CSS trick.
 *
 * Everything is generated procedurally (canvas facade textures, no HDRI
 * downloads, no external models) so the film plays offline and costs nothing
 * but a one-off dynamic chunk hidden behind the welcome film itself.
 */

/* Deterministic PRNG so the lit-window pattern is stable across remounts. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Facade texture: a dark curtain-wall grid where a share of offices glows. */
function makeFacadeTexture(
  cols: number,
  rows: number,
  seed: number,
  litShare: number,
  cellSize = 40,
) {
  const cell = cellSize;
  const gap = Math.max(3, Math.round(cell * 0.18));
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = "#081222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * cell + gap;
      const y = row * cell + gap;
      const w = cell - gap * 2;
      const h = cell - gap * 2;

      if (rand() < litShare) {
        // A lit office: warm gold with a little per-window temperature.
        const heat = 0.85 + rand() * 0.15;
        ctx.fillStyle = `rgba(255, ${Math.round(182 + rand() * 36)}, ${Math.round(72 + rand() * 36)}, ${heat})`;
      } else {
        // Dark glazing with a faint blue-green variance, like dusk glass.
        const shade = 18 + Math.floor(rand() * 16);
        ctx.fillStyle = `rgb(${shade + 10}, ${shade + 26}, ${shade + 52})`;
      }
      ctx.fillRect(x, y, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Rooftop sign texture — "GLANCE" set in the brand gold on deep navy. */
function makeSignTexture(small = false) {
  const canvas = document.createElement("canvas");
  canvas.width = small ? 512 : 1024;
  canvas.height = small ? 144 : 288;
  const scale = canvas.width / 1024;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04122a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gold frame.
  ctx.strokeStyle = "#EAAE14";
  ctx.lineWidth = 10 * scale;
  ctx.strokeRect(18 * scale, 18 * scale, canvas.width - 36 * scale, canvas.height - 36 * scale);

  // Wordmark.
  ctx.fillStyle = "#F5C15C";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(120 * scale)}px Georgia, 'Times New Roman', serif`;
  ctx.fillText("G L A N C E", canvas.width / 2, canvas.height / 2 - 14 * scale);

  // Subline.
  ctx.fillStyle = "rgba(245,193,92,0.62)";
  ctx.font = `700 ${Math.round(34 * scale)}px Arial, sans-serif`;
  ctx.fillText("HOUSE OF THE MOVEMENT", canvas.width / 2, canvas.height / 2 + 86 * scale);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Gold campus plaque — one chapter of the GLANCE story per building. */
function makePlaqueTexture(title: string, subline: string, small = false) {
  const canvas = document.createElement("canvas");
  canvas.width = small ? 384 : 640;
  canvas.height = small ? 240 : 400;
  const scale = canvas.width / 640;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04122a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#EAAE14";
  ctx.lineWidth = 10 * scale;
  ctx.strokeRect(14 * scale, 14 * scale, canvas.width - 28 * scale, canvas.height - 28 * scale);
  ctx.lineWidth = 3 * scale;
  ctx.strokeRect(38 * scale, 38 * scale, canvas.width - 76 * scale, canvas.height - 76 * scale);

  // Wrap the title onto at most two discipline-friendly lines.
  const words = title.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = (line + " " + word).trim();
    if (candidate.length > 14 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#F5C15C";
  ctx.font = `900 ${Math.round(56 * scale)}px Georgia, 'Times New Roman', serif`;
  const titleTop = (lines.length > 1 ? 138 : 168) * scale;
  lines.forEach((text, i) => {
    ctx.fillText(text, canvas.width / 2, titleTop + i * 62 * scale);
  });

  ctx.fillStyle = "rgba(245,193,92,0.8)";
  ctx.font = `700 ${Math.round(28 * scale)}px Arial, sans-serif`;
  ctx.fillText(
    subline.toUpperCase(),
    canvas.width / 2,
    (lines.length > 1 ? titleTop + lines.length * 62 * scale : titleTop + 52 * scale) + 24 * scale,
  );

  ctx.fillStyle = "#EAAE14";
  ctx.fillRect(canvas.width / 2 - 52 * scale, 330 * scale, 104 * scale, 5 * scale);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * The “LEADING AT 27” plaque carries the real book cover instead of words.
 * The canvas paints the frame and title straight away; when the book image
 * arrives (a few kilobytes of WebP, usually already cached from the homepage
 * hero) it is drawn in and the texture refreshes in place.
 */
function makeBookPlaqueTexture(small = false) {
  const canvas = document.createElement("canvas");
  canvas.width = small ? 384 : 640;
  canvas.height = small ? 240 : 400;
  const scale = canvas.width / 640;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04122a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#EAAE14";
  ctx.lineWidth = 10 * scale;
  ctx.strokeRect(14 * scale, 14 * scale, canvas.width - 28 * scale, canvas.height - 28 * scale);
  ctx.lineWidth = 3 * scale;
  ctx.strokeRect(38 * scale, 38 * scale, canvas.width - 76 * scale, canvas.height - 76 * scale);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#F5C15C";
  ctx.font = `900 ${Math.round(50 * scale)}px Georgia, 'Times New Roman', serif`;
  ctx.fillText("LEADING AT 27", canvas.width / 2, 92 * scale);

  ctx.fillStyle = "rgba(245,193,92,0.8)";
  ctx.font = `700 ${Math.round(24 * scale)}px Arial, sans-serif`;
  ctx.fillText(
    "THE BOOK BEHIND THE CLUB",
    canvas.width / 2,
    canvas.height - 42 * scale,
  );

  const drawBook = (img: HTMLImageElement) => {
    try {
      const innerTop = 136 * scale;
      const innerBottom = canvas.height - 64 * scale;
      const innerW = canvas.width - 100 * scale;
      const innerH = innerBottom - innerTop;
      const fit = Math.min(innerW / img.width, innerH / img.height);
      const w = img.width * fit;
      const h = img.height * fit;
      // A whisper of plate behind it so the cover edge reads cleanly on dusk navy.
      ctx.fillStyle = "#f8f6f2";
      ctx.fillRect(
        canvas.width / 2 - w / 2 - 7 * scale,
        innerTop - 7 * scale,
        w + 14 * scale,
        h + 14 * scale,
      );
      ctx.drawImage(img, canvas.width / 2 - w / 2, innerTop, w, h);
    } catch {
      // If drawing fails, the plaque keeps its title-only layout.
    }
    texture.needsUpdate = true;
  };

  const img = new Image();
  img.onload = () => drawBook(img);
  img.src = "/media/leading-at-27-book.webp";
  if (img.complete && img.naturalWidth > 0) drawBook(img);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

const STONE = "#183560";
const STONE_LIGHT = "#173a68";
const GOLD_TRIM = { color: "#c98f10", emissive: "#EAAE14", emissiveIntensity: 0.28, metalness: 0.85, roughness: 0.35 } as const;

/** One of the six campus buildings — varied silhouettes around the plaza. */
function MiniBuilding({ kind, low }: { kind: (typeof STATIONS)[number]["kind"]; low: boolean }) {
  return (
    <group position={[0, 0, -2.1]}>
      {kind === "rotunda" && (
        <group>
          <mesh position={[0, 1.05, 0]} castShadow>
            <cylinderGeometry args={[0.85, 0.92, 1.6, 12]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0, 2.15, 0]} castShadow>
            <coneGeometry args={[0.95, 0.65, 12]} />
            <meshStandardMaterial {...GOLD_TRIM} />
          </mesh>
        </group>
      )}
      {kind === "hall" && (
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <boxGeometry args={[1.7, 1.3, 1.35]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.8, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.15, 1, 0.85]} castShadow>
            <coneGeometry args={[1.05, 0.65, 4]} />
            <meshStandardMaterial {...GOLD_TRIM} />
          </mesh>
        </group>
      )}
      {kind === "dome" && (
        <group>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[1.5, 1.1, 1.15]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.32, 0]} castShadow>
            <sphereGeometry args={[0.72, low ? 12 : 20, low ? 8 : 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial {...GOLD_TRIM} />
          </mesh>
        </group>
      )}
      {kind === "arch" && (
        <group>
          <mesh position={[-0.72, 1.05, 0]} castShadow>
            <boxGeometry args={[0.28, 2.1, 0.32]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0.72, 1.05, 0]} castShadow>
            <boxGeometry args={[0.28, 2.1, 0.32]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <boxGeometry args={[1.95, 0.32, 0.4]} />
            <meshStandardMaterial {...GOLD_TRIM} />
          </mesh>
          <mesh position={[0, 0.75, 0.02]}>
            <planeGeometry args={[1.05, 1.05]} />
            <meshStandardMaterial color="#FFB43D" emissive="#FFB43D" emissiveIntensity={0.75} />
          </mesh>
        </group>
      )}
      {kind === "stack" && (
        <group>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[1.55, 0.5, 1.2]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[-0.08, 0.75, 0.05]} castShadow>
            <boxGeometry args={[1.35, 0.45, 1.05]} />
            <meshStandardMaterial color={STONE} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0.06, 1.15, 0]} castShadow>
            <boxGeometry args={[1.2, 0.42, 0.95]} />
            <meshStandardMaterial {...GOLD_TRIM} />
          </mesh>
        </group>
      )}
      {kind === "gate" && (
        <group>
          <mesh position={[-0.62, 1.0, 0]} castShadow>
            <boxGeometry args={[0.34, 2.0, 0.34]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0.62, 1.0, 0]} castShadow>
            <boxGeometry args={[0.34, 2.0, 0.34]} />
            <meshStandardMaterial color={STONE_LIGHT} metalness={0.35} roughness={0.65} />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <boxGeometry args={[1.75, 0.26, 0.42]} />
            <meshStandardMaterial {...GOLD_TRIM} />
          </mesh>
          <mesh position={[0, 0.62, 0.02]}>
            <planeGeometry args={[0.95, 1.15]} />
            <meshStandardMaterial color="#FFB43D" emissive="#FFB43D" emissiveIntensity={0.85} /></mesh>
        </group>
      )}
    </group>
  );
}

/** One story stop: plinth, readable gold plaque, its campus building. */
function StationBuilding({
  angle,
  index,
  x,
  z,
  low,
}: {
  angle: number;
  index: number;
  x: number;
  z: number;
  low: boolean;
}) {
  const station = STATIONS[index];
  const plaque = useMemo(
    () =>
      station.kind === "arch"
        ? makeBookPlaqueTexture(low)
        : makePlaqueTexture(station.title, station.subline, low),
    [station.title, station.subline, station.kind, low],
  );

  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      {/* Stone plinth the whole stop stands on. */}
      <mesh position={[0, 0.28, -1.15]} castShadow>
        <boxGeometry args={[2.5, 0.56, 3.6]} />
        <meshStandardMaterial color={STONE} emissive="#274b82" emissiveIntensity={0.22} metalness={0.3} roughness={0.72} />
      </mesh>

      {/* Plaque posts + the story plaque facing the visitor. */}
      <mesh position={[-0.78, 0.85, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.85, 8]} />
        <meshStandardMaterial color="#c98f10" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0.78, 0.85, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.85, 8]} />
        <meshStandardMaterial color="#c98f10" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[1.9, 1.25, 0.07]} />
        <meshStandardMaterial
          map={plaque}
          emissive="#ffffff"
          emissiveMap={plaque}
          emissiveIntensity={0.85}
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>

      <MiniBuilding kind={station.kind} low={low} />
    </group>
  );
}

/** A campus ring: six story stops facing outward, lamps and trees between. */
function CampusRing({ low }: { low: boolean }) {
  const stations = useMemo(() => STATIONS, []);
  const trees = useMemo(() => {
    const rand = mulberry32(91);
    const count = low ? 6 : 10;
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + 0.28 + rand() * 0.14,
      radius: 6.5 + rand() * 0.9,
      green: rand() > 0.5,
    }));
  }, [low]);

  return (
    <group>
      {stations.map((station, i) => {
        const angle = (i / stations.length) * Math.PI * 2;
        const x = Math.sin(angle) * 8.9;
        const z = Math.cos(angle) * 8.9;
        return (
          <StationBuilding key={station.title} angle={angle} index={i} x={x} z={z} low={low} />
        );
      })}

      {/* Warm campus lamps in the gaps between stations. */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = Math.sin(angle) * 10.8;
        const z = Math.cos(angle) * 10.8;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 2.2, 8]} />
              <meshStandardMaterial color="#1b3a68" metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.3, 0]}>
              <sphereGeometry args={[0.13, 12, 12]} />
              <meshStandardMaterial color="#FFC24D" emissive="#FFC24D" emissiveIntensity={1.8} />
            </mesh>
          </group>
        );
      })}

      {/* Campus greenery. */}
      {trees.map((tree, i) => (
        <group key={i} position={[Math.sin(tree.angle) * tree.radius, 0, Math.cos(tree.angle) * tree.radius]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 0.55, 8]} />
            <meshStandardMaterial color="#3a2a18" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <sphereGeometry args={[0.5, low ? 7 : 10, low ? 7 : 10]} />
            <meshStandardMaterial color={tree.green ? "#1c4f38" : "#17412e"} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.28, 0]} castShadow>
            <sphereGeometry args={[0.34, 10, 10]} />
            <meshStandardMaterial color={tree.green ? "#256550" : "#1d5238"} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The six parts of GLANCE the visitor meets on one walk around the campus. */
const STATIONS = [
  { title: "GLANCE LEADERSHIP", subline: "Character first, always", kind: "rotunda" as const },
  { title: "CIVIC ENGAGEMENT", subline: "See how Nigeria truly works", kind: "hall" as const },
  { title: "MENTORSHIP", subline: "Guides who lead ahead of you", kind: "dome" as const },
  { title: "COMMUNITY IMPACT", subline: "Real projects, real people", kind: "stack" as const },
  { title: "LEADING AT 27", subline: "The book behind the club", kind: "arch" as const },
  { title: "JOIN GLANCE", subline: "Your campus, your chapter", kind: "gate" as const },
];

/** The tower block with its own facade + the rooftop crown, sign and beacon. */
function HeadquarterTower({
  position,
  size,
  low,
}: {
  position: [number, number, number];
  size: [number, number, number];
  low: boolean;
}) {
  const [width, height, depth] = size;
  const facade = useMemo(
    () => makeFacadeTexture(low ? 5 : 8, low ? 11 : 17, 7, 0.42, low ? 24 : 40),
    [low],
  );
  const sign = useMemo(() => makeSignTexture(low), [low]);
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const material = beaconRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 3.2) * 1.1;
    }
  });

  const roofY = position[1] + height / 2;

  return (
    <group>
      {/* Glass body: the canvas texture doubles as emissive map, so only the
          lit offices glow while the dusk glazing stays deep navy. A plain box
          keeps one clean texture per face (RoundedBox UVs smear the facade). */}
      <mesh position={position} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          map={facade}
          emissive="#ffffff"
          emissiveMap={facade}
          emissiveIntensity={1.5}
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>

      {/* Gold cornice at the parapet. */}
      <mesh position={[position[0], roofY + 0.09, position[2]]}>
        <boxGeometry args={[width + 0.28, 0.18, depth + 0.28]} />
        <meshStandardMaterial
          color="#c98f10"
          emissive="#EAAE14"
          emissiveIntensity={0.35}
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>

      {/* Penthouse block set back on the roof. */}
      <mesh position={[position[0], roofY + 0.42, position[2] - 0.3]}>
        <boxGeometry args={[width * 0.4, 0.5, depth * 0.5]} />
        <meshStandardMaterial color="#0d2a52" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Antenna + blinking gold beacon. */}
      <mesh position={[position[0] + 0.9, roofY + 1.35, position[2] + 0.7]}>
        <cylinderGeometry args={[0.025, 0.025, 1.5, 8]} />
        <meshStandardMaterial color="#1b3a68" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh ref={beaconRef} position={[position[0] + 0.9, roofY + 2.14, position[2] + 0.7]}>
        <sphereGeometry args={[0.075, low ? 8 : 16, low ? 8 : 16]} />
        <meshStandardMaterial
          color="#FB4A3C"
          emissive="#FFC24D"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* The movement's rooftop sign — faces the street and the back side so
          half the walk-around always carries the wordmark. */}
      {[depth / 2 + 0.06, -(depth / 2 + 0.06)].map((z, i) => (
        <mesh
          key={i}
          position={[position[0], roofY - 0.72, position[2] + z]}
          rotation={[0, z < 0 ? Math.PI : 0, 0]}
        >
          <planeGeometry args={[width * 0.92, (width * 0.92 * 288) / 1024]} />
          <meshStandardMaterial
            map={sign}
            emissive="#ffffff"
            emissiveMap={sign}
            emissiveIntensity={0.55}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

/** A shorter annex block with denser, quieter windows. */
function AnnexTower({
  position,
  size,
  low,
}: {
  position: [number, number, number];
  size: [number, number, number];
  low: boolean;
}) {
  const facade = useMemo(
    () => makeFacadeTexture(low ? 4 : 6, low ? 7 : 11, 23, 0.34, low ? 24 : 40),
    [low],
  );
  const [width, height, depth] = size;
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        map={facade}
        emissive="#ffffff"
        emissiveMap={facade}
        emissiveIntensity={1.25}
        metalness={0.2}
        roughness={0.55}
      />
    </mesh>
  );
}

/** Stone podium with a gold entrance canopy and a warm doorway glow. */
function Podium({ size, low }: { size: [number, number, number]; low: boolean }) {
  const [width, height, depth] = size;
  return (
    <group>
      <RoundedBox
        args={[width, height, depth]}
        radius={0.1}
        smoothness={low ? 2 : 3}
        position={[0, height / 2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#122c52" metalness={0.35} roughness={0.75} />
      </RoundedBox>

      {/* Gold string course around the podium top. */}
      <mesh position={[0, height - 0.02, 0]}>
        <boxGeometry args={[width + 0.16, 0.08, depth + 0.16]} />
        <meshStandardMaterial
          color="#a97b0d"
          emissive="#EAAE14"
          emissiveIntensity={0.25}
          metalness={0.8}
          roughness={0.35}
        />
      </mesh>

      {/* Entrance canopy + glow on the facing side. */}
      <mesh position={[0, height + 0.5, depth / 2 - 0.2]}>
        <boxGeometry args={[2.6, 0.09, 1.3]} />
        <meshStandardMaterial
          color="#EAAE14"
          emissive="#EAAE14"
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, height * 0.45, depth / 2 + 0.01]}>
        <planeGeometry args={[1.7, 0.95]} />
        <meshStandardMaterial
          color="#FFB43D"
          emissive="#FFB43D"
          emissiveIntensity={0.85}
        />
      </mesh>
    </group>
  );
}

/** Ground disc + the standing light pool the film already sells. */
function Ground({ low }: { low: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[34, low ? 32 : 64]} />
        <meshStandardMaterial color="#030d1e" metalness={0.55} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.5, low ? 24 : 48]} />
        <meshBasicMaterial color="#EAAE14" transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

/** Pull the camera back on narrow viewports so the full tower stays in frame. */
function CameraRig() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const distance = aspect < 0.9 ? 25 : aspect < 1.6 ? 22.5 : 19.5;
    camera.position.set(0, 5.6, distance);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

function BuildingScene({ low }: { low: boolean }) {
  return (
    <group>
      <Ground low={low} />
      <Podium size={[7.4, 1.5, 6.2]} low={low} />
      {/* The GLANCE headquarters at the centre of its own campus. */}
      <HeadquarterTower position={[0.6, 4.9, -0.4]} size={[3.3, 6.8, 3.3]} low={low} />
      <AnnexTower position={[-2.5, 3.8, 0.9]} size={[2.2, 4.6, 2.2]} low={low} />
      {/* Six campus stops tell the GLANCE story on one walk round. */}
      <CampusRing low={low} />
      {/* Contact shadows re-render the whole scene every frame — too costly on
          a phone GPU. A soft painted pool gives the same grounding for free. */}
      {low ? (
        <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7.2, 24]} />
          <meshBasicMaterial color="#01060f" transparent opacity={0.45} />
        </mesh>
      ) : (
        <ContactShadows
          position={[0, 0.012, 0]}
          scale={30}
          blur={2.6}
          far={9}
          opacity={0.5}
          color="#01060f"
        />
      )}
    </group>
  );
}

/**
 * Phones get a deliberately lighter renderer: half the pixel ratio, no MSAA,
 * no contact shadows, smaller generated textures and cheaper geometry. The
 * scene looks the same; it just stops asking a mobile GPU for desktop work.
 */
function prefersLighterScene() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const narrow = window.matchMedia?.("(max-width: 820px)").matches ?? false;
  // WebKit on macOS, iOS and iPadOS is by far the slowest WebGL engine at
  // this scene — iPads even advertise 8 cores, so asking about hardware is
  // meaningless there. Every touch device and every Safari build gets the
  // lightweight tier up front; the frame watchdog below adds real proof.
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrom(e|ium)|Edg|OPR|Firefox/.test(ua);
  return narrow || coarse || isSafari;
}

/**
 * Real proof the guesswork can miss: while the heavy tier runs, this watches
 * the frame clock and calls for the lightweight tier once measured frames
 * say the device cannot hold roughly 30fps. Slow devices then drop to the
 * smooth tier within the first couple of seconds, whatever browser they are.
 */
function FrameWatchdog({ onSlow }: { onSlow: () => void }) {
  const frames = useRef(0);
  const started = useRef<number | null>(null);
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) return;
    frames.current += 1;
    if (started.current === null) started.current = performance.now();
    const elapsed = performance.now() - started.current;
    if (elapsed < 2500) return;
    reported.current = true;
    const fps = (frames.current * 1000) / elapsed;
    if (fps < 28) onSlow();
  });

  return null;
}

export function IntroBuildingScene() {
  // Decide the tier on the very first client render, not after an effect —
  // a phone must never pay for one frame of the heavy renderer.
  const [low, setLow] = useState(prefersLighterScene);

  return (
    <Canvas
      camera={{ position: [0, 5.6, 22], fov: 34 }}
      dpr={low ? 1 : [1, 1.75]}
      gl={{
        antialias: !low,
        alpha: true,
        powerPreference: low ? "default" : "high-performance",
        precision: low ? "mediump" : "highp",
      }}
      style={{ position: "absolute", inset: 0 }}
    >
           <fog attach="fog" args={["#030d1e", 34, 82]} />

      {/* Golden-hour key light from the front-left, cool dusk fill behind. */}
      <directionalLight
        position={[-6, 7, 8]}
        intensity={2.4}
        color="#ffd9a0"
      />
      <directionalLight position={[7, 4, -6]} intensity={0.7} color="#7ea2ff" />
      <hemisphereLight
        args={["#27406e", "#050b16", 0.55]}
      />
      <pointLight
        position={[0, 2.4, 7.5]}
        intensity={9}
        distance={14}
        color="#ffb43d"
      />

      <CameraRig />
      <BuildingScene low={low} />
      {!low && <FrameWatchdog onSlow={() => setLow(true)} />}

      {/* Procedural environment: glass picks up warm streets and cool sky
          without downloading any HDRI. */}
      <Environment resolution={low ? 64 : 256}>
        <Lightformer
          intensity={2.2}
          color="#ffd9a0"
          position={[-4, 5, 6]}
          scale={[8, 3, 1]}
        />
        <Lightformer
          intensity={0.9}
          color="#9db8ff"
          position={[0, 4, -7]}
          scale={[10, 4, 1]}
        />
        {low ? null : (
          <Lightformer
            intensity={1.1}
            color="#EAAE14"
            position={[6, 1.5, 2]}
            scale={[3, 1.4, 1]}
          />
        )}
      </Environment>

      {/* The visitor walks round the building; it keeps turning on its own. */}
      <OrbitControls
        makeDefault
        target={[0, 3.2, 0]}
        autoRotate
        autoRotateSpeed={1.05}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.95}
        maxPolarAngle={1.45}
      />
    </Canvas>
  );
}
