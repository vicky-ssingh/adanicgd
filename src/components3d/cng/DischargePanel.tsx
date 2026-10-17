import { useMemo } from 'react';
import { DynGauge } from './DynGauge';
import { Valve, Gauge } from '@/components3d/primitives/Fittings';
import { PipeRun } from '@/components3d/primitives/Pipe';
import { concrete, steel, paintedMetal, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';

/**
 * Section 04 §A.2 / §B.2 — cascade discharge panel. Transfers gas from the parked
 * trailer to the dispensers by pressure differential. 3 HP couplings + hoses,
 * isolation/check/vent valves, line gauges + a MASTER gauge whose needle visibly
 * falls as the cascade depletes, an ESD, an earthing reel + green grounding lamp,
 * and signage. In booster mode an extra "TO BOOSTER SUCTION" line + suction gauge
 * routes to the compressor. Faces −X toward the bay.
 */
export function DischargePanel({
  mode,
  getCascadeFrac,
}: {
  mode: 'daughter' | 'booster';
  getCascadeFrac: () => number;
}) {
  const plinthMat = useMemo(() => concrete('#c8c4bc', 810), []);
  const panelMat = useMemo(() => steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 811 }), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 812 }), []);
  const hoodMat = useMemo(() => paintedMetal(BRAND.primary, 813), []);
  const greenMat = useMemo(() => emissive('#39d98a', 1.5), []);

  const front = -0.24;

  return (
    <group>
      {/* plinth + panel + hood */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow material={plinthMat}>
        <boxGeometry args={[2.4, 0.36, 0.8]} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow material={panelMat}>
        <boxGeometry args={[2.0, 1.8, 0.45]} />
      </mesh>
      <mesh position={[0, 2.35, -0.12]} rotation={[-0.3, 0, 0]} castShadow material={hoodMat}>
        <boxGeometry args={[2.2, 0.08, 0.8]} />
      </mesh>

      {/* 3 couplings + dust caps + isolation valves + line gauges */}
      {[-0.55, 0, 0.55].map((z, i) => (
        <group key={i}>
          <group position={[z, 1.55, front]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={steelMat}><cylinderGeometry args={[0.05, 0.05, 0.28, 12]} /></mesh>
            <mesh position={[0, 0, -0.17]} material={paintedMetal('#e6b422', 814 + i)}><cylinderGeometry args={[0.06, 0.06, 0.05, 12]} /></mesh>
          </group>
          <group position={[z, 1.05, front + 0.05]} scale={0.4}><Valve size={0.3} color={BRAND.primary} handwheel seed={817 + i} /></group>
          <group position={[z, 0.78, front + 0.06]} rotation={[0, 0, 0]} scale={0.6}><Gauge radius={0.14} seed={820 + i} /></group>
          {/* vent valve + tube */}
          <mesh position={[z + 0.12, 1.9, front + 0.04]} material={steelMat}><cylinderGeometry args={[0.02, 0.02, 0.18, 8]} /></mesh>
        </group>
      ))}

      {/* MASTER gauge — needle falls with cascade pressure */}
      <group position={[0.8, 1.55, front + 0.06]} scale={0.95}>
        <DynGauge radius={0.16} getValue={getCascadeFrac} seed={825} />
      </group>

      {/* ESD mushroom */}
      <group position={[-0.8, 1.05, front + 0.04]}>
        <mesh material={paintedMetal('#f2d21e', 826)}><boxGeometry args={[0.22, 0.22, 0.06]} /></mesh>
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={paintedMetal('#c01a1a', 827)}><cylinderGeometry args={[0.06, 0.06, 0.05, 12]} /></mesh>
      </group>

      {/* display placeholder (values shown in info panel) */}
      <mesh position={[0, 1.55, front + 0.02]} material={steel({ color: '#10161d', roughness: 0.3, seed: 828 })}><boxGeometry args={[0.62, 0.4, 0.03]} /></mesh>
      <SignPlane text="TRAILER · CASCADE · CAP" width={0.56} position={[0, 1.6, front + 0.04]} options={{ fg: '#8ef3d6', fontWeight: 700, letterSpacing: 0 }} />

      {/* earthing reel + green grounding lamp (trailer earthed) */}
      <group position={[0.95, 0.4, 0.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={paintedMetal('#2f6f8f', 829)}><cylinderGeometry args={[0.2, 0.2, 0.14, 16]} /></mesh>
      </group>
      <mesh position={[0.8, 1.95, front + 0.05]} material={greenMat}><cylinderGeometry args={[0.05, 0.05, 0.03, 12]} /></mesh>

      {/* signage */}
      <SignPlane text="CASCADE DISCHARGE PANEL" width={1.8} position={[0, 0.5, front + 0.02]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, radius: 4, paddingX: 14 }} />
      <SignPlane text="EARTH TRAILER BEFORE CONNECTING" width={1.9} position={[0, 2.05, front + 0.02]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 12 }} />
      <LogoDecal position={[0.7, 0.5, front + 0.02]} width={0.6} backing backingColor="#ffffff" />

      {/* booster-only: outlet routed to booster suction + suction gauge + label */}
      {mode === 'booster' && (
        <group>
          <PipeRun points={[[0.9, 0.9, 0.3], [1.6, 0.8, 0.3], [2.4, 0.7, 0.6]]} radius={0.06} color="#b0b6bd" seed={830} tension={0.4} radialSegments={8} />
          <group position={[1.6, 1.15, 0.3]} scale={0.75}><DynGauge radius={0.14} getValue={getCascadeFrac} seed={831} /></group>
          <SignPlane text="TO BOOSTER SUCTION" width={1.5} position={[1.7, 0.55, 0.62]} options={{ fg: '#16202b', bg: '#c9ccd0', fontWeight: 700, radius: 4, paddingX: 10 }} />
        </group>
      )}
    </group>
  );
}
