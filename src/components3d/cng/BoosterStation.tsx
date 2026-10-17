import { useMemo } from 'react';
import { Canopy } from './Canopy';
import { Dispenser } from './Dispenser';
import { PriorityPanel } from './PriorityPanel';
import { boosterSource } from '@/state/cascadeSources';
import { CascadeTrailerUnit } from './CascadeTrailerUnit';
import { DischargePanel } from './DischargePanel';
import { DispenserStatusSign } from './DispenserStatusSign';
import { Compressor } from './Compressor';
import { BufferStorage } from './BufferStorage';
import { DaughterPartPicker } from './DaughterPartPicker';
import { Pipe } from '@/components3d/primitives/Pipe';
import { concrete, asphalt, paintedMetal, steel, glass } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { useSimStore } from '@/state/useSimStore';
import { useDaughterStore, boosterView, trailerBanks } from '@/state/useDaughterStore';
import { useValveStore } from '@/state/useValveStore';
import { PipeRun } from '@/components3d/primitives/Pipe';

/**
 * Section 04 Part B — CNG DAUGHTER BOOSTER STATION (cascade-fed + booster, NO
 * pipeline). A small booster compressor keeps the dispensing pressure a CONSTANT
 * 200 Bar and works harder as the cascade depletes, extracting down to ~40 Bar
 * (85% utilisation) into a buffer that feeds 3 dispensers. Medium arterial site
 * on its own apron. Local origin at plot centre; the road/front is +Z.
 */
