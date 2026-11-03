"use client";

import { useEffect, useMemo, useRef } from "react";
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
) {
  const cell = 40;
  const gap = 7;
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
function makeSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 288;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04122a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gold frame.
  ctx.strokeStyle = "#EAAE14";
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  // Wordmark.
  ctx.fillStyle = "#F5C15C";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 120px Georgia, 'Times New Roman', serif";
  ctx.fillText("G L A N C E", canvas.width / 2, canvas.height / 2 - 14);

  // Subline.
  ctx.fillStyle = "rgba(245,193,92,0.62)";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.fillText("HOUSE OF THE MOVEMENT", canvas.width / 2, canvas.height / 2 + 86);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Gold campus plaque — one chapter of the GLANCE story per building. */
function makePlaqueTexture(title: string, subline: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#04122a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#EAAE14";
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  ctx.lineWidth = 3;
  ctx.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);

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
  ctx.font = "900 56px Georgia, 'Times New Roman', serif";
  const titleTop = lines.length > 1 ? 138 : 168;
  lines.forEach((text, i) => {
    ctx.fillText(text, canvas.width / 2, titleTop + i * 62);
  });

  ctx.fillStyle = "rgba(245,193,92,0.8)";
  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillText(
    subline.toUpperCase(),
    canvas.width / 2,
    (lines.length > 1 ? titleTop + lines.length * 62 : titleTop + 52) + 24,
  );

  ctx.fillStyle = "#EAAE14";
  ctx.fillRect(canvas.width / 2 - 52, 330, 104, 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

const STONE = "#183560";
const STONE_LIGHT = "#173a68";
const GOLD_TRIM = { color: "#c98f10", emissive: "#EAAE14", emissiveIntensity: 0.28, metalness: 0.85, roughness: 0.35 } as const;

/** One of the six campus buildings — varied silhouettes around the plaza. */
function MiniBuilding({ kind }: { kind: (typeof STATIONS)[number]["kind"] }) {
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
            <sphereGeometry args={[0.72, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
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
}: {
  angle: number;
  index: number;
  x: number;
  z: number;
}) {
  const station = STATIONS[index];
  const plaque = useMemo(
    () => makePlaqueTexture(station.title, station.subline),
    [station.title, station.subline],
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

      <MiniBuilding kind={station.kind} />
    </group>
  );
}

/** A campus ring: six story stops facing outward, lamps and trees between. */
function CampusRing() {
  const stations = useMemo(() => STATIONS, []);
  const trees = useMemo(() => {
    const rand = mulberry32(91);
    return Array.from({ length: 10 }, (_, i) => ({
      angle: (i / 10) * Math.PI * 2 + 0.28 + rand() * 0.14,
      radius: 6.5 + rand() * 0.9,
      green: rand() > 0.5,
    }));
  }, []);

  return (
    <group>
      {stations.map((station, i) => {
        const angle = (i / stations.length) * Math.PI * 2;
        const x = Math.sin(angle) * 8.9;
        const z = Math.cos(angle) * 8.9;
        return <StationBuilding key={station.title} angle={angle} index={i} x={x} z={z} />;
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
            <sphereGeometry args={[0.5, 10, 10]} />
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
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const [width, height, depth] = size;
  const facade = useMemo(
    () => makeFacadeTexture(8, 17, 7, 0.42),
    [],
  );
  const sign = useMemo(() => makeSignTexture(), []);
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
        <sphereGeometry args={[0.075, 16, 16]} />
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
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const facade = useMemo(() => makeFacadeTexture(6, 11, 23, 0.34), []);
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
function Podium({ size }: { size: [number, number, number] }) {
  const [width, height, depth] = size;
  return (
    <group>
      <RoundedBox
        args={[width, height, depth]}
        radius={0.1}
        smoothness={3}
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
function Ground() {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[34, 64]} />
        <meshStandardMaterial color="#030d1e" metalness={0.55} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.5, 48]} />
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

function BuildingScene() {
  return (
    <group>
      <Ground />
      <Podium size={[7.4, 1.5, 6.2]} />
      {/* The GLANCE headquarters at the centre of its own campus. */}
      <HeadquarterTower position={[0.6, 4.9, -0.4]} size={[3.3, 6.8, 3.3]} />
      <AnnexTower position={[-2.5, 3.8, 0.9]} size={[2.2, 4.6, 2.2]} />
      {/* Six campus stops tell the GLANCE story on one walk round. */}
      <CampusRing />
      <ContactShadows
        position={[0, 0.012, 0]}
        scale={30}
        blur={2.6}
        far={9}
        opacity={0.5}
        color="#01060f"
      />
    </group>
  );
}

export function IntroBuildingScene() {
  return (
    <Canvas
      camera={{ position: [0, 5.6, 22], fov: 34 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
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
      <BuildingScene />

      {/* Procedural environment: glass picks up warm streets and cool sky
          without downloading any HDRI. */}
      <Environment resolution={256}>
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
        <Lightformer
          intensity={1.1}
          color="#EAAE14"
          position={[6, 1.5, 2]}
          scale={[3, 1.4, 1]}
        />
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
