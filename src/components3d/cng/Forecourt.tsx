import { useMemo } from 'react';
import { concrete, asphalt, paintedMetal, steel, emissive, glass } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { useViewStore } from '@/state/useViewStore';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';

/**
 * Section 01 §3.7 — Forecourt & Site Works. Concrete slab with expansion-joint
 * grid + painted markings, a perimeter boundary wall with IN/OUT gates, the
 * safety barrier (kerb + steel railing) splitting the public vehicle area from
 * the process area, process bollards, the road-frontage pylon sign, a mandatory
 * safety signboard, a control-room/office building, perimeter lighting poles,
 * fire-safety equipment and boundary landscaping. Vehicle area is −X; process +X.
 */
export function Forecourt({ width = 34, depth = 26 }: { width?: number; depth?: number }) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const slabMat = useMemo(() => concrete('#b4b1a8', 300), []);
  const jointMat = useMemo(() => asphalt(301), []);
  const wallMat = useMemo(() => paintedMetal('#eef0f2', 302), []);
  const capMat = useMemo(() => paintedMetal(BRAND.primary, 303), []);
  const railMat = useMemo(() => paintedMetal(BRAND.primary, 304), []);
  const kerbMat = useMemo(() => concrete('#c6c3ba', 305), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 306 }), []);
  const hazardMat = useMemo(() => paintedMetal('#e6b422', 307), []);
  const redMat = useMemo(() => paintedMetal('#c01a1a', 308), []);
  const roomMat = useMemo(() => paintedMetal('#e7e3d8', 309), []);
  const poleMat = useMemo(() => steel({ color: '#9aa1a8', seed: 310 }), []);
  const lampMat = useMemo(() => emissive('#fff4e0', night ? 2.6 : 0.1), [night]);
  const signMat = useMemo(() => emissive('#ffffff', night ? 1.4 : 0.4), [night]);
  const leafMat = useMemo(() => paintedMetal('#4c7a3e', 311), []);

  const hw = width / 2;
  const hd = depth / 2;

  const vJoints = useMemo(() => Array.from({ length: Math.floor(width / 4) - 1 }, (_, i) => -hw + (i + 1) * 4), [width, hw]);
  const hJoints = useMemo(() => Array.from({ length: Math.floor(depth / 4) - 1 }, (_, i) => -hd + (i + 1) * 4), [depth, hd]);

  return (
    <group>
      {/* Concrete slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow material={slabMat}>
        <planeGeometry args={[width, depth]} />
      </mesh>
      {/* expansion-joint grid */}
      {vJoints.map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={jointMat}>
          <planeGeometry args={[0.06, depth]} />
        </mesh>
      ))}
      {hJoints.map((z, i) => (
        <mesh key={`h${i}`} position={[0, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} material={jointMat}>
          <planeGeometry args={[width, 0.06]} />
        </mesh>
      ))}

      {/* Painted markings: ADANI CNG stencil on the approach + directional arrows + lane lines */}
      <SignPlane text="ADANI CNG" width={5} position={[-hw + 6, 0.07, hd - 3]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#e9edf1', fontWeight: 800, letterSpacing: 6 }} />
      {[-4, 0, 4].map((z, i) => (
        <SignPlane key={i} text="➜" width={0.8} position={[-hw + 3, 0.07, z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} options={{ fg: '#eef2f5', fontWeight: 800 }} />
      ))}
      {[-3.2, 3.2].map((z, i) => (
        <mesh key={`lane${i}`} position={[-8, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]} material={signMat}>
          <planeGeometry args={[10, 0.12]} />
        </mesh>
      ))}
      {/* yellow hatched no-parking around the process area */}
      <mesh position={[hw - 8, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, depth - 3]} />
        <meshStandardMaterial color="#e6b422" transparent opacity={0.14} roughness={0.9} />
      </mesh>

      {/* Drainage channel + grating along the low (−Z) edge */}
      <mesh position={[0, 0.045, -hd + 0.6]} material={steelMat}>
        <boxGeometry args={[width - 2, 0.03, 0.3]} />
      </mesh>
      {Array.from({ length: Math.floor(width / 0.5) }).map((_, i) => (
        <mesh key={i} position={[-hw + 1 + i * 0.5, 0.06, -hd + 0.6]} material={steelMat}>
          <boxGeometry args={[0.04, 0.02, 0.3]} />
        </mesh>
      ))}

      {/* Perimeter boundary wall (2.2 tall) with blue capping — 3 sides, gap at −X frontage for gates */}
      {([
        { p: [0, 1.1, hd] as [number, number, number], s: [width, 2.2, 0.2] as [number, number, number] },
        { p: [hw, 1.1, 0] as [number, number, number], s: [0.2, 2.2, depth] as [number, number, number] },
      ]).map((w, i) => (
        <group key={i}>
          <mesh position={w.p} castShadow receiveShadow material={wallMat}>
            <boxGeometry args={w.s} />
          </mesh>
          <mesh position={[w.p[0], 2.28, w.p[2]]} material={capMat}>
            <boxGeometry args={[w.s[0] + 0.05, 0.14, w.s[2] + 0.05]} />
          </mesh>
        </group>
      ))}
      {/* back wall on −Z with a break; front (−X) has gates */}
      <group>
        <mesh position={[hw - 6, 1.1, -hd]} castShadow material={wallMat}>
          <boxGeometry args={[12, 2.2, 0.2]} />
        </mesh>
        <mesh position={[hw - 6, 2.28, -hd]} material={capMat}>
          <boxGeometry args={[12.05, 0.14, 0.25]} />
        </mesh>
      </group>

      {/* IN / OUT gates at the −X frontage */}
      {([
        { z: -6, t: 'IN' },
        { z: 6, t: 'OUT' },
      ]).map((g, i) => (
        <group key={i} position={[-hw, 0, g.z]}>
          {[-1.8, 1.8].map((z, k) => (
            <mesh key={k} position={[0, 1.4, z]} castShadow material={poleMat}>
              <boxGeometry args={[0.2, 2.8, 0.2]} />
            </mesh>
          ))}
          <mesh position={[0, 2.9, 0]} material={capMat}>
            <boxGeometry args={[0.24, 0.24, 3.8]} />
          </mesh>
          <SignPlane text={g.t} width={1.1} position={[0.13, 2.9, 0]} rotation={[0, Math.PI / 2, 0]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, radius: 6, paddingX: 30 }} doubleSide />
        </group>
      ))}

      {/* Safety barrier: kerb wall + blue steel railing, at x≈0 splitting public / process */}
      <group position={[0.5, 0, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={kerbMat}>
          <boxGeometry args={[0.4, 0.5, depth - 4]} />
        </mesh>
        {/* top rail */}
        <mesh position={[0, 1.05, 0]} material={railMat}>
          <boxGeometry args={[0.1, 0.08, depth - 4]} />
        </mesh>
        <mesh position={[0, 0.75, 0]} material={railMat}>
          <boxGeometry args={[0.06, 0.06, depth - 4]} />
        </mesh>
        {/* posts */}
        {Array.from({ length: Math.floor((depth - 4) / 2) + 1 }).map((_, i) => (
          <mesh key={i} position={[0, 0.75, -(depth - 4) / 2 + i * 2]} castShadow material={railMat}>
            <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
          </mesh>
        ))}
      </group>

      {/* Pylon sign at the road frontage corner */}
      <group position={[-hw + 1.5, 0, -hd + 4]}>
        <mesh position={[0, 3, 0]} castShadow material={poleMat}>
          <boxGeometry args={[0.4, 6, 0.4]} />
        </mesh>
        {([1, -1] as const).map((s) => (
          <group key={s}>
            <mesh position={[0, 6.4, 0]} castShadow material={signMat}>
              <boxGeometry args={[2.5, 3.5, 0.3]} />
            </mesh>
            <group position={[0, 0, s * 0.16]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
              <LogoDecal position={[0, 7.5, 0]} width={1.9} backing={false} />
              <SignPlane text="TOTAL GAS" width={2.1} position={[0, 6.9, 0]} options={{ fg: BRAND.primary, fontWeight: 800, letterSpacing: 2 }} />
              <SignPlane text="C N G" width={1.5} position={[0, 6.35, 0]} options={{ fg: '#ffffff', bg: BRAND.tealCng, fontWeight: 800, radius: 12, paddingX: 60, letterSpacing: 6 }} />
              {/* price display panel with emissive digits */}
              <mesh position={[0, 5.6, 0.01]} material={emissive('#06120f', 0.6)}>
                <boxGeometry args={[2.0, 0.7, 0.04]} />
              </mesh>
              <SignPlane text="₹ 89.50 / kg" width={1.7} position={[0, 5.6, 0.03]} options={{ fg: '#8ef3d6', fontWeight: 800, letterSpacing: 1 }} />
            </group>
          </group>
        ))}
      </group>

      {/* Mandatory safety signboard near the entrance */}
      <group position={[-hw + 2.5, 0, 2]}>
        <mesh position={[0, 1.4, 0]} castShadow material={poleMat}>
          <boxGeometry args={[0.1, 2.8, 0.1]} />
        </mesh>
        <mesh position={[0, 2.4, 0]} castShadow material={wallMat}>
          <boxGeometry args={[1.7, 1.9, 0.06]} />
        </mesh>
        <group position={[0, 2.4, 0.035]}>
          <SignPlane text="NO SMOKING" width={1.5} position={[0, 0.6, 0]} options={{ fg: '#ffffff', bg: BRAND.alert, fontWeight: 800, radius: 4, paddingX: 16 }} />
          <SignPlane text="SWITCH OFF ENGINE" width={1.5} position={[0, 0.25, 0]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 16 }} />
          <SignPlane text="NO MOBILE PHONES" width={1.5} position={[0, -0.1, 0]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 16 }} />
          <SignPlane text="CNG ONLY" width={1.5} position={[0, -0.45, 0]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, radius: 4, paddingX: 16 }} />
          <SignPlane text="EMERGENCY ☎ 1906" width={1.5} position={[0, -0.78, 0]} options={{ fg: '#16202b', bg: '#d6dade', fontWeight: 700, radius: 4, paddingX: 16 }} />
        </group>
      </group>

      {/* Control room / office building */}
      <group position={[hw - 3.5, 0, hd - 3]}>
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow material={roomMat}>
          <boxGeometry args={[5, 3.2, 4]} />
        </mesh>
        <mesh position={[0, 3.35, 0]} material={capMat}>
          <boxGeometry args={[5.2, 0.2, 4.2]} />
        </mesh>
        {/* accent band */}
        <mesh position={[0, 2.6, 2.01]} material={capMat}>
          <boxGeometry args={[5, 0.3, 0.04]} />
        </mesh>
        {/* door */}
        <mesh position={[-1.5, 1.0, 2.01]} material={steel({ color: '#5a6472', seed: 312 })}>
          <boxGeometry args={[0.9, 2.0, 0.05]} />
        </mesh>
        {/* windows */}
        {[0.4, 1.7].map((x, i) => (
          <mesh key={i} position={[x, 1.9, 2.01]} material={glass('#9fc4d8')}>
            <boxGeometry args={[1.0, 0.9, 0.05]} />
          </mesh>
        ))}
        {/* AC outdoor unit */}
        <mesh position={[2.2, 1.2, 2.05]} castShadow material={steel({ color: '#d7dade', seed: 313 })}>
          <boxGeometry args={[0.6, 0.5, 0.3]} />
        </mesh>
        <LogoDecal position={[0.2, 2.6, 2.04]} width={1.0} backing backingColor="#ffffff" />
      </group>

      {/* Perimeter lighting poles */}
      {([[-hw + 2, hd - 2], [hw - 2, hd - 2], [hw - 2, -hd + 2], [-hw + 6, -hd + 2]] as const).map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 3, 0]} castShadow material={poleMat}>
            <cylinderGeometry args={[0.1, 0.14, 6, 8]} />
          </mesh>
          <mesh position={[0, 6, 0.35]} material={lampMat}>
            <boxGeometry args={[0.5, 0.14, 0.35]} />
          </mesh>
        </group>
      ))}

      {/* Air / water point for vehicles */}
      <group position={[-hw + 4, 0, -3]}>
        <mesh position={[0, 0.5, 0]} castShadow material={paintedMetal(BRAND.primary, 314)}>
          <boxGeometry args={[0.5, 1.0, 0.4]} />
        </mesh>
        <SignPlane text="AIR · WATER" width={0.5} position={[0, 0.7, 0.21]} options={{ fg: '#ffffff', fontWeight: 700, letterSpacing: 1 }} />
      </group>

      {/* Fire-safety cluster: extinguisher cabinets, sand bucket, hose reel, alarm call point */}
      <group position={[2.5, 0, hd - 2]}>
        {[0, 0.8, 1.6, 2.4].map((x, i) => (
          <mesh key={i} position={[x, 0.7, 0]} castShadow material={redMat}>
            <boxGeometry args={[0.4, 0.7, 0.25]} />
          </mesh>
        ))}
        {/* sand bucket stand */}
        <mesh position={[3.2, 0.5, 0]} castShadow material={redMat}>
          <cylinderGeometry args={[0.16, 0.12, 0.3, 12]} />
        </mesh>
        {/* hose reel cabinet */}
        <mesh position={[-0.9, 0.75, 0]} castShadow material={redMat}>
          <boxGeometry args={[0.6, 0.8, 0.3]} />
        </mesh>
        {/* fire alarm call point */}
        <mesh position={[-1.5, 1.1, 0]} material={redMat}>
          <boxGeometry args={[0.2, 0.2, 0.1]} />
        </mesh>
        <SignPlane text="FIRE POINT" width={1.6} position={[1.2, 1.4, 0]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 800, radius: 4, paddingX: 16 }} />
      </group>

      {/* Boundary landscaping: planter strip + shrubs + small trees along +Z wall */}
      <group position={[-6, 0, hd - 0.8]}>
        <mesh position={[0, 0.2, 0]} material={paintedMetal('#3a4048', 315)}>
          <boxGeometry args={[14, 0.4, 0.7]} />
        </mesh>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[-6.5 + i * 1.5, 0.6, 0]} castShadow material={leafMat}>
            <icosahedronGeometry args={[0.4 + (i % 3) * 0.06, 0]} />
          </mesh>
        ))}
        {[-4, 3].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.9, 0]} material={steel({ color: '#6b5236', roughness: 0.9, metalness: 0, seed: 316 })}>
              <cylinderGeometry args={[0.08, 0.12, 1.4, 8]} />
            </mesh>
            <mesh position={[0, 1.9, 0]} castShadow material={leafMat}>
              <icosahedronGeometry args={[0.9, 1]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Bollards around the process equipment (yellow w/ black band) */}
      {([[2.2, -8], [2.2, 8], [hw - 2, -8], [hw - 2, 8], [8, -hd + 5], [8, hd - 5]] as const).map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 0.5, 0]} castShadow material={hazardMat}>
            <cylinderGeometry args={[0.075, 0.075, 1.0, 10]} />
          </mesh>
          <mesh position={[0, 0.62, 0]} material={steel({ color: '#1c1f22', seed: 317 })}>
            <cylinderGeometry args={[0.08, 0.08, 0.16, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
