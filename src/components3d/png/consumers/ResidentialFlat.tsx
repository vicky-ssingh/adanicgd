import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { concrete, paintedMetal, glass } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { useSimStore } from '@/state/useSimStore';
import { closeAllPanels } from '@/state/panels';

/**
 * Section 10 Part A — residential PNG interior. A cutaway flat continuing the
 * external wall pipe INTO the kitchen: a wall-penetration sleeve, a yellow-lever
 * entry valve, galvanised-iron (GI) pipe run with threaded elbows / clips / "GAS"
 * bands / a union, an appliance cock + orange flexible hose, a detailed gas stove
 * (star trivets, burner caps + ports, ignition electrodes, thermocouples, knurled
 * knobs) that lights blue flames on ignite, and a wall gas water heater with a
 * flue through the wall. A translucent facade shows external→internal continuity.
 * Clickable → residential info panel. Ignite is driven by the consumer store.
 */
const GI = new THREE.MeshStandardMaterial({ color: '#9fa6ac', metalness: 0.65, roughness: 0.45 });
const GI_FIT = new THREE.MeshStandardMaterial({ color: '#aab0b6', metalness: 0.6, roughness: 0.5 });
const YELLOW = new THREE.MeshStandardMaterial({ color: '#e8b600', metalness: 0.4, roughness: 0.5 });
const ORANGE = new THREE.MeshStandardMaterial({ color: '#d1622a', metalness: 0.1, roughness: 0.7 });
const BLACK = new THREE.MeshStandardMaterial({ color: '#16181c', metalness: 0.3, roughness: 0.6 });
const STEEL_TOP = new THREE.MeshStandardMaterial({ color: '#1c2026', metalness: 0.35, roughness: 0.18 });
const CHROME = new THREE.MeshStandardMaterial({ color: '#c9ced4', metalness: 0.9, roughness: 0.2 });
const WHITE = new THREE.MeshStandardMaterial({ color: '#eef1f4', metalness: 0.1, roughness: 0.6 });
const CERAMIC = new THREE.MeshStandardMaterial({ color: '#f0efe9', metalness: 0, roughness: 0.5 });
// §17 fit-out — premium interior + exterior fixture palette
const TILE = new THREE.MeshStandardMaterial({ color: '#e9eef2', metalness: 0.05, roughness: 0.28 });
const HOOD = new THREE.MeshStandardMaterial({ color: '#cfd4d9', metalness: 0.85, roughness: 0.24 });
const FRIDGE = new THREE.MeshStandardMaterial({ color: '#d7dde2', metalness: 0.55, roughness: 0.35 });
const AC_BODY = new THREE.MeshStandardMaterial({ color: '#eef1f4', metalness: 0.15, roughness: 0.55 });
const RAIL = new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.9, roughness: 0.22 });
const CEIL_LIGHT = new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffe6ad', emissiveIntensity: 0.9, roughness: 0.4 });
const PLANT_POT = new THREE.MeshStandardMaterial({ color: '#9c5a3c', metalness: 0.05, roughness: 0.8 });
const FOLIAGE = new THREE.MeshStandardMaterial({ color: '#3f7d3a', metalness: 0, roughness: 0.85 });
const PLATE_704 = new THREE.MeshStandardMaterial({ color: '#1c2732', metalness: 0.6, roughness: 0.4 });

const W = 4.6, D = 3.8, H = 2.7;

