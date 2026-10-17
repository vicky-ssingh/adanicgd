import { useMemo } from 'react';
import { Canopy } from './Canopy';
import { Dispenser } from './Dispenser';
import { PriorityPanel } from './PriorityPanel';
import { daughterSource } from '@/state/cascadeSources';
import { CascadeTrailerUnit } from './CascadeTrailerUnit';
import { DischargePanel } from './DischargePanel';
import { DispenserStatusSign } from './DispenserStatusSign';
import { DaughterPartPicker } from './DaughterPartPicker';
import { concrete, asphalt, paintedMetal, steel, glass } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { useDaughterStore, trailerBanks } from '@/state/useDaughterStore';

/**
 * Section 04 Part A — CNG DAUGHTER STATION (cascade-fed, NO compressor, NO
 * pipeline). A parked cascade trailer is the gas store; gas transfers to two
 * dispensers by pressure differential, so the fill quality DECLINES as the
 * cascade empties. Small suburban site on its own apron. Local origin at plot
 * centre; the road/front is +Z.
 */
export function DaughterStation({ position = [0, 0, 0], rotation = 0 }: { position?: [number, number, number]; rotation?: number }) {
  const apronMat = useMemo(() => concrete('#b0ada3', 860), []);
  const jointMat = useMemo(() => asphalt(861), []);
  const slabMat = useMemo(() => concrete('#b8b5ac', 862), []);
  const chockMat = useMemo(() => paintedMetal('#e6b422', 863), []);
  const wallMat = useMemo(() => paintedMetal('#eef0f2', 864), []);
  const capMat = useMemo(() => paintedMetal(BRAND.primary, 865), []);
  const kioskMat = useMemo(() => paintedMetal('#e7e3d8', 866), []);
  const poleMat = useMemo(() => steel({ color: '#9aa1a8', seed: 867 }), []);

  const getFrac = () => useDaughterStore.getState().d.cascade / 250;
  const getFill = () => (useDaughterStore.getState().d.cascade / 250) * 100;
  const getBanks = () => trailerBanks(useDaughterStore.getState().d.cascade);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* apron (own ground) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow material={apronMat}>
        <planeGeometry args={[40, 34]} />
      </mesh>
      {[-12, -6, 0, 6, 12].map((x, i) => (
        <mesh key={i} position={[x, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={jointMat}><planeGeometry args={[0.06, 34]} /></mesh>
      ))}

      {/* boundary wall (3 sides) + gate signs */}
      {([[0, -17, 40, 0.2], [-20, 0, 0.2, 34], [20, 0, 0.2, 34]] as const).map((w, i) => (
        <group key={i}>
          <mesh position={[w[0], 1.1, w[1]]} castShadow material={wallMat}><boxGeometry args={[w[2], 2.2, w[3]]} /></mesh>
          <mesh position={[w[0], 2.25, w[1]]} material={capMat}><boxGeometry args={[w[2] + 0.05, 0.14, w[3] + 0.05]} /></mesh>
        </group>
      ))}
      {[['IN', -6], ['OUT', 6]].map(([t, x], i) => (
        <SignPlane key={i} text={t as string} width={1.4} position={[x as number, 2.6, 17]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, radius: 6, paddingX: 20 }} doubleSide />
      ))}

      {/* pylon sign */}
      <group position={[-16, 0, 14]}>
        <mesh position={[0, 2.4, 0]} castShadow material={poleMat}><boxGeometry args={[0.3, 4.8, 0.3]} /></mesh>
        <mesh position={[0, 5.1, 0]} castShadow material={paintedMetal('#ffffff', 868)}><boxGeometry args={[2.4, 2.4, 0.2]} /></mesh>
        <LogoDecal position={[0, 5.6, 0.12]} width={1.8} backing={false} />
        <SignPlane text="CNG DAUGHTER" width={2.0} position={[0, 4.9, 0.12]} options={{ fg: BRAND.primary, fontWeight: 800, letterSpacing: 1 }} />
      </group>

      {/* ── Trailer discharge bay (rear) ── */}
      <group position={[0, 0, -3]}>
        <mesh position={[0, 0.15, 0]} receiveShadow material={slabMat}><boxGeometry args={[16, 0.3, 4.5]} /></mesh>
        {([1.9, -1.9] as const).map((z, i) => (
          <mesh key={i} position={[0, 0.31, z]} rotation={[-Math.PI / 2, 0, 0]} material={chockMat}><planeGeometry args={[13, 0.1]} /></mesh>
        ))}
        <SignPlane text="CASCADE TRAILER — DISCHARGE POSITION" width={8} position={[0, 0.32, 1.3]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#e6b422', fontWeight: 800, letterSpacing: 1 }} />
        {/* bollards */}
        {[-6, -3.5, -1, 1.5, 4, 6.5].map((x, i) => ([2.4, -2.4] as const).map((z) => (
          <mesh key={`${i}${z}`} position={[x, 0.75, z]} castShadow material={chockMat}><cylinderGeometry args={[0.09, 0.09, 1.1, 10]} /></mesh>
        )))}
        {/* wheel chocks */}
        {([-4, -2] as const).map((x, i) => (
          <mesh key={i} position={[x, 0.42, 1.3]} rotation={[0, 0, 0.5]} material={chockMat}><boxGeometry args={[0.3, 0.24, 0.5]} /></mesh>
        ))}
        {/* bay canopy */}
        {([[-7.5, -2.2], [7.5, -2.2], [-7.5, 2.2], [7.5, 2.2]] as const).map((c, i) => (
          <mesh key={i} position={[c[0], 2.75, c[1]]} castShadow material={capMat}><boxGeometry args={[0.35, 5.5, 0.35]} /></mesh>
        ))}
        <mesh position={[0, 5.7, 0]} castShadow material={paintedMetal('#d5d8dc', 869)}><boxGeometry args={[17, 0.35, 5.5]} /></mesh>
        {([1, -1] as const).map((s) => (
          <SignPlane key={s} text="CASCADE DISCHARGE BAY" width={7} position={[0, 5.7, s * 2.8]} rotation={[0, s === 1 ? 0 : Math.PI, 0]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, letterSpacing: 2 }} />
        ))}
        {/* parked cascade trailer (static, glow follows the depleting cascade) */}
        <CascadeTrailerUnit id="CT-11" pose={{ pos: [5.5, 0, 0], rot: 0, getFill, getBanks, doorsOpen: true, legsDown: true }} />
        {/* discharge panel at the head (rear), facing the trailer */}
        <DaughterPartPicker part="daughter-discharge">
          <group position={[-8.5, 0, 0]} rotation={[0, Math.PI, 0]}>
            <DischargePanel mode="daughter" getCascadeFrac={getFrac} />
          </group>
        </DaughterPartPicker>
      </group>

      {/* ── Retail: canopy + 2 dispensers (front) ── */}
      <DaughterPartPicker part="daughter-station">
        <group position={[0, 0, 8]}>
          <Canopy width={9} depth={6} height={5.0} />
        </group>
      </DaughterPartPicker>
      {[-2.2, 2.2].map((x, i) => (
        <group key={i} position={[x, 0, 8]}>
          <Dispenser position={[0, 0, 0]} rotation={0} />
          <group position={[0, 2.35, 0.3]}>
            <DispenserStatusSign mode="daughter" />
          </group>
        </group>
      ))}

      {/* priority panel + kiosk */}
      <DaughterPartPicker part="daughter-priority">
        <group position={[-7, 0, 2]}>
          <PriorityPanel source={daughterSource()} />
        </group>
      </DaughterPartPicker>
      <group position={[8, 0, 4]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={kioskMat}><boxGeometry args={[3, 2.4, 3]} /></mesh>
        <mesh position={[0, 1.4, 1.51]} material={glass('#9fc4d8')}><boxGeometry args={[1.6, 0.8, 0.05]} /></mesh>
        <mesh position={[0, 2.5, 0]} material={capMat}><boxGeometry args={[3.2, 0.2, 3.2]} /></mesh>
        <SignPlane text="KIOSK" width={1.4} position={[0, 0.7, 1.52]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, radius: 4, paddingX: 14 }} />
      </group>

      {/* ⚠ NO PIPELINE — NO COMPRESSOR */}
      <group position={[10, 0, -12]}>
        <mesh position={[0, 1.2, 0]} castShadow material={poleMat}><boxGeometry args={[0.08, 2.4, 0.08]} /></mesh>
        <SignPlane text="⚠ NO PIPELINE — NO COMPRESSOR" width={3.2} position={[0, 2.2, 0]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 6, paddingX: 14 }} doubleSide />
      </group>
    </group>
  );
}
