import { useMemo } from 'react';
import { concrete, asphalt, paintedMetal, steel, emissive, glass } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { useViewStore } from '@/state/useViewStore';
import { MotherPartPicker } from './MotherPartPicker';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';

/**
 * Section 02 §9 — Mother Station site works & ancillaries. The industrial apron
 * (its own ground pad), boundary wall + gate + security cabin, a larger control
 * room (clickable = station panel), an electrical substation / transformer yard,
 * a diesel generator enclosure, a fire-water tank + pump house with a hydrant
 * ring, staff parking, a truck turning area and lighting. Local origin at centre;
 * the city-facing front is +Z.
 */
export function MotherSiteworks({ width = 90, depth = 72 }: { width?: number; depth?: number }) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const apronMat = useMemo(() => concrete('#adaa9f', 580), []);
  const jointMat = useMemo(() => asphalt(581), []);
  const wallMat = useMemo(() => paintedMetal('#eef0f2', 582), []);
  const capMat = useMemo(() => paintedMetal(BRAND.primary, 583), []);
  const roomMat = useMemo(() => paintedMetal('#e7e3d8', 584), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 585 }), []);
  const poleMat = useMemo(() => steel({ color: '#9aa1a8', seed: 586 }), []);
  const lampMat = useMemo(() => emissive('#fff4e0', night ? 2.6 : 0.1), [night]);
  const winMat = useMemo(() => emissive('#bfe0ff', night ? 1.4 : 0.5), [night]);
  const redMat = useMemo(() => paintedMetal('#c01a1a', 587), []);
  const fenceMat = useMemo(() => steel({ color: '#7f868d', roughness: 0.6, seed: 588 }), []);
  const transformerMat = useMemo(() => paintedMetal('#8a9199', 589), []);
  const leafMat = useMemo(() => paintedMetal('#4c7a3e', 590), []);

  const hw = width / 2;
  const hd = depth / 2;
  const vJoints = useMemo(() => Array.from({ length: Math.floor(width / 6) - 1 }, (_, i) => -hw + (i + 1) * 6), [width, hw]);
  const hJoints = useMemo(() => Array.from({ length: Math.floor(depth / 6) - 1 }, (_, i) => -hd + (i + 1) * 6), [depth, hd]);

  return (
    <group>
      {/* Industrial apron (own ground pad) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow material={apronMat}>
        <planeGeometry args={[width, depth]} />
      </mesh>
      {vJoints.map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={jointMat}>
          <planeGeometry args={[0.08, depth]} />
        </mesh>
      ))}
      {hJoints.map((z, i) => (
        <mesh key={`h${i}`} position={[0, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]} material={jointMat}>
          <planeGeometry args={[width, 0.08]} />
        </mesh>
      ))}
      <SignPlane text="ADANI TOTAL GAS — MOTHER STATION" width={18} position={[6, 0.06, hd - 6]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#d9dde1', fontWeight: 800, letterSpacing: 4 }} />

      {/* Boundary wall (2.5) on 3 sides; gate + security cabin on the +Z front */}
      {([
        { p: [0, 1.25, -hd] as [number, number, number], s: [width, 2.5, 0.25] as [number, number, number] },
        { p: [-hw, 1.25, 0] as [number, number, number], s: [0.25, 2.5, depth] as [number, number, number] },
        { p: [hw, 1.25, 0] as [number, number, number], s: [0.25, 2.5, depth] as [number, number, number] },
      ]).map((w, i) => (
        <group key={i}>
          <mesh position={w.p} castShadow receiveShadow material={wallMat}>
            <boxGeometry args={w.s} />
          </mesh>
          <mesh position={[w.p[0], 2.6, w.p[2]]} material={capMat}>
            <boxGeometry args={[w.s[0] + 0.06, 0.16, w.s[2] + 0.06]} />
          </mesh>
        </group>
      ))}
      {/* front wall segments leaving a truck gate (centre) + car gate */}
      {([[-hw + 14, 28], [hw - 12, 24]] as const).map((seg, i) => (
        <group key={i}>
          <mesh position={[seg[0], 1.25, hd]} castShadow material={wallMat}>
            <boxGeometry args={[seg[1], 2.5, 0.25]} />
          </mesh>
          <mesh position={[seg[0], 2.6, hd]} material={capMat}>
            <boxGeometry args={[seg[1] + 0.06, 0.16, 0.3]} />
          </mesh>
        </group>
      ))}
      {/* gate posts + signage */}
      {([-4, 8] as const).map((x, i) => (
        <mesh key={i} position={[x, 1.6, hd]} castShadow material={capMat}>
          <boxGeometry args={[0.4, 3.2, 0.4]} />
        </mesh>
      ))}
      <SignPlane text="TRUCK IN" width={2.6} position={[-14, 3.0, hd]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, radius: 6, paddingX: 22 }} doubleSide />
      <SignPlane text="CAR IN" width={2.2} position={[18, 3.0, hd]} options={{ fg: '#ffffff', bg: BRAND.tealCng, fontWeight: 800, radius: 6, paddingX: 22 }} doubleSide />
      {/* security cabin */}
      <group position={[2, 0, hd - 2]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={roomMat}>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
        </mesh>
        <mesh position={[0, 1.5, 1.21]} material={glass('#9fc4d8')}>
          <boxGeometry args={[1.6, 0.8, 0.05]} />
        </mesh>
        <mesh position={[0, 2.5, 0]} material={capMat}>
          <boxGeometry args={[2.6, 0.2, 2.6]} />
        </mesh>
        <SignPlane text="SECURITY" width={1.6} position={[0, 0.6, 1.22]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, radius: 4, paddingX: 14 }} />
      </group>

      {/* Larger control room (clickable = station panel) */}
      <MotherPartPicker part="station">
        <group position={[30, 0, 8]}>
          <mesh position={[0, 1.75, 0]} castShadow receiveShadow material={roomMat}>
            <boxGeometry args={[8, 3.5, 6]} />
          </mesh>
          <mesh position={[0, 3.6, 0]} material={capMat}>
            <boxGeometry args={[8.2, 0.2, 6.2]} />
          </mesh>
          <mesh position={[0, 2.7, 3.01]} material={capMat}>
            <boxGeometry args={[8, 0.35, 0.05]} />
          </mesh>
          {/* large window facing the process area (−Z) */}
          <mesh position={[0, 1.9, -3.01]} material={winMat}>
            <boxGeometry args={[5, 1.4, 0.06]} />
          </mesh>
          {/* two smaller windows + door on front */}
          {[-2.4, 2.4].map((x, i) => (
            <mesh key={i} position={[x, 2.0, 3.01]} material={winMat}>
              <boxGeometry args={[1.4, 1.0, 0.06]} />
            </mesh>
          ))}
          <mesh position={[0, 1.1, 3.01]} material={steel({ color: '#5a6472', seed: 591 })}>
            <boxGeometry args={[1.1, 2.2, 0.06]} />
          </mesh>
          {/* AC units + antenna mast */}
          {[-2, 0, 2].map((x, i) => (
            <mesh key={i} position={[x, 3.75, -1.5]} castShadow material={steelMat}>
              <boxGeometry args={[0.8, 0.3, 0.6]} />
            </mesh>
          ))}
          <mesh position={[3, 4.8, -2]} material={steelMat}>
            <cylinderGeometry args={[0.04, 0.04, 2.4, 6]} />
          </mesh>
          <LogoDecal position={[0, 2.7, 3.04]} width={1.6} backing backingColor="#ffffff" />
          <SignPlane text="CONTROL ROOM — AUTHORISED PERSONNEL ONLY" width={5.6} position={[0, 3.3, 3.04]} options={{ fg: '#16202b', bg: '#d6dade', fontWeight: 700, letterSpacing: 1 }} />
        </group>
      </MotherPartPicker>

      {/* Electrical substation / transformer yard (fenced) */}
      <group position={[34, 0, -20]}>
        {/* fence */}
        {([[0, -4, 8, 0.06], [0, 4, 8, 0.06]] as const).map((f, i) => (
          <mesh key={`fz${i}`} position={[f[0], 1, f[1]]} material={fenceMat}>
            <boxGeometry args={[f[2], 2, f[3]]} />
          </mesh>
        ))}
        {([[-4, 0], [4, 0]] as const).map((f, i) => (
          <mesh key={`fx${i}`} position={[f[0], 1, f[1]]} material={fenceMat}>
            <boxGeometry args={[0.06, 2, 8]} />
          </mesh>
        ))}
        {/* transformer */}
        <mesh position={[-1.5, 1.0, 0]} castShadow material={transformerMat}>
          <boxGeometry args={[2, 2, 2.4]} />
        </mesh>
        {[-0.6, 0.6].map((z, i) => (
          <mesh key={i} position={[-1.5, 2.3, z]} material={steelMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
          </mesh>
        ))}
        {/* switchgear cabinet */}
        <mesh position={[1.8, 0.9, 0]} castShadow material={paintedMetal('#b7bcc2', 592)}>
          <boxGeometry args={[1.4, 1.8, 1.2]} />
        </mesh>
        <SignPlane text="⚡ DANGER — HIGH VOLTAGE" width={2.6} position={[0, 2.4, 4.05]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 14 }} doubleSide />
      </group>

      {/* Diesel generator enclosure */}
      <group position={[34, 0, -8]}>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow material={paintedMetal('#3f6f4a', 593)}>
          <boxGeometry args={[4, 2, 2]} />
        </mesh>
        <mesh position={[1.6, 2.2, 0.6]} material={steelMat}>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
        </mesh>
        <SignPlane text="BACKUP DG SET" width={2.2} position={[0, 1.2, 1.02]} options={{ fg: '#ffffff', bg: '#2c5138', fontWeight: 700, radius: 4, paddingX: 14 }} />
      </group>

      {/* Fire water tank + pump house + hydrants */}
      <group position={[-34, 0, 6]}>
        <mesh position={[0, 0.15, 0]} material={concrete('#b9b5ac', 594)}>
          <cylinderGeometry args={[2.4, 2.4, 0.3, 24]} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow material={paintedMetal('#c0392b', 595)}>
          <cylinderGeometry args={[2.2, 2.2, 3.8, 24]} />
        </mesh>
        <mesh position={[0, 4.15, 0]} castShadow material={paintedMetal('#a5311f', 596)}>
          <cylinderGeometry args={[2.2, 1.6, 0.5, 24]} />
        </mesh>
        <SignPlane text="FIRE WATER" width={2.6} position={[0, 2.4, 2.22]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 2 }} />
        {/* pump house */}
        <mesh position={[3.6, 1.0, 0]} castShadow material={roomMat}>
          <boxGeometry args={[2.4, 2, 2.4]} />
        </mesh>
        <SignPlane text="FIRE PUMP" width={1.6} position={[3.6, 0.7, 1.22]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 700, radius: 4, paddingX: 12 }} />
      </group>
      {/* hydrant ring points */}
      {([[-20, 20], [10, 22], [30, -26], [-30, -24]] as const).map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 0.4, 0]} castShadow material={redMat}>
            <cylinderGeometry args={[0.12, 0.14, 0.8, 10]} />
          </mesh>
          <mesh position={[0.16, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={redMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
          </mesh>
        </group>
      ))}

      {/* Staff parking bays (painted) near the front-right */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[20 + i * 2.6, 0.05, hd - 12]} rotation={[-Math.PI / 2, 0, 0]} material={steelMat}>
          <planeGeometry args={[0.1, 5] } />
        </mesh>
      ))}
      <SignPlane text="STAFF PARKING" width={4} position={[24, 0.06, hd - 15]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#d9dde1', fontWeight: 700, letterSpacing: 2 }} />

      {/* Perimeter lighting poles */}
      {([[-hw + 3, hd - 3], [hw - 3, hd - 3], [hw - 3, -hd + 3], [-hw + 3, -hd + 3], [0, -hd + 3]] as const).map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 3.5, 0]} castShadow material={poleMat}>
            <cylinderGeometry args={[0.12, 0.16, 7, 8]} />
          </mesh>
          <mesh position={[0, 7, 0.4]} material={lampMat}>
            <boxGeometry args={[0.6, 0.16, 0.4]} />
          </mesh>
        </group>
      ))}

      {/* boundary landscaping */}
      {([[-24, -hd + 1.5], [24, -hd + 1.5]] as const).map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          {Array.from({ length: 6 }).map((_, k) => (
            <mesh key={k} position={[-5 + k * 2, 0.5, 0]} castShadow material={leafMat}>
              <icosahedronGeometry args={[0.5, 0]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