/** Detailed 4-burner cooktop; flames + point lights appear when ignited. */
function GasStove({ pos }: { pos: [number, number, number] }) {
  const flamesRef = useRef<THREE.Group>(null);
  const lightsRef = useRef<THREE.Group>(null);
  const burners: [number, number][] = [[-0.16, -0.11], [0.16, -0.11], [-0.16, 0.13], [0.16, 0.13]];

  useFrame((state) => {
    const on = usePngConsumerStore.getState().burnersOn;
    const t = state.clock.elapsedTime;
    const fg = flamesRef.current, lg = lightsRef.current;
    if (fg) fg.children.forEach((f, i) => {
      f.visible = on;
      if (on) { const fl = 0.85 + Math.sin(t * 50 + i * 1.7) * 0.15; f.scale.set(fl, 0.8 + fl * 0.5, fl); }
    });
    if (lg) lg.children.forEach((l, i) => {
      const light = l as THREE.PointLight;
      light.intensity = on ? 1.1 + Math.sin(t * 45 + i) * 0.25 : 0;
    });
  });

  const flameMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#4a9eff', transparent: true, opacity: 0.85, toneMapped: false }), []);
  const tipMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dcecff', transparent: true, opacity: 0.7, toneMapped: false }), []);

  return (
    <group position={pos}>
      {/* body on 4 rubber feet */}
      {[[-0.27, -0.22], [0.27, -0.22], [-0.27, 0.22], [0.27, 0.22]].map((f, i) => (
        <mesh key={i} position={[f[0], 0.01, f[1]]} material={BLACK}><cylinderGeometry args={[0.02, 0.02, 0.02, 8]} /></mesh>
      ))}
      <mesh position={[0, 0.07, 0]} castShadow material={CHROME}><boxGeometry args={[0.6, 0.09, 0.5]} /></mesh>
      {/* black glass top + edge trim */}
      <mesh position={[0, 0.125, 0]} material={STEEL_TOP}><boxGeometry args={[0.6, 0.02, 0.5]} /></mesh>
      <mesh position={[0, 0.13, 0]} material={CHROME}><boxGeometry args={[0.62, 0.008, 0.52]} /></mesh>
      {/* inlet stub at rear + manufacturer badge */}
      <mesh position={[0, 0.06, -0.26]} rotation={[Math.PI / 2, 0, 0]} material={CHROME}><cylinderGeometry args={[0.018, 0.018, 0.06, 8]} /></mesh>
      <SignPlane text="ADANI" width={0.14} position={[0, 0.06, 0.251]} options={{ fg: '#c9ced4', bg: '#16181c', fontWeight: 800 }} />

      {burners.map((b, i) => (
        <group key={i} position={[b[0], 0.14, b[1]]}>
          {/* burner head ring with flame ports */}
          <mesh material={BLACK}><cylinderGeometry args={[0.04, 0.045, 0.02, 16]} /></mesh>
          {Array.from({ length: 12 }).map((_, k) => (
            <mesh key={k} position={[Math.cos(k / 12 * Math.PI * 2) * 0.04, 0.008, Math.sin(k / 12 * Math.PI * 2) * 0.04]} material={CHROME}><boxGeometry args={[0.006, 0.006, 0.006]} /></mesh>
          ))}
          {/* burner cap (domed) */}
          <mesh position={[0, 0.022, 0]} material={BLACK}><sphereGeometry args={[0.0375, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          {/* star trivet (4-arm) */}
          {Array.from({ length: 4 }).map((_, k) => (
            <mesh key={k} position={[0, 0.03, 0]} rotation={[0, k / 4 * Math.PI * 2, 0]} material={BLACK}>
              <boxGeometry args={[0.16, 0.012, 0.014]} />
            </mesh>
          ))}
          {/* ignition electrode (white ceramic) + thermocouple */}
          <mesh position={[0.05, 0.02, 0]} material={CERAMIC}><cylinderGeometry args={[0.005, 0.005, 0.05, 6]} /></mesh>
          <mesh position={[-0.05, 0.02, 0]} material={CHROME}><cylinderGeometry args={[0.004, 0.004, 0.045, 6]} /></mesh>
        </group>
      ))}

      {/* flames */}
      <group ref={flamesRef}>
        {burners.map((b, i) => (
          <group key={i} position={[b[0], 0.17, b[1]]} visible={false}>
            <mesh material={flameMat}><coneGeometry args={[0.035, 0.11, 12]} /></mesh>
            <mesh position={[0, 0.02, 0]} material={tipMat}><coneGeometry args={[0.018, 0.06, 10]} /></mesh>
          </group>
        ))}
      </group>
      <group ref={lightsRef}>
        {burners.map((b, i) => (
          <pointLight key={i} position={[b[0], 0.32, b[1]]} color="#5aa0ff" intensity={0} distance={1.2} decay={2} />
        ))}
      </group>

      {/* knurled control knobs on the front edge */}
      {[-0.21, -0.07, 0.07, 0.21].map((x, i) => (
        <group key={i} position={[x, 0.06, 0.255]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={CHROME}><cylinderGeometry args={[0.022, 0.022, 0.03, 16]} /></mesh>
          <mesh position={[0, 0.018, 0.01]} material={BLACK}><boxGeometry args={[0.004, 0.012, 0.01]} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Wall gas water heater with flue through the wall + external cowl. */
function WaterHeater({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh castShadow material={WHITE}><boxGeometry args={[0.35, 0.55, 0.16]} /></mesh>
      {/* control panel: display + 2 dials */}
      <mesh position={[0, 0.05, 0.085]} material={BLACK}><boxGeometry args={[0.22, 0.14, 0.01]} /></mesh>
      <mesh position={[-0.04, 0.08, 0.092]} material={new THREE.MeshStandardMaterial({ color: '#0a1a10', emissive: new THREE.Color('#1e6b3a'), emissiveIntensity: 0.8 })}><boxGeometry args={[0.09, 0.04, 0.004]} /></mesh>
      {[-0.05, 0.05].map((x, i) => (
        <mesh key={i} position={[x, 0.0, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={CHROME}><cylinderGeometry args={[0.018, 0.018, 0.02, 12]} /></mesh>
      ))}
      {/* pilot window */}
      <mesh position={[0.09, 0.02, 0.088]} material={new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#ff7a1a'), emissiveIntensity: 1 })}><circleGeometry args={[0.012, 12]} /></mesh>
      {/* water pipes (blue/red) + gas cock at the bottom */}
      <mesh position={[-0.1, -0.32, 0.05]} material={new THREE.MeshStandardMaterial({ color: '#2b6cd4', metalness: 0.6, roughness: 0.4 })}><cylinderGeometry args={[0.015, 0.015, 0.14, 8]} /></mesh>
      <mesh position={[0.1, -0.32, 0.05]} material={new THREE.MeshStandardMaterial({ color: '#c23b3b', metalness: 0.6, roughness: 0.4 })}><cylinderGeometry args={[0.015, 0.015, 0.14, 8]} /></mesh>
      <mesh position={[0, -0.32, 0.05]} material={YELLOW}><cylinderGeometry args={[0.012, 0.012, 0.12, 8]} /></mesh>
      {/* flue up and out through the wall + cowl */}
      <mesh position={[0, 0.32, 0]} material={CHROME}><cylinderGeometry args={[0.045, 0.045, 0.14, 12]} /></mesh>
      <mesh position={[0, 0.42, -0.1]} rotation={[Math.PI / 2, 0, 0]} material={CHROME}><cylinderGeometry args={[0.045, 0.045, 0.3, 12]} /></mesh>
      <SignPlane text="ADANI" width={0.16} position={[0, -0.2, 0.082]} options={{ fg: '#0B74B0', bg: '#eef1f4', fontWeight: 800 }} />
    </group>
  );
}

export function ResidentialFlat({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const floorMat = useMemo(() => concrete('#c8c2b4', 400), []);
  const wallMat = useMemo(() => paintedMetal('#ece7db', 401), []);
  const counterMat = useMemo(() => concrete('#d3d7db', 402), []);
  const cabinetMat = useMemo(() => paintedMetal('#b9713f', 403), []);
  const ceilMat = useMemo(() => paintedMetal('#eef0f2', 406), []);
  const slabMat = useMemo(() => concrete('#b7b3aa', 407), []);
  const baseMat = useMemo(() => concrete('#8f8a80', 408), []);
  const corniceMat = useMemo(() => paintedMetal('#d8d2c4', 409), []);
  // Very translucent facade so external→internal continuity reads through it
  // (the shared glass() factory renders opaque, so build a transparent one here).
  const facade = useMemo(() => new THREE.MeshStandardMaterial({ color: '#bcd0e0', transparent: true, opacity: 0.12, roughness: 0.1, metalness: 0, depthWrite: false }), []);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // GI path points (entry valve → ceiling run → drop → stove cock).
  const path = useMemo(() => {
    const ex = -W / 2 + 0.18; // west wall inner face
    return [
      new THREE.Vector3(ex, 1.5, -0.9),
      new THREE.Vector3(ex, 2.4, -0.9),
      new THREE.Vector3(ex, 2.4, -D / 2 + 0.55),
      new THREE.Vector3(0.35, 2.4, -D / 2 + 0.55),
      new THREE.Vector3(0.35, 1.0, -D / 2 + 0.55),
      new THREE.Vector3(0.35, 0.98, -D / 2 + 0.72),
    ];
  }, []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.02), [path]);
  const clipYs = useMemo(() => [0.4, 1.6], []);

  useFrame((_, dt) => {
    const mesh = particlesRef.current;
    if (!mesh) return;
    const on = usePngConsumerStore.getState().burnersOn;
    const sim = useSimStore.getState();
    const step = on && sim.playing ? dt * 0.25 * sim.speed : 0;
    const N = 6;
    for (let i = 0; i < N; i++) {
      const key = `p${i}`;
      let t = ((mesh.userData[key] ?? i / N) + step) % 1;
      mesh.userData[key] = t;
      const p = curve.getPoint(t);
      dummy.position.copy(p);
      dummy.scale.setScalar(on ? 1 : 0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); usePngConsumerStore.getState().openPanel('residential'); };
  const cursor = (v: string) => (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = v; };

  const ex = -W / 2 + 0.18;
  const tubeMat = GI;

  return (
    <group position={position} rotation={[0, rotation, 0]} onClick={onClick} onPointerOver={cursor('pointer')} onPointerOut={() => (document.body.style.cursor = 'auto')}>
      {/* plinth + floor */}
      <mesh position={[0, -0.15, 0]} receiveShadow material={concrete('#8d8980', 404)}><boxGeometry args={[W + 0.6, 0.3, D + 0.6]} /></mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow material={floorMat}><boxGeometry args={[W, 0.06, D]} /></mesh>
      {/* back (−Z) + left (−X) walls */}
      <mesh position={[0, H / 2, -D / 2]} castShadow receiveShadow material={wallMat}><boxGeometry args={[W, H, 0.12]} /></mesh>
      <mesh position={[-W / 2, H / 2, 0]} castShadow receiveShadow material={wallMat}><boxGeometry args={[0.12, H, D]} /></mesh>
      {/* window on back wall */}
      <mesh position={[1.4, 1.6, -D / 2 + 0.07]} material={glass('#aecbe0', 0.25)}><boxGeometry args={[1.1, 0.9, 0.02]} /></mesh>
      <mesh position={[1.4, 1.6, -D / 2 + 0.075]} material={CHROME}><boxGeometry args={[1.16, 0.04, 0.015]} /></mesh>
      {/* translucent facade on the open (+Z) side — external pipe visible through it */}
      <mesh position={[0, H / 2, D / 2]} material={facade}><boxGeometry args={[W, H, 0.04]} /></mesh>

      {/* ── architectural completeness: reads as a flat CUT from a residential
             tower rather than an open box (ceiling + floor plate + a hint of the
             flat above + base skirting + cornice + window frame) ── */}
      {/* ceiling slab */}
      <mesh position={[0, H + 0.02, 0]} castShadow receiveShadow material={ceilMat}><boxGeometry args={[W, 0.12, D]} /></mesh>
      {/* overhanging concrete floor plate of the flat above */}
      <mesh position={[-0.15, H + 0.2, -0.15]} castShadow receiveShadow material={slabMat}><boxGeometry args={[W + 0.5, 0.24, D + 0.5]} /></mesh>
      {/* hint of the flat above (short walls + window + balcony rail) */}
      <mesh position={[0, H + 0.78, -D / 2]} material={wallMat}><boxGeometry args={[W, 0.9, 0.12]} /></mesh>
      <mesh position={[-W / 2, H + 0.78, 0]} material={wallMat}><boxGeometry args={[0.12, 0.9, D]} /></mesh>
      <mesh position={[1.4, H + 0.78, -D / 2 + 0.07]} material={glass('#aecbe0', 0.25)}><boxGeometry args={[1.1, 0.5, 0.02]} /></mesh>
      <mesh position={[W / 2 - 0.1, H + 0.78, D / 2 - 0.1]} material={wallMat}><boxGeometry args={[0.9, 0.9, 0.12]} /></mesh>
      {/* base skirting (darker course at the bottom of the solid walls) */}
      <mesh position={[0, 0.16, -D / 2 + 0.02]} material={baseMat}><boxGeometry args={[W + 0.04, 0.34, 0.16]} /></mesh>
      <mesh position={[-W / 2 + 0.02, 0.16, 0]} material={baseMat}><boxGeometry args={[0.16, 0.34, D + 0.04]} /></mesh>
      {/* cornice band at the wall tops */}
      <mesh position={[0, H - 0.06, -D / 2 + 0.02]} material={corniceMat}><boxGeometry args={[W + 0.12, 0.14, 0.2]} /></mesh>
      <mesh position={[-W / 2 + 0.02, H - 0.06, 0]} material={corniceMat}><boxGeometry args={[0.2, 0.14, D + 0.12]} /></mesh>
      {/* window frame (mullions + sill) on the back-wall window */}
      <group position={[1.4, 1.6, -D / 2 + 0.08]}>
        <mesh material={CHROME}><boxGeometry args={[1.18, 0.05, 0.03]} /></mesh>
        <mesh position={[0, 0.47, 0]} material={CHROME}><boxGeometry args={[1.18, 0.05, 0.03]} /></mesh>
        <mesh position={[0, -0.47, 0]} material={WHITE}><boxGeometry args={[1.24, 0.08, 0.06]} /></mesh>
        <mesh position={[0, 0, 0]} material={CHROME}><boxGeometry args={[0.04, 0.9, 0.03]} /></mesh>
        <mesh position={[-0.59, 0, 0]} material={CHROME}><boxGeometry args={[0.05, 0.94, 0.03]} /></mesh>
        <mesh position={[0.59, 0, 0]} material={CHROME}><boxGeometry args={[0.05, 0.94, 0.03]} /></mesh>
      </group>
      {/* flush entry door on the −X wall */}
      <group position={[-W / 2 + 0.07, 0, D / 2 - 0.7]}>
        <mesh position={[0, 1.05, 0]} material={new THREE.MeshStandardMaterial({ color: '#7d5a3a', roughness: 0.6, metalness: 0.1 })}><boxGeometry args={[0.04, 2.0, 0.9]} /></mesh>
        <mesh position={[0.03, 1.0, 0.3]} material={CHROME}><boxGeometry args={[0.02, 0.12, 0.04]} /></mesh>
      </group>

      {/* counter + cabinets + sink along back wall */}
      <mesh position={[0.2, 0.86, -D / 2 + 0.35]} castShadow receiveShadow material={counterMat}><boxGeometry args={[3.0, 0.08, 0.62]} /></mesh>
      <mesh position={[0.2, 0.45, -D / 2 + 0.35]} material={cabinetMat}><boxGeometry args={[3.0, 0.78, 0.58]} /></mesh>
      <mesh position={[1.35, 0.9, -D / 2 + 0.35]} material={CHROME}><boxGeometry args={[0.5, 0.04, 0.4]} /></mesh>
      <mesh position={[1.35, 0.86, -D / 2 + 0.35]} material={STEEL_TOP}><boxGeometry args={[0.42, 0.08, 0.32]} /></mesh>

      {/* ── external continuity on the −X wall: riser stub + meter + blue valve ── */}
      <group position={[-W / 2 - 0.09, 0, -0.9]}>
        <mesh position={[0, 1.1, 0]} material={YELLOW}><cylinderGeometry args={[0.03, 0.03, 2.0, 10]} /></mesh>
        {[0.5, 1.7].map((y, i) => <mesh key={i} position={[0, y, 0]} material={BLACK}><boxGeometry args={[0.09, 0.04, 0.09]} /></mesh>)}
        {/* white meter box */}
        <mesh position={[-0.11, 1.6, 0]} castShadow material={WHITE}><boxGeometry args={[0.12, 0.18, 0.24]} /></mesh>
        <SignPlane text="ADANI TOTAL GAS" width={0.22} position={[-0.171, 1.66, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#0B74B0', fontWeight: 800 }} />
        <SignPlane text="PNG METER" width={0.16} position={[-0.171, 1.55, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#3a3f45', fontWeight: 700 }} />
        {/* blue isolation valve */}
        <mesh position={[0, 1.9, 0]} material={new THREE.MeshStandardMaterial({ color: '#1d4ed8', metalness: 0.7, roughness: 0.3 })}><sphereGeometry args={[0.045, 12, 10]} /></mesh>
      </group>

      {/* wall penetration sleeve + sealing collars (through −X wall at y=1.5) */}
      <mesh position={[-W / 2, 1.5, -0.9]} rotation={[0, 0, Math.PI / 2]} material={CHROME}><cylinderGeometry args={[0.05, 0.05, 0.2, 12]} /></mesh>
      <mesh position={[-W / 2 - 0.06, 1.5, -0.9]} rotation={[0, 0, Math.PI / 2]} material={BLACK}><cylinderGeometry args={[0.06, 0.06, 0.02, 12]} /></mesh>
      <mesh position={[-W / 2 + 0.06, 1.5, -0.9]} rotation={[0, 0, Math.PI / 2]} material={BLACK}><cylinderGeometry args={[0.06, 0.06, 0.02, 12]} /></mesh>

      {/* entry ball valve with YELLOW lever + union + label */}
      <group position={[ex, 1.5, -0.9]}>
        <mesh material={CHROME}><cylinderGeometry args={[0.03, 0.03, 0.09, 12]} /></mesh>
        <mesh position={[0, 0.07, 0]} material={YELLOW}><boxGeometry args={[0.02, 0.02, 0.09]} /></mesh>
        <mesh position={[0.06, 0, 0]} material={GI_FIT}><cylinderGeometry args={[0.036, 0.036, 0.04, 8]} /></mesh>
        <SignPlane text="MAIN GAS ISOLATION" width={0.5} position={[0.02, 0.2, -0.9 * 0 + 0.05]} options={{ fg: '#222', bg: '#e8b600', fontWeight: 700 }} />
      </group>

      {/* GI pipe run (tube) + elbows + clips + GAS bands */}
      <mesh geometry={useMemo(() => new THREE.TubeGeometry(curve, 60, 0.02, 8, false), [curve])} material={tubeMat} />
      {[path[1], path[2], path[3]].map((p, i) => (
        <mesh key={i} position={p} material={GI_FIT}><boxGeometry args={[0.05, 0.05, 0.05]} /></mesh>
      ))}
      {clipYs.map((y, i) => (
        <mesh key={i} position={[ex, y, -0.9]} material={BLACK}><boxGeometry args={[0.05, 0.02, 0.05]} /></mesh>
      ))}
      {/* GAS bands */}
      {[[ex, 2.4, -0.4] as [number, number, number], [-0.2, 2.4, -D / 2 + 0.55] as [number, number, number]].map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} material={YELLOW}><cylinderGeometry args={[0.024, 0.024, 0.03, 8]} /></mesh>
      ))}
      {/* tee + branch down to water heater */}
      <mesh position={[ex, 2.4, -0.9]} material={GI_FIT}><boxGeometry args={[0.05, 0.05, 0.05]} /></mesh>
      <mesh position={[ex, 1.9, 0.6]} rotation={[Math.PI / 2, 0, 0]} material={GI}><cylinderGeometry args={[0.018, 0.018, 1.1, 8]} /></mesh>
      <mesh position={[ex, 2.4, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={GI}><cylinderGeometry args={[0.02, 0.02, 1.2, 8]} /></mesh>

      {/* appliance cock + orange flexible hose to stove inlet */}
      <group position={[0.35, 0.98, -D / 2 + 0.72]}>
        <mesh material={CHROME}><cylinderGeometry args={[0.02, 0.02, 0.05, 10]} /></mesh>
        <mesh position={[0.04, 0.03, 0]} material={YELLOW}><boxGeometry args={[0.05, 0.012, 0.012]} /></mesh>
      </group>
      {/* orange hose: natural sag from cock down to stove rear */}
      <mesh geometry={useMemo(() => {
        const c = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.35, 0.95, -D / 2 + 0.72),
          new THREE.Vector3(0.2, 0.78, -D / 2 + 0.85),
          new THREE.Vector3(0.05, 0.9, -D / 2 + 0.95),
        ]);
        return new THREE.TubeGeometry(c, 24, 0.011, 8, false);
      }, [])} material={ORANGE} />

      {/* stove on counter + water heater on left wall */}
      <GasStove pos={[0.05, 0.9, -D / 2 + 0.35]} />
      <WaterHeater pos={[-W / 2 + 0.2, 1.5, 0.6]} rot={Math.PI / 2} />

      {/* gas particles along the GI path (only when ignited) */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, 6]} frustumCulled={false}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshBasicMaterial color={'#4a9eff'} toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>

      {/* ─────────── premium kitchen fit-out (interior, visible through the open front) ─────────── */}
      {/* glossy tile backsplash band behind the counter run */}
      <mesh position={[0.05, 1.28, -D / 2 + 0.07]} material={TILE}><boxGeometry args={[3.4, 0.62, 0.02]} /></mesh>
      {/* grout lines — thin darker seams across the backsplash */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={`bv${i}`} position={[0.05 + x, 1.28, -D / 2 + 0.081]} material={BLACK}><boxGeometry args={[0.008, 0.62, 0.006]} /></mesh>
      ))}
      <mesh position={[0.05, 1.28, -D / 2 + 0.081]} material={BLACK}><boxGeometry args={[3.4, 0.008, 0.006]} /></mesh>

      {/* upper wall cabinets (two runs, flanking the hood) */}
      {[[-1.15, 1.35] as [number, number], [1.25, 1.15] as [number, number]].map(([cx, cw], i) => (
        <group key={`uc${i}`} position={[cx, 1.98, -D / 2 + 0.24]}>
          <mesh castShadow receiveShadow material={cabinetMat}><boxGeometry args={[cw, 0.62, 0.36]} /></mesh>
          <mesh position={[0, 0, 0.185]} material={cabinetMat}><boxGeometry args={[cw - 0.04, 0.58, 0.02]} /></mesh>
          <mesh position={[cw / 2 - 0.12, -0.22, 0.2]} material={CHROME}><boxGeometry args={[0.02, 0.16, 0.03]} /></mesh>
        </group>
      ))}

      {/* stainless chimney hood over the stove + duct riser to the ceiling */}
      <group position={[0.05, 0, -D / 2 + 0.32]}>
        <mesh position={[0, 1.72, 0]} castShadow material={HOOD}><boxGeometry args={[0.86, 0.16, 0.56]} /></mesh>
        <mesh position={[0, 1.62, 0.04]} material={HOOD}><boxGeometry args={[0.7, 0.1, 0.4]} /></mesh>
        <mesh position={[0, 2.05, -0.02]} material={HOOD}><boxGeometry args={[0.26, 0.62, 0.24]} /></mesh>
        <mesh position={[0, 1.66, 0.24]} material={STEEL_TOP}><boxGeometry args={[0.5, 0.03, 0.02]} /></mesh>
      </group>

      {/* sink gooseneck faucet at the counter sink */}
      <group position={[1.35, 1.02, -D / 2 + 0.32]}>
        <mesh position={[0, 0.08, 0]} material={CHROME}><cylinderGeometry args={[0.018, 0.02, 0.16, 10]} /></mesh>
        <mesh position={[0, 0.17, 0.05]} rotation={[Math.PI / 2.3, 0, 0]} material={CHROME}><cylinderGeometry args={[0.015, 0.015, 0.14, 10]} /></mesh>
        <mesh position={[0.07, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} material={CHROME}><cylinderGeometry args={[0.01, 0.01, 0.08, 8]} /></mesh>
      </group>

      {/* tall two-door refrigerator in the +X back corner */}
      <group position={[W / 2 - 0.48, 0, -D / 2 + 0.52]}>
        <mesh position={[0, 1.02, 0]} castShadow receiveShadow material={FRIDGE}><boxGeometry args={[0.74, 2.02, 0.72]} /></mesh>
        <mesh position={[0, 1.32, 0.37]} material={FRIDGE}><boxGeometry args={[0.7, 1.32, 0.02]} /></mesh>
        <mesh position={[0, 0.5, 0.37]} material={FRIDGE}><boxGeometry args={[0.7, 0.86, 0.02]} /></mesh>
        <mesh position={[-0.28, 1.5, 0.4]} material={CHROME}><boxGeometry args={[0.03, 0.5, 0.04]} /></mesh>
        <mesh position={[-0.28, 0.6, 0.4]} material={CHROME}><boxGeometry args={[0.03, 0.4, 0.04]} /></mesh>
      </group>

      {/* flush ceiling light panel — softly glows to read the interior */}
      <mesh position={[0.2, H - 0.09, 0.1]} material={CEIL_LIGHT}><boxGeometry args={[0.66, 0.05, 0.4]} /></mesh>
      <mesh position={[0.2, H - 0.11, 0.1]} material={WHITE}><boxGeometry args={[0.74, 0.03, 0.48]} /></mesh>

      {/* potted plant in the open corner */}
      <group position={[W / 2 - 0.4, 0, D / 2 - 0.45]}>
        <mesh position={[0, 0.16, 0]} castShadow material={PLANT_POT}><cylinderGeometry args={[0.16, 0.12, 0.32, 14]} /></mesh>
        <mesh position={[0, 0.5, 0]} material={FOLIAGE}><sphereGeometry args={[0.26, 10, 10]} /></mesh>
        <mesh position={[0.12, 0.62, 0.05]} material={FOLIAGE}><sphereGeometry args={[0.16, 8, 8]} /></mesh>
        <mesh position={[-0.1, 0.58, -0.06]} material={FOLIAGE}><sphereGeometry args={[0.15, 8, 8]} /></mesh>
      </group>

      {/* ─────────── exterior fixtures ─────────── */}
      {/* split-AC outdoor condenser bracketed to the −X exterior wall */}
      <group position={[-W / 2 - 0.24, 1.9, 0.7]}>
        <mesh castShadow receiveShadow material={AC_BODY}><boxGeometry args={[0.42, 0.46, 0.74]} /></mesh>
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={BLACK}><cylinderGeometry args={[0.17, 0.17, 0.04, 20]} /></mesh>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={`fin${k}`} position={[-0.235, 0, 0]} rotation={[(k * Math.PI) / 4, 0, Math.PI / 2]} material={CHROME}><boxGeometry args={[0.006, 0.3, 0.02]} /></mesh>
        ))}
        <mesh position={[0.19, -0.28, 0]} material={GI}><boxGeometry args={[0.06, 0.14, 0.5]} /></mesh>
      </group>

      {/* balcony railing along the open +Z front edge */}
      <group>
        <mesh position={[0, 1.06, D / 2 - 0.03]} material={RAIL}><boxGeometry args={[W - 0.2, 0.04, 0.04]} /></mesh>
        <mesh position={[0, 0.62, D / 2 - 0.03]} material={RAIL}><boxGeometry args={[W - 0.2, 0.03, 0.03]} /></mesh>
        {[-2.0, -1.35, -0.7, 0, 0.7, 1.35, 2.0].map((x, i) => (
          <mesh key={`bal${i}`} position={[x, 0.72, D / 2 - 0.03]} material={RAIL}><cylinderGeometry args={[0.014, 0.014, 0.68, 8]} /></mesh>
        ))}
        <mesh position={[-(W - 0.2) / 2, 0.7, D / 2 - 0.03]} material={STEEL_TOP}><cylinderGeometry args={[0.03, 0.03, 0.72, 10]} /></mesh>
        <mesh position={[(W - 0.2) / 2, 0.7, D / 2 - 0.03]} material={STEEL_TOP}><cylinderGeometry args={[0.03, 0.03, 0.72, 10]} /></mesh>
      </group>

      {/* brushed-steel "704" door-number plate beside the entry on the −X wall */}
      <group position={[-W / 2 + 0.02, 1.5, D / 2 - 0.7]}>
        <mesh material={PLATE_704}><boxGeometry args={[0.02, 0.34, 0.24]} /></mesh>
        <SignPlane text="704" width={0.22} position={[0.015, 0, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#eaf2ff', bg: '#1c2732', fontWeight: 800, letterSpacing: 2 }} />
      </group>

      {/* signage */}
      <SignPlane text="ELYSIUM TOWER A — FLAT 704 · PNG" width={2.6} position={[0, 0.35, D / 2 + 0.05]} options={{ fg: '#fff', bg: '#6C5AB8', fontWeight: 800, letterSpacing: 1 }} />
    </group>
  );
}
