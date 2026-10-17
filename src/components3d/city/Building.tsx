import { useMemo } from 'react';
import * as THREE from 'three';
import { facadeMap } from '@/materials/proceduralTextures';
import { concrete, paintedMetal, steel, emissive as emissiveMat } from '@/materials/materials';
import { useViewStore } from '@/state/useViewStore';

export type BuildingCategory = 'residential' | 'commercial' | 'institutional' | 'industrial';

export interface BuildingProps {
  position?: [number, number, number];
  width?: number;
  depth?: number;
  height?: number;
  category?: BuildingCategory;
  seed?: number;
  rotation?: number;
}

// Local rng.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Windowed facade materials for the four box side faces + roof. */
function useFacadeBodyMats(opts: {
  wall: string;
  frame: string;
  glass: string;
  colsW: number;
  colsD: number;
  rows: number;
  seed: number;
  roof: string;
  night: boolean;
  glazing?: number;
}) {
  const { wall, frame, glass, colsW, colsD, rows, seed, roof, night, glazing } = opts;
  return useMemo(() => {
    const faceW = facadeMap({ wall, frame, glass, cols: colsW, rows, seed, glazing });
    const faceD = facadeMap({ wall, frame, glass, cols: colsD, rows, seed: seed + 1, glazing });
    const mk = (f: ReturnType<typeof facadeMap>) =>
      new THREE.MeshStandardMaterial({
        map: f.map,
        emissiveMap: f.light,
        emissive: new THREE.Color('#ffd9a0'),
        emissiveIntensity: night ? 1.0 : 0.0,
        roughness: 0.62,
        metalness: 0.05,
        envMapIntensity: 0.9,
      });
    const matW = mk(faceW);
    const matD = mk(faceD);
    const roofM = concrete(roof, seed + 5);
    // face order: +X, -X, +Y, -Y, +Z, -Z
    return [matW, matW, roofM, roofM, matD, matD] as THREE.Material[];
  }, [wall, frame, glass, colsW, colsD, rows, seed, roof, night, glazing]);
}

