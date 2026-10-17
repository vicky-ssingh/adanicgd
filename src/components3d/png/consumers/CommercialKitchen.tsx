import { useMemo } from 'react';
import * as THREE from 'three';
import { concrete, paintedMetal } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { closeAllPanels } from '@/state/panels';

/**
 * Section 10 Part B — commercial PNG. A ground-mounted ventilated meter cabinet
 * (regulator, filter, slam-shut, gauge, lockable iso valve, bollards) feeding a
 * commercial kitchen: two 6-burner ranges with heavy grates + splashback + oven,
 * a tandoor, a stainless extraction hood with baffle filters + duct, a GI manifold
 * header with drops + isolation cocks, a red emergency shutoff lever by the exit,
 * and a ceiling gas detector. Clickable → commercial info panel.
 */
const SS = new THREE.MeshStandardMaterial({ color: '#c4cace', metalness: 0.7, roughness: 0.28 });
const SS_DARK = new THREE.MeshStandardMaterial({ color: '#8b9298', metalness: 0.7, roughness: 0.35 });
const BLACK = new THREE.MeshStandardMaterial({ color: '#16181c', metalness: 0.3, roughness: 0.6 });
const GI = new THREE.MeshStandardMaterial({ color: '#9fa6ac', metalness: 0.65, roughness: 0.45 });
const RED = new THREE.MeshStandardMaterial({ color: '#c01a1a', metalness: 0.2, roughness: 0.5 });
const YELLOW = new THREE.MeshStandardMaterial({ color: '#e8b600', metalness: 0.4, roughness: 0.5 });
const CLAY = new THREE.MeshStandardMaterial({ color: '#8a4a32', metalness: 0.1, roughness: 0.8 });
const flameMat = new THREE.MeshBasicMaterial({ color: '#4a9eff', transparent: true, opacity: 0.8, toneMapped: false });

const W = 6.0, D = 4.4, H = 3.2;

/** A 6-burner commercial range (2×3 layout, heavy grates, splashback, oven). */
function Range({ pos }: { pos: [number, number, number] }) {
  const burners: [number, number][] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) burners.push([-0.55 + r * 0.55, -0.2 + c * 0.4]);
  return (
    <group position={pos}>
      {/* body + adjustable feet */}
      {[[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]].map((f, i) => (
        <mesh key={i} position={[f[0], 0.05, f[1]]} material={SS_DARK}><cylinderGeometry args={[0.03, 0.03, 0.1, 8]} /></mesh>
      ))}
      <mesh position={[0, 0.45, 0]} castShadow material={SS}><boxGeometry args={[1.8, 0.7, 0.9]} /></mesh>
      {/* oven door + handle */}
      <mesh position={[0, 0.4, 0.46]} material={SS_DARK}><boxGeometry args={[1.5, 0.5, 0.02]} /></mesh>
      <mesh position={[0, 0.6, 0.48]} material={BLACK}><boxGeometry args={[1.2, 0.03, 0.04]} /></mesh>
      {/* splashback */}
      <mesh position={[0, 1.05, -0.45]} material={SS_DARK}><boxGeometry args={[1.8, 0.5, 0.03]} /></mesh>
      {/* heavy cast grates spanning the top */}
      {[-0.55, 0, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.83, 0]} material={BLACK}><boxGeometry args={[0.5, 0.03, 0.86]} /></mesh>
      ))}
      {burners.map((b, i) => (
        <group key={i} position={[b[0], 0.82, b[1]]}>
          <mesh material={BLACK}><cylinderGeometry args={[0.08, 0.09, 0.04, 16]} /></mesh>
          <mesh position={[0, 0.04, 0]} material={flameMat}><coneGeometry args={[0.06, 0.14, 12]} /></mesh>
        </group>
      ))}
      {/* control knob bank */}
      {[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0.47]} rotation={[Math.PI / 2, 0, 0]} material={BLACK}><cylinderGeometry args={[0.035, 0.035, 0.04, 12]} /></mesh>
      ))}
    </group>
  );
}