export function BoosterStation({ position = [0, 0, 0], rotation = 0 }: { position?: [number, number, number]; rotation?: number }) {
  const apronMat = useMemo(() => concrete('#adaa9f', 880), []);
  const jointMat = useMemo(() => asphalt(881), []);
  const slabMat = useMemo(() => concrete('#b8b5ac', 882), []);
  const chockMat = useMemo(() => paintedMetal('#e6b422', 883), []);
  const wallMat = useMemo(() => paintedMetal('#eef0f2', 884), []);
  const capMat = useMemo(() => paintedMetal(BRAND.primary, 885), []);
  const kioskMat = useMemo(() => paintedMetal('#e7e3d8', 886), []);
  const poleMat = useMemo(() => steel({ color: '#9aa1a8', seed: 887 }), []);

  const getFrac = () => useDaughterStore.getState().b.cascade / 250;
  const getFill = () => (useDaughterStore.getState().b.cascade / 250) * 100;
  const getBanks = () => trailerBanks(useDaughterStore.getState().b.cascade);
  // booster load → fan/vibration factor
  const getIntensity = () => {
    const sim = useSimStore.getState();
    if (!sim.playing) return 1;
    const v = boosterView(useDaughterStore.getState().b);
    return v.status === 'OFFLINE' ? 1 : 1 + (v.load / 100) * 1.4;
  };
  // booster inlet valve (V-601) shut → booster stops; dispensers ride on the direct-fill line
  const boosterInletShut = useValveStore((s) => s.rt['V-601']?.closed ?? false);
  const running = () => {
    const v = boosterView(useDaughterStore.getState().b);
    return v.status !== 'OFFLINE' && !boosterInletShut;
  };

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* apron (own ground) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow material={apronMat}>
        <planeGeometry args={[52, 40]} />
      </mesh>
      {[-18, -12, -6, 0, 6, 12, 18].map((x, i) => (
        <mesh key={i} position={[x, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={jointMat}><planeGeometry args={[0.06, 40]} /></mesh>
      ))}

      {/* boundary wall + gate signs */}
      {([[0, -20, 52, 0.2], [-26, 0, 0.2, 40], [26, 0, 0.2, 40]] as const).map((w, i) => (
        <group key={i}>
          <mesh position={[w[0], 1.2, w[1]]} castShadow material={wallMat}><boxGeometry args={[w[2], 2.4, w[3]]} /></mesh>
          <mesh position={[w[0], 2.45, w[1]]} material={capMat}><boxGeometry args={[w[2] + 0.05, 0.14, w[3] + 0.05]} /></mesh>
        </group>
      ))}
      {[['IN', -8], ['OUT', 8]].map(([t, x], i) => (
        <SignPlane key={i} text={t as string} width={1.6} position={[x as number, 2.8, 20]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, radius: 6, paddingX: 22 }} doubleSide />
      ))}

      {/* pylon sign */}
      <group position={[-22, 0, 17]}>
        <mesh position={[0, 3, 0]} castShadow material={poleMat}><boxGeometry args={[0.35, 6, 0.35]} /></mesh>
        <mesh position={[0, 6.2, 0]} castShadow material={paintedMetal('#ffffff', 888)}><boxGeometry args={[2.6, 2.8, 0.2]} /></mesh>
        <LogoDecal position={[0, 6.9, 0.12]} width={2.0} backing={false} />
        <SignPlane text="CNG DAUGHTER BOOSTER" width={2.3} position={[0, 6.1, 0.12]} options={{ fg: BRAND.primary, fontWeight: 800, letterSpacing: 1 }} />
      </group>

      {/* ── Trailer discharge bay (rear-left) ── */}
      <group position={[-6, 0, -4]}>
        <mesh position={[0, 0.15, 0]} receiveShadow material={slabMat}><boxGeometry args={[16, 0.3, 4.5]} /></mesh>
        {([1.9, -1.9] as const).map((z, i) => (
          <mesh key={i} position={[0, 0.31, z]} rotation={[-Math.PI / 2, 0, 0]} material={chockMat}><planeGeometry args={[13, 0.1]} /></mesh>
        ))}
        <SignPlane text="CASCADE TRAILER — DISCHARGE POSITION" width={8} position={[0, 0.32, 1.3]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#e6b422', fontWeight: 800, letterSpacing: 1 }} />
        {[-6, -3.5, -1, 1.5, 4, 6.5].map((x, i) => ([2.4, -2.4] as const).map((z) => (
          <mesh key={`${i}${z}`} position={[x, 0.75, z]} castShadow material={chockMat}><cylinderGeometry args={[0.09, 0.09, 1.1, 10]} /></mesh>
        )))}
        {([-4, -2] as const).map((x, i) => (
          <mesh key={i} position={[x, 0.42, 1.3]} rotation={[0, 0, 0.5]} material={chockMat}><boxGeometry args={[0.3, 0.24, 0.5]} /></mesh>
        ))}
        {([[-7.5, -2.2], [7.5, -2.2], [-7.5, 2.2], [7.5, 2.2]] as const).map((c, i) => (
          <mesh key={i} position={[c[0], 2.75, c[1]]} castShadow material={capMat}><boxGeometry args={[0.35, 5.5, 0.35]} /></mesh>
        ))}
        <mesh position={[0, 5.7, 0]} castShadow material={paintedMetal('#d5d8dc', 889)}><boxGeometry args={[17, 0.35, 5.5]} /></mesh>
        {([1, -1] as const).map((s) => (
          <SignPlane key={s} text="CASCADE DISCHARGE BAY" width={7} position={[0, 5.7, s * 2.8]} rotation={[0, s === 1 ? 0 : Math.PI, 0]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, letterSpacing: 2 }} />
        ))}
        <CascadeTrailerUnit id="CT-07" pose={{ pos: [5.5, 0, 0], rot: 0, getFill, getBanks, doorsOpen: true, legsDown: true }} />
        <DaughterPartPicker part="booster-discharge">
          <group position={[-8.5, 0, 0]} rotation={[0, Math.PI, 0]}>
            <DischargePanel mode="booster" getCascadeFrac={getFrac} />
          </group>
        </DaughterPartPicker>
      </group>

      {/* ── Booster compressor (VISIBLY SMALLER) + buffer storage (right) ── */}
      <DaughterPartPicker part="booster-compressor">
        <group position={[16, 0, -8]} scale={0.62}>
          <Compressor running={running()} getIntensity={getIntensity} label="BOOSTER COMPRESSOR — UNIT 01" />
        </group>
      </DaughterPartPicker>
      {/* suction pipe (from discharge panel) + discharge pipe (to buffer) */}
      <Pipe from={[3, 0.9, -6]} to={[13, 0.9, -7.5]} radius={0.06} color="#b0b6bd" seed={890} />
      <Pipe from={[18, 0.9, -7]} to={[18, 0.9, 1]} radius={0.05} color="#c98f6b" seed={891} />
      {/* direct-fill line (2D reference): tee off the cascade outlet, bypasses the
          booster straight to the dispenser island when cascade pressure is high */}
      <mesh position={[4, 0.9, -6.15]} material={poleMat}><sphereGeometry args={[0.1, 10, 8]} /></mesh>
      <PipeRun points={[[4, 0.9, -6.15], [4.4, 0.5, -5.6], [4.4, 0.5, 7.6], [1.6, 0.5, 7.6], [1.6, 0.5, 9.3], [1.6, 0.05, 9.3]]} radius={0.05} color="#c98f6b" seed={892} radialSegments={10} />
      {[-3, 1, 5].map((z) => (
        <mesh key={z} position={[4.4, 0.22, z]} castShadow material={slabMat}><boxGeometry args={[0.3, 0.44, 0.3]} /></mesh>
      ))}
      <SignPlane text="DIRECT FILL LINE" width={1.2} position={[4.62, 0.62, 2]} rotation={[0, Math.PI / 2, 0]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800 }} doubleSide />
      <DaughterPartPicker part="booster-buffer">
        <group position={[16, 0, 3]}>
          <BufferStorage />
        </group>
      </DaughterPartPicker>

      {/* ── Retail: canopy + 3 dispensers (front) ── */}
      <DaughterPartPicker part="booster-station">
        <group position={[-2, 0, 10]}>
          <Canopy width={11} depth={7} height={5.2} />
        </group>
      </DaughterPartPicker>
      {[-5, -2, 1].map((x, i) => (
        <group key={i} position={[x, 0, 10]}>
          <Dispenser position={[0, 0, 0]} rotation={0} />
          <group position={[0, 2.35, 0.3]}>
            <DispenserStatusSign mode="booster" />
          </group>
        </group>
      ))}

      {/* priority panel + kiosk */}
      <DaughterPartPicker part="daughter-priority">
        <group position={[-14, 0, 4]}>
          <PriorityPanel source={boosterSource()} />
        </group>
      </DaughterPartPicker>
      <group position={[10, 0, 12]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={kioskMat}><boxGeometry args={[3, 2.4, 3]} /></mesh>
        <mesh position={[0, 1.4, 1.51]} material={glass('#9fc4d8')}><boxGeometry args={[1.6, 0.8, 0.05]} /></mesh>
        <mesh position={[0, 2.5, 0]} material={capMat}><boxGeometry args={[3.2, 0.2, 3.2]} /></mesh>
        <SignPlane text="KIOSK" width={1.4} position={[0, 0.7, 1.52]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, radius: 4, paddingX: 14 }} />
      </group>

      {/* ⚠ NO PIPELINE — BOOSTER FED */}
      <group position={[16, 0, -16]}>
        <mesh position={[0, 1.2, 0]} castShadow material={poleMat}><boxGeometry args={[0.08, 2.4, 0.08]} /></mesh>
        <SignPlane text="⚠ NO PIPELINE — BOOSTER FED" width={3.2} position={[0, 2.2, 0]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 6, paddingX: 14 }} doubleSide />
      </group>
    </group>
  );
}