/* ────────────────────────────  RESIDENTIAL  ──────────────────────────── */
// Cream sandstone tower, per-floor balcony ledges, rooftop water tanks + lift
// room, stone plinth (spec Fix Category A).
function ResidentialBuilding({ width = 6, depth = 6, height = 14, seed = 1 }: BuildingProps) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const floors = Math.min(20, Math.max(3, Math.round(height / 3.1)));
  const H = floors * 3.1;

  const bodyMats = useFacadeBodyMats({
    wall: '#ece0c8',
    frame: '#d8ccb0',
    glass: '#b8d4e8',
    colsW: Math.max(2, Math.round(width / 2.4)),
    colsD: Math.max(2, Math.round(depth / 2.4)),
    rows: floors,
    seed,
    roof: '#c6b695',
    night,
    glazing: 0.66,
  });

  const plinthMat = useMemo(() => concrete('#8b8a86', seed + 11), [seed]);
  const ledgeMat = useMemo(() => paintedMetal('#e9e6df', seed + 12), [seed]);
  const railMat = useMemo(() => paintedMetal('#f2f0ea', seed + 13), [seed]);
  const tankMat = useMemo(() => steel({ color: '#c4c8cc', roughness: 0.5, metalness: 0.6, seed: seed + 14 }), [seed]);

  const ledges = useMemo(() => Array.from({ length: floors }, (_, f) => 1.4 + f * 3.1 + 1.1), [floors]);
  const setback = floors > 6;
  const sbW = width * 0.74;
  const sbD = depth * 0.74;
  const sbFloors = setback ? 2 : 0;
  const bodyH = H - sbFloors * 3.1;

  return (
    <group>
      {/* stone plinth */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow material={plinthMat}>
        <boxGeometry args={[width + 0.3, 1.4, depth + 0.3]} />
      </mesh>
      {/* main body */}
      <mesh position={[0, 1.4 + bodyH / 2, 0]} castShadow receiveShadow material={bodyMats}>
        <boxGeometry args={[width, bodyH, depth]} />
      </mesh>
      {/* setback upper block */}
      {setback && (
        <mesh position={[0, 1.4 + bodyH + (sbFloors * 3.1) / 2, 0]} castShadow receiveShadow material={bodyMats}>
          <boxGeometry args={[sbW, sbFloors * 3.1, sbD]} />
        </mesh>
      )}
      {/* balcony ledges + railings on front & back */}
      {ledges.map((y, i) =>
        y < 1.4 + bodyH ? (
          <group key={i}>
            {[depth / 2 + 0.22, -depth / 2 - 0.22].map((z, j) => (
              <group key={j}>
                <mesh position={[0, y, z]} castShadow receiveShadow material={ledgeMat}>
                  <boxGeometry args={[width * 0.98, 0.14, 0.5]} />
                </mesh>
                <mesh position={[0, y + 0.42, z + (z > 0 ? 0.2 : -0.2)]} material={railMat}>
                  <boxGeometry args={[width * 0.98, 0.5, 0.04]} />
                </mesh>
              </group>
            ))}
          </group>
        ) : null,
      )}
      {/* rooftop: water tanks + lift room */}
      <mesh position={[width * 0.22, H + 0.7, depth * 0.15]} castShadow material={tankMat}>
        <cylinderGeometry args={[0.55, 0.55, 1.3, 14]} />
      </mesh>
      <mesh position={[width * 0.05, H + 0.6, -depth * 0.2]} castShadow material={tankMat}>
        <cylinderGeometry args={[0.45, 0.45, 1.1, 14]} />
      </mesh>
      <mesh position={[-width * 0.22, H + 0.8, depth * 0.1]} castShadow receiveShadow material={plinthMat}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
      </mesh>
    </group>
  );
}