export function CommercialKitchen({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const floorMat = useMemo(() => concrete('#c9ccce', 420), []);
  const wallMat = useMemo(() => paintedMetal('#e4e7ea', 421), []);

  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); usePngConsumerStore.getState().openPanel('commercial'); };
  const cursor = (v: string) => (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = v; };

  return (
    <group position={position} rotation={[0, rotation, 0]} onClick={onClick} onPointerOver={cursor('pointer')} onPointerOut={() => (document.body.style.cursor = 'auto')}>
      {/* plinth + floor + two cutaway walls */}
      <mesh position={[0, -0.15, 0]} receiveShadow material={concrete('#8d8980', 422)}><boxGeometry args={[W + 0.6, 0.3, D + 0.6]} /></mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow material={floorMat}><boxGeometry args={[W, 0.06, D]} /></mesh>
      <mesh position={[0, H / 2, -D / 2]} castShadow receiveShadow material={wallMat}><boxGeometry args={[W, H, 0.14]} /></mesh>
      <mesh position={[-W / 2, H / 2, 0]} castShadow receiveShadow material={wallMat}><boxGeometry args={[0.14, H, D]} /></mesh>

      {/* two 6-burner ranges against the back wall */}
      <Range pos={[-1.4, 0, -D / 2 + 0.6]} />
      <Range pos={[0.7, 0, -D / 2 + 0.6]} />

      {/* extraction hood above the ranges with baffle filters + light strips + duct */}
      <group position={[-0.3, 2.35, -D / 2 + 0.6]}>
        <mesh material={SS}><boxGeometry args={[4.4, 0.5, 1.2]} /></mesh>
        <mesh position={[0, -0.24, 0.2]} material={SS_DARK}><boxGeometry args={[4.2, 0.05, 0.7]} /></mesh>
        {/* angled baffle filters */}
        {[-1.5, -0.9, -0.3, 0.3, 0.9, 1.5].map((x, i) => (
          <mesh key={i} position={[x, -0.2, 0.2]} rotation={[0.5, 0, 0]} material={SS_DARK}><boxGeometry args={[0.5, 0.28, 0.02]} /></mesh>
        ))}
        {/* light strips */}
        <mesh position={[0, -0.24, -0.35]} material={new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#fff2cc'), emissiveIntensity: 0.8 })}><boxGeometry args={[4, 0.04, 0.1]} /></mesh>
        {/* duct to ceiling */}
        <mesh position={[1.6, 0.5, 0]} material={SS}><boxGeometry args={[0.7, 0.6, 0.7]} /></mesh>
      </group>

      {/* tandoor: stainless housing + clay opening + base gas ring */}
      <group position={[2.1, 0, -D / 2 + 0.7]}>
        <mesh position={[0, 0.5, 0]} castShadow material={SS}><cylinderGeometry args={[0.38, 0.4, 1.0, 20]} /></mesh>
        <mesh position={[0, 1.0, 0]} material={CLAY}><cylinderGeometry args={[0.22, 0.24, 0.06, 20]} /></mesh>
        <mesh position={[0, 1.0, 0]} material={BLACK}><cylinderGeometry args={[0.18, 0.18, 0.04, 20]} /></mesh>
        <mesh position={[0, 1.03, 0]} material={new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.5, toneMapped: false })}><cylinderGeometry args={[0.16, 0.16, 0.02, 16]} /></mesh>
        <mesh position={[0, 0.12, 0]} material={new THREE.MeshBasicMaterial({ color: '#4a9eff', transparent: true, opacity: 0.6, toneMapped: false })}><torusGeometry args={[0.2, 0.02, 6, 20]} /></mesh>
        <SignPlane text="TANDOOR" width={0.6} position={[0, 0.5, 0.41]} options={{ fg: '#fff', bg: '#8a4a32', fontWeight: 700 }} />
      </group>

      {/* GI manifold header along the back wall + drops + iso cocks */}
      <mesh position={[0, 1.7, -D / 2 + 0.15]} rotation={[0, 0, Math.PI / 2]} material={GI}><cylinderGeometry args={[0.045, 0.045, 5.4, 12]} /></mesh>
      {[-1.4, 0.7, 2.1].map((x, i) => (
        <group key={i} position={[x, 0, -D / 2 + 0.15]}>
          <mesh position={[0, 1.25, 0]} material={GI}><cylinderGeometry args={[0.03, 0.03, 0.9, 10]} /></mesh>
          <mesh position={[0, 0.82, 0]} material={YELLOW}><boxGeometry args={[0.07, 0.02, 0.02]} /></mesh>
        </group>
      ))}

      {/* emergency shutoff lever (red) by the exit + signage */}
      <group position={[W / 2 - 0.3, 1.4, D / 2 - 0.4]}>
        <mesh material={BLACK}><boxGeometry args={[0.16, 0.24, 0.1]} /></mesh>
        <mesh position={[0, 0.08, 0.08]} rotation={[0, 0, -0.5]} material={RED}><boxGeometry args={[0.04, 0.18, 0.04]} /></mesh>
        <SignPlane text="EMERGENCY GAS SHUT-OFF" width={0.7} position={[0, -0.22, 0.06]} options={{ fg: '#fff', bg: '#c01a1a', fontWeight: 800 }} />
      </group>

      {/* ceiling gas detector above the range */}
      <group position={[-0.3, H - 0.15, -D / 2 + 0.8]}>
        <mesh material={SS_DARK}><cylinderGeometry args={[0.06, 0.06, 0.08, 12]} /></mesh>
        <mesh position={[0, -0.05, 0]} material={new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 1 })}><cylinderGeometry args={[0.02, 0.02, 0.01, 8]} /></mesh>
      </group>

      {/* ── ground-mounted ventilated meter cabinet in front (+Z), on a plinth ── */}
      <group position={[-2.2, 0, D / 2 + 1.2]}>
        <mesh position={[0, 0.1, 0]} material={concrete('#b3afa6', 423)}><boxGeometry args={[0.9, 0.2, 0.5]} /></mesh>
        <mesh position={[0, 0.55, 0]} castShadow material={paintedMetal('#c9ccd0', 424)}><boxGeometry args={[0.7, 0.6, 0.35]} /></mesh>
        {/* louvred door */}
        {[-0.18, -0.09, 0, 0.09, 0.18].map((y, i) => (
          <mesh key={i} position={[0, 0.55 + y, 0.18]} material={SS_DARK}><boxGeometry args={[0.5, 0.02, 0.01]} /></mesh>
        ))}
        <mesh position={[0.22, 0.55, 0.18]} material={BLACK}><boxGeometry args={[0.03, 0.12, 0.02]} /></mesh>
        <SignPlane text="ADANI TOTAL GAS — COMMERCIAL PNG METER" width={0.68} position={[0, 0.82, 0]} options={{ fg: '#fff', bg: '#0B74B0', fontWeight: 700, letterSpacing: 0.5 }} />
        {/* internals peeking above: regulator + filter + slam-shut + gauge */}
        <mesh position={[-0.2, 0.95, 0]} material={SS}><cylinderGeometry args={[0.09, 0.11, 0.14, 16]} /></mesh>
        <mesh position={[0.05, 0.98, 0]} material={SS_DARK}><cylinderGeometry args={[0.06, 0.06, 0.22, 12]} /></mesh>
        <mesh position={[0.22, 0.95, 0]} material={RED}><boxGeometry args={[0.08, 0.12, 0.08]} /></mesh>
        <mesh position={[-0.05, 1.06, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#f2f2f2' })}><cylinderGeometry args={[0.04, 0.04, 0.02, 16]} /></mesh>
        {/* lockable iso valve handle */}
        <mesh position={[-0.28, 0.75, 0.12]} rotation={[0, 0, Math.PI / 2]} material={BLACK}><cylinderGeometry args={[0.012, 0.012, 0.16, 8]} /></mesh>
        {/* 2 protective bollards */}
        {[-0.5, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0.4, 0.4]} material={YELLOW}><cylinderGeometry args={[0.06, 0.06, 0.8, 12]} /></mesh>
        ))}
      </group>

      {/* signage */}
      <SignPlane text="SHOPPERS' PLAZA — FOOD COURT · COMMERCIAL PNG" width={4.4} position={[0, 0.35, D / 2 + 0.05]} options={{ fg: '#fff', bg: '#0F8B8D', fontWeight: 800, letterSpacing: 1 }} />
    </group>
  );
}
