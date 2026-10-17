import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { paintedMetal, steel, emissive } from '@/materials/materials';
import { PipeRun } from '@/components3d/primitives/Pipe';
import { BRAND } from '@/theme/tokens';
import { SignPlane } from '@/components3d/branding/Branding';
import { useStationStore, STATION_PRICE_PER_KG } from '@/state/useStationStore';

/**
 * Section 01 §3.6 — CNG Dispenser. A tapered, three-section body (never a plain
 * box): full-depth lower housing, a display bay whose face tilts back 15°, and a
 * rounded top cap. Front detail: an animated LCD (price / kg / ₹ amount), an
 * ADANI CNG brand panel, keypad, card reader, receipt slot, access panel and a
 * side e-stop. A hose hangs in a natural catenary curve to a CNG nozzle in its
 * holster. On the `active` unit the display counts up during a refuel.
 * Front faces −Z.
 */

/** Self-updating LCD (imperative canvas texture — avoids per-frame re-renders). */
function DisplayLCD({ active }: { active: boolean }) {
  const { tex, ctx, canvas } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const x = c.getContext('2d')!;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, ctx: x, canvas: c };
  }, []);
  const acc = useRef(0);
  const draw = useRef((kg: number, amt: number) => {
    ctx.fillStyle = '#06120f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7be3c0';
    ctx.font = '700 22px Inter, sans-serif';
    ctx.fillText('₹ / kg', 14, 26);
    ctx.fillText('kg', 14, 74);
    ctx.fillText('₹', 14, 122);
    ctx.textAlign = 'right';
    ctx.font = '800 34px Inter, monospace';
    ctx.fillStyle = '#8ef3d6';
    ctx.fillText(STATION_PRICE_PER_KG.toFixed(2), 244, 26);
    ctx.fillStyle = '#eaf6ff';
    ctx.fillText(kg.toFixed(2), 244, 74);
    ctx.fillStyle = '#ffe08a';
    ctx.fillText(amt.toFixed(1), 244, 122);
    ctx.textAlign = 'left';
    tex.needsUpdate = true;
  });

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < 0.12) return;
    acc.current = 0;
    const s = useStationStore.getState();
    if (active && s.refueling) draw.current(s.dispensedKg, s.amount);
    else draw.current(0, 0);
  });

  return (
    <mesh position={[0, 0, 0.001]}>
      <planeGeometry args={[0.44, 0.28]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export function Dispenser({
  position = [0, 0, 0],
  rotation = 0,
  active = false,
}: {
  position?: [number, number, number];
  rotation?: number;
  active?: boolean;
}) {
  const bodyMat = useMemo(() => paintedMetal('#dcdee1', 110), []);
  const capMat = useMemo(() => paintedMetal(BRAND.primary, 111), []);
  const steelMat = useMemo(() => steel({ color: '#8a9199', seed: 112 }), []);
  const darkMat = useMemo(() => steel({ color: '#10161d', roughness: 0.3, seed: 113 }), []);
  const brandMat = useMemo(() => emissive(BRAND.primary, 0.7), []);
  const hoseMat = useMemo(() => steel({ color: '#15181c', roughness: 0.85, metalness: 0.1, seed: 114 }), []);
  const rubberMat = useMemo(() => steel({ color: '#0d0f12', roughness: 0.9, metalness: 0.05, seed: 115 }), []);
  const holsterRef = useRef<THREE.Group>(null);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* plinth island with rounded ends + yellow safety edge */}
      <RoundedBox args={[1.4, 0.24, 0.9]} radius={0.11} smoothness={4} position={[0, 0.12, 0]} castShadow receiveShadow material={steelMat} />
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={paintedMetal('#e6b422', 116)}>
        <ringGeometry args={[0.62, 0.72, 24]} />
      </mesh>

      {/* lower section (full depth) */}
      <RoundedBox args={[1.05, 1.1, 0.5]} radius={0.04} smoothness={3} position={[0, 0.79, 0]} castShadow receiveShadow material={bodyMat} />
      {/* mid accent band */}
      <mesh position={[0, 1.0, 0.251]} material={capMat}>
        <boxGeometry args={[1.06, 0.08, 0.02]} />
      </mesh>
      {/* display bay — angled front face tilted back 15° */}
      <group position={[0, 1.45, 0]}>
        <RoundedBox args={[1.05, 0.7, 0.5]} radius={0.04} smoothness={3} castShadow receiveShadow material={bodyMat} />
        <group position={[0, 0.02, 0.255]} rotation={[-0.26, 0, 0]}>
          {/* brand panel */}
          <mesh position={[0, 0.22, 0]} material={brandMat}>
            <boxGeometry args={[0.6, 0.14, 0.02]} />
          </mesh>
          <SignPlane text="ADANI CNG" width={0.52} position={[0, 0.22, 0.012]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 2 }} />
          {/* LCD */}
          <mesh position={[0, -0.02, 0]} material={darkMat}>
            <boxGeometry args={[0.5, 0.32, 0.02]} />
          </mesh>
          <group position={[0, -0.02, 0.011]}>
            <DisplayLCD active={active} />
          </group>
        </group>
      </group>
      {/* rounded top cap */}
      <RoundedBox args={[0.9, 0.2, 0.42]} radius={0.09} smoothness={4} position={[0, 1.9, 0]} castShadow material={capMat} />

      {/* keypad */}
      <mesh position={[0.22, 1.02, 0.251]} material={darkMat}>
        <boxGeometry args={[0.22, 0.26, 0.02]} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[0.14 + (i % 3) * 0.08, 1.12 - Math.floor(i / 3) * 0.06, 0.262]} material={steelMat}>
          <boxGeometry args={[0.05, 0.04, 0.01]} />
        </mesh>
      ))}
      {/* card reader + LED */}
      <mesh position={[-0.28, 1.05, 0.251]} material={darkMat}>
        <boxGeometry args={[0.14, 0.05, 0.03]} />
      </mesh>
      <mesh position={[-0.28, 1.09, 0.27]} material={emissive('#39d98a', 1.2)}>
        <boxGeometry args={[0.03, 0.02, 0.01]} />
      </mesh>
      {/* receipt slot with overhang */}
      <mesh position={[-0.28, 0.9, 0.255]} material={darkMat}>
        <boxGeometry args={[0.16, 0.02, 0.02]} />
      </mesh>
      {/* access panel with corner screws + seam */}
      <mesh position={[0, 0.5, 0.252]} material={paintedMetal('#cfd2d6', 117)}>
        <boxGeometry args={[0.8, 0.42, 0.01]} />
      </mesh>
      {([[-0.35, 0.66], [0.35, 0.66], [-0.35, 0.34], [0.35, 0.34]] as const).map((p, i) => (
        <mesh key={i} position={[p[0], p[1], 0.258]} material={steelMat}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 6]} />
        </mesh>
      ))}
      {/* e-stop on the side */}
      <mesh position={[0.53, 1.1, 0]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#f2d21e', 118)}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
      </mesh>
      <mesh position={[0.545, 1.1, 0]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#c01a1a', 119)}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 12]} />
      </mesh>

      {/* nozzle holster (moulded cradle) */}
      <group ref={holsterRef} position={[-0.5, 1.25, 0.1]}>
        <mesh rotation={[0, 0, -0.25]} castShadow material={steelMat}>
          <boxGeometry args={[0.1, 0.34, 0.14]} />
        </mesh>
      </group>

      {/* dispensing hose — natural catenary curve from top to holster */}
      <PipeRun
        points={[
          [-0.5, 1.82, 0.1],
          [-0.72, 1.35, 0.22],
          [-0.66, 0.85, 0.3],
          [-0.5, 1.05, 0.16],
        ]}
        radius={0.028}
        color="#15181c"
        roughness={0.85}
        metalness={0.1}
        seed={120}
        tension={0.4}
        radialSegments={8}
      />
      {/* spiral/braided wrap band on part of the hose */}
      <mesh position={[-0.7, 1.15, 0.26]} rotation={[0.3, 0, 0.2]} material={rubberMat}>
        <cylinderGeometry args={[0.035, 0.035, 0.22, 8]} />
      </mesh>
      {/* breakaway coupling mid-hose */}
      <mesh position={[-0.66, 0.95, 0.28]} material={steelMat}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 10]} />
      </mesh>

      {/* CNG nozzle in the holster: grip body + coupling head + collar + trigger */}
      <group position={[-0.5, 1.15, 0.16]} rotation={[0.3, 0, 0]}>
        <mesh material={rubberMat}>
          <cylinderGeometry args={[0.045, 0.045, 0.22, 12]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} material={steelMat}>
          <cylinderGeometry args={[0.055, 0.055, 0.1, 12]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} material={paintedMetal(BRAND.primary, 121)}>
          <torusGeometry args={[0.055, 0.015, 8, 16]} />
        </mesh>
        {/* trigger */}
        <mesh position={[0.04, 0.0, 0.06]} rotation={[0.5, 0, 0]} material={hoseMat}>
          <boxGeometry args={[0.02, 0.09, 0.03]} />
        </mesh>
      </group>
    </group>
  );
}