/* ────────────────────────────  INDUSTRIAL  ──────────────────────────── */
// Wide low corrugated-grey shed, dark roof, corner steel columns, roller
// shutter, loading dock + hazard stripes, tall chimney (spec Fix Category B).
function IndustrialBuilding({ width = 10, depth = 8, height = 8, seed = 1 }: BuildingProps) {
  const r = useMemo(() => rng(seed + 30), [seed]);
  const H = Math.min(10, Math.max(6, height));
  const rusted = r() > 0.6;

  const wallMat = useMemo(() => steel({ color: '#8a9099', roughness: 0.6, metalness: 0.6, seed: seed + 31 }), [seed]);
  const roofMat = useMemo(() => paintedMetal(rusted ? '#8b5a3c' : '#4a4e54', seed + 32), [seed, rusted]);
  const columnMat = useMemo(() => steel({ color: '#31353b', roughness: 0.5, metalness: 0.85, seed: seed + 33 }), [seed]);
  const shutterMat = useMemo(() => paintedMetal('#5b6067', seed + 34), [seed]);
  const stripMat = useMemo(() => emissiveMat('#9fd0e6', 0.25), []);
  const chimneyMat = useMemo(() => concrete('#6a6e73', seed + 35), [seed]);
  const chimney = r() > 0.45;

  return (
    <group>
      {/* main shed */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[width, H, depth]} />
      </mesh>
      {/* dark roof cap */}
      <mesh position={[0, H + 0.2, 0]} castShadow receiveShadow material={roofMat}>
        <boxGeometry args={[width + 0.4, 0.5, depth + 0.4]} />
      </mesh>
      {/* corner steel I-columns */}
      {[
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2],
        [width / 2, depth / 2],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], H / 2, p[1]]} castShadow material={columnMat}>
          <boxGeometry args={[0.4, H + 0.3, 0.4]} />
        </mesh>
      ))}
      {/* clerestory strip windows near roofline (front + back) */}
      {[depth / 2 + 0.02, -depth / 2 - 0.02].map((z, i) => (
        <mesh key={i} position={[0, H - 0.9, z]} material={stripMat}>
          <boxGeometry args={[width * 0.8, 0.7, 0.05]} />
        </mesh>
      ))}
      {/* roller shutter door (front) */}
      <mesh position={[-width * 0.2, 1.7, depth / 2 + 0.03]} material={shutterMat}>
        <boxGeometry args={[3.2, 3.4, 0.1]} />
      </mesh>
      {/* loading dock ramp + yellow hazard stripe */}
      <mesh position={[-width * 0.2, 0.35, depth / 2 + 1.4]} castShadow receiveShadow material={concrete('#9a968e', seed + 36)}>
        <boxGeometry args={[3.6, 0.7, 2.6]} />
      </mesh>
      <mesh position={[-width * 0.2, 0.72, depth / 2 + 2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.6, 0.4]} />
        <meshStandardMaterial color="#e8b81c" roughness={0.7} />
      </mesh>
      {/* external vertical pipework */}
      {[width * 0.35, width * 0.42].map((x, i) => (
        <mesh key={i} position={[x, H / 2, depth / 2 + 0.12]} material={steel({ color: '#b0b6bd', seed: seed + 40 + i })}>
          <cylinderGeometry args={[0.08, 0.08, H - 0.5, 8]} />
        </mesh>
      ))}
      {/* chimney stack with red warning band */}
      {chimney && (
        <group position={[width * 0.32, 0, -depth * 0.32]}>
          <mesh position={[0, H * 1.9, 0]} castShadow material={chimneyMat}>
            <cylinderGeometry args={[0.45, 0.6, H * 3.4, 14]} />
          </mesh>
          <mesh position={[0, H * 3.2, 0]} material={paintedMetal('#c0392b', seed + 41)}>
            <cylinderGeometry args={[0.47, 0.47, 0.6, 14]} />
          </mesh>
        </group>
      )}
      {/* guard booth */}
      <mesh position={[width / 2 - 1, 0.9, depth / 2 + 2]} castShadow receiveShadow material={paintedMetal('#dcd3bf', seed + 42)}>
        <boxGeometry args={[1.6, 1.8, 1.6]} />
      </mesh>
    </group>
  );
}

/* ────────────────────────────  COMMERCIAL  ──────────────────────────── */
// Clean white/glass office block, ground-floor retail setback + Adani-blue
// awnings, rooftop cooling towers (spec Fix Category C).
function CommercialBuilding({ width = 6, depth = 6, height = 20, seed = 1 }: BuildingProps) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const floors = Math.max(3, Math.round(height / 3.4));

  const bodyMats = useFacadeBodyMats({
    wall: '#eef0f2',
    frame: '#5a6673',
    glass: '#c2e2ea',
    colsW: Math.max(2, Math.round(width / 2.0)),
    colsD: Math.max(2, Math.round(depth / 2.0)),
    rows: floors,
    seed,
    roof: '#c0c4c9',
    night,
    glazing: 0.78,
  });

  const baseMat = useMemo(() => paintedMetal('#c9a06a', seed + 21), [seed]);
  const awningMat = useMemo(() => paintedMetal('#0b74b0', seed + 22), [seed]);
  const shopGlow = useMemo(() => emissiveMat('#ffe9c0', night ? 1.4 : 0.5), [night]);
  const coolMat = useMemo(() => steel({ color: '#b8bcc0', seed: seed + 23 }), [seed]);

  return (
    <group>
      {/* retail plinth (wider) */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow material={baseMat}>
        <boxGeometry args={[width + 1.0, 2.8, depth + 1.0]} />
      </mesh>
      {/* shopfront glow band */}
      <mesh position={[0, 1.2, (depth + 1.0) / 2 + 0.02]} material={shopGlow}>
        <boxGeometry args={[width + 0.6, 1.4, 0.05]} />
      </mesh>
      {/* awnings over shopfront */}
      {Array.from({ length: Math.max(2, Math.round(width / 3)) }).map((_, i, arr) => {
        const x = -((arr.length - 1) / 2) * 3 + i * 3;
        return (
          <mesh key={i} position={[x, 2.4, (depth + 1.0) / 2 + 0.5]} rotation={[0.4, 0, 0]} castShadow material={awningMat}>
            <boxGeometry args={[2.6, 0.1, 1.3]} />
          </mesh>
        );
      })}
      {/* office tower */}
      <mesh position={[0, 2.8 + (height - 2.8) / 2, 0]} castShadow receiveShadow material={bodyMats}>
        <boxGeometry args={[width, height - 2.8, depth]} />
      </mesh>
      {/* rooftop cooling towers */}
      {[[-width * 0.2, depth * 0.15], [width * 0.22, -depth * 0.1]].map((p, i) => (
        <mesh key={i} position={[p[0], height + 0.7, p[1]]} castShadow material={coolMat}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
        </mesh>
      ))}
      <mesh position={[0, height + 0.3, 0]} castShadow receiveShadow material={coolMat}>
        <boxGeometry args={[width * 0.5, 0.6, depth * 0.5]} />
      </mesh>
    </group>
  );
}

/* ──────────────────────────  INSTITUTIONAL  ────────────────────────── */
// Low-wide warm-yellow / brick block with an entrance portico and colourful
// window frames (spec Fix Category D). School landmark adds its own sign/lawn.
function InstitutionalBuilding({ width = 8, depth = 8, height = 10, seed = 1 }: BuildingProps) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const r = useMemo(() => rng(seed + 50), [seed]);
  const brick = r() > 0.5;
  const H = Math.min(12, Math.max(6, height));
  const floors = Math.max(2, Math.round(H / 3.4));

  const bodyMats = useFacadeBodyMats({
    wall: brick ? '#c0664a' : '#f0d67a',
    frame: r() > 0.5 ? '#2f6f8f' : '#c0392b', // colourful frames
    glass: '#cfe0da',
    colsW: Math.max(2, Math.round(width / 2.2)),
    colsD: Math.max(2, Math.round(depth / 2.2)),
    rows: floors,
    seed,
    roof: brick ? '#7a3b2a' : '#c9b06a',
    night,
    glazing: 0.6,
  });

  const porticoMat = useMemo(() => paintedMetal('#ffffff', seed + 51), [seed]);
  const columnMat = useMemo(() => paintedMetal('#f4efe6', seed + 52), [seed]);

  return (
    <group>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow material={bodyMats}>
        <boxGeometry args={[width, H, depth]} />
      </mesh>
      {/* parapet */}
      <mesh position={[0, H + 0.15, 0]} castShadow material={concrete(brick ? '#7a3b2a' : '#c9b06a', seed + 53)}>
        <boxGeometry args={[width + 0.25, 0.3, depth + 0.25]} />
      </mesh>
      {/* entrance portico */}
      <mesh position={[0, 2.8, depth / 2 + 1.4]} castShadow receiveShadow material={porticoMat}>
        <boxGeometry args={[width * 0.5, 0.3, 3]} />
      </mesh>
      {[-width * 0.2, width * 0.2].map((x, i) => (
        <mesh key={i} position={[x, 1.35, depth / 2 + 2.6]} castShadow material={columnMat}>
          <cylinderGeometry args={[0.2, 0.2, 2.7, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────  DISPATCH  ───────────────────────────── */
export function Building(props: BuildingProps) {
  const { position = [0, 0, 0], rotation = 0, category = 'commercial' } = props;
  let inner;
  if (category === 'residential') inner = <ResidentialBuilding {...props} />;
  else if (category === 'industrial') inner = <IndustrialBuilding {...props} />;
  else if (category === 'institutional') inner = <InstitutionalBuilding {...props} />;
  else inner = <CommercialBuilding {...props} />;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {inner}
    </group>
  );
}
