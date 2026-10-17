import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { paintedMetal, steel, concrete, glass } from '@/materials/materials';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useSimStore } from '@/state/useSimStore';
import { useDrsStore } from '@/state/useDrsStore';
import { DRS_UNITS } from '@/config/drsUnits';
import { NODES_BY_ID } from '@/config/network';

/**
 * Section 15 — realistic District Regulating Station kiosk. A painted-steel
 * enclosure (pale blue-grey, louvres, pitched roof + two vent stacks, plinth +
 * bollards, branded signage) whose double doors ANIMATE OPEN on selection to
 * reveal a detailed internal skid: bright-yellow carbon-steel pipework with a
 * 180° U-bend, a black-handwheel ball valve, a row of blue-lever isolation cocks,
 * and TWIN parallel regulator streams (filter → slam-shut w/ red reset rod →
 * active + monitor regulators with domed spring housings and pilot loops) plus a
 * live pressure gauge and stainless impulse tubing. One stream runs on duty, the
 * other is held in reserve; internal particles flow through the duty stream only.
 * DRS network position/pressures/flows/connections are unchanged.
 */

// ── shared materials ──
const YELLOW = new THREE.MeshStandardMaterial({ color: '#f5c400', metalness: 0.55, roughness: 0.4 });
const SILVER = new THREE.MeshStandardMaterial({ color: '#c4cace', metalness: 0.85, roughness: 0.28 });
const VALVE = new THREE.MeshStandardMaterial({ color: '#1e2a38', metalness: 0.6, roughness: 0.5 });
const BLACK = new THREE.MeshStandardMaterial({ color: '#16181c', metalness: 0.4, roughness: 0.55 });
const BLUE = new THREE.MeshStandardMaterial({ color: '#1d6fb8', metalness: 0.5, roughness: 0.45 });
const GALV = new THREE.MeshStandardMaterial({ color: '#9aa1a8', metalness: 0.65, roughness: 0.45 });
const RED = new THREE.MeshStandardMaterial({ color: '#c01a1a', metalness: 0.2, roughness: 0.5 });
const GAUGE_FACE = new THREE.MeshStandardMaterial({ color: '#f2f2f2', metalness: 0.1, roughness: 0.4 });
const STEEL_TUBE = new THREE.MeshStandardMaterial({ color: '#d6dade', metalness: 0.85, roughness: 0.25 });

function BoltFlange({ pos, rot = [0, 0, Math.PI / 2] as [number, number, number], r = 0.15 }: { pos: [number, number, number]; rot?: [number, number, number]; r?: number }) {
  return (
    <group position={pos} rotation={rot}>
      {[-0.03, 0.03].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} material={SILVER}><cylinderGeometry args={[r, r, 0.03, 20]} /></mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * (r - 0.02), 0, Math.sin((i / 8) * Math.PI * 2) * (r - 0.02)]} material={BLACK}><cylinderGeometry args={[0.012, 0.012, 0.09, 6]} /></mesh>
      ))}
    </group>
  );
}

/** Regulator: cast body + domed spring housing + adjustment cap + pilot loop. */
function Regulator({ pos, small = false }: { pos: [number, number, number]; small?: boolean }) {
  const s = small ? 0.85 : 1;
  return (
    <group position={pos} scale={s}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={SILVER}><cylinderGeometry args={[0.09, 0.1, 0.2, 18]} /></mesh>
      {/* domed spring housing */}
      <mesh position={[0, 0.13, 0]} castShadow material={SILVER}><sphereGeometry args={[0.08, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[0, 0.13, 0]} material={SILVER}><cylinderGeometry args={[0.08, 0.08, 0.06, 16]} /></mesh>
      {/* adjustment cap + lock nut */}
      <mesh position={[0, 0.21, 0]} material={BLACK}><cylinderGeometry args={[0.02, 0.02, 0.04, 8]} /></mesh>
      {/* pilot body + loop */}
      <mesh position={[0.12, 0.02, 0]} material={SILVER}><cylinderGeometry args={[0.03, 0.03, 0.08, 12]} /></mesh>
      <mesh position={[0.06, 0.08, 0]} rotation={[0, 0, 0.5]} material={STEEL_TUBE}><torusGeometry args={[0.05, 0.006, 6, 14, Math.PI]} /></mesh>
      {/* nameplate + breather */}
      <mesh position={[0, 0, 0.101]} material={GAUGE_FACE}><boxGeometry args={[0.05, 0.04, 0.004]} /></mesh>
    </group>
  );
}

function Filter({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.11, 0]} castShadow material={SILVER}><cylinderGeometry args={[0.07, 0.07, 0.22, 16]} /></mesh>
      <mesh position={[0, 0.23, 0]} material={SILVER}><sphereGeometry args={[0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      {/* bolted ring + drain + DP gauge */}
      <mesh position={[0, 0.22, 0]} material={BLACK}><cylinderGeometry args={[0.075, 0.075, 0.02, 16]} /></mesh>
      <mesh position={[0, -0.02, 0]} material={BLUE}><cylinderGeometry args={[0.014, 0.014, 0.05, 8]} /></mesh>
      <mesh position={[0.08, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} material={GAUGE_FACE}><cylinderGeometry args={[0.03, 0.03, 0.015, 12]} /></mesh>
    </group>
  );
}

/** Slam-shut valve with a red vertical reset rod + TRIPPED/SET window. */
function SlamShut({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={VALVE}><cylinderGeometry args={[0.07, 0.07, 0.14, 16]} /></mesh>
      <mesh position={[0, 0.16, 0]} material={RED}><cylinderGeometry args={[0.014, 0.014, 0.22, 8]} /></mesh>
      <mesh position={[0, 0.28, 0]} material={RED}><sphereGeometry args={[0.025, 8, 8]} /></mesh>
      <mesh position={[0, 0.02, 0.071]} material={new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 0.7 })}><boxGeometry args={[0.05, 0.02, 0.004]} /></mesh>
    </group>
  );
}

/** A blue-lever instrument isolation cock. */
function BlueCock({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh material={SILVER}><cylinderGeometry args={[0.018, 0.018, 0.05, 10]} /></mesh>
      <mesh position={[0, 0.04, 0]} rotation={[0, 0, 0.2]} material={BLUE}><boxGeometry args={[0.012, 0.06, 0.012]} /></mesh>
    </group>
  );
}

/** A framed louvre panel with angled slats + mesh backing. */
function Louvre({ pos, rot = [0, 0, 0] as [number, number, number] }: { pos: [number, number, number]; rot?: [number, number, number] }) {
  return (
    <group position={pos} rotation={rot}>
      <mesh material={BLACK}><boxGeometry args={[0.62, 0.37, 0.02]} /></mesh>
      <mesh position={[0, 0, 0.011]} material={new THREE.MeshStandardMaterial({ color: '#3a3f45', metalness: 0.3, roughness: 0.7 })}><boxGeometry args={[0.56, 0.31, 0.005]} /></mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 0.14 - i * 0.04, 0.02]} rotation={[0.5, 0, 0]} material={GALV}><boxGeometry args={[0.56, 0.02, 0.02]} /></mesh>
      ))}
    </group>
  );
}

const W = 2.6, D = 1.6, H = 2.4;

export function DrsKiosk({ id = 'drs3', rotation = 0 }: { id?: string; rotation?: number }) {
  const unit = DRS_UNITS[id] ?? { no: 'DRS-03', dutyDefault: 1 as const, weather: 0.4 };
  const bodyMat = useMemo(() => paintedMetal('#8fa5b0', 300 + Math.round(unit.weather * 20)), [unit.weather]);
  const roofMat = useMemo(() => paintedMetal('#6f7d86', 320), []);
  const chequer = useMemo(() => steel({ color: '#8a9199', roughness: 0.5, metalness: 0.7, seed: 321 }), []);

  const leftDoor = useRef<THREE.Group>(null);
  const rightDoor = useRef<THREE.Group>(null);
  const needle = useRef<THREE.Mesh>(null);
  const interiorLight = useRef<THREE.PointLight>(null);
  const s1Levers = useRef<THREE.Group>(null);
  const s2Levers = useRef<THREE.Group>(null);
  const particles = useRef<THREE.InstancedMesh>(null);
  const skid = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const doorPhase = useRef(unit.doorsOpenDefault ? 1 : 0);
  // world position of this kiosk (Section 17 §A.4 — skid LOD gating by distance)
  const worldPos = useMemo(() => { const n = NODES_BY_ID[id]; return new THREE.Vector3(n?.position[0] ?? 0, 1.4, n?.position[2] ?? 0); }, [id]);

  // Duty-stream flow paths (world-local). Stream 1 at z=-0.42, stream 2 at z=+0.42.
  const paths = useMemo(() => {
    const mk = (z: number) => new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.0, 0.55, -0.55), // inlet riser / bottom run
      new THREE.Vector3(-1.0, 0.55, 0),
      new THREE.Vector3(-1.05, 1.35, 0), // up the U-bend
      new THREE.Vector3(-0.8, 1.4, z), // tee split into stream
      new THREE.Vector3(0.2, 1.4, z), // through regulators
      new THREE.Vector3(0.8, 1.4, 0), // recombine
      new THREE.Vector3(1.05, 0.7, 0), // down to outlet
      new THREE.Vector3(1.0, 0.55, -0.55),
    ]);
    return { 1: mk(-0.42), 2: mk(0.42) };
  }, []);

  useFrame((state, dt) => {
    const selected = useSelectionStore.getState().selectedId === id;
    const open = selected || !!unit.doorsOpenDefault;
    const target = open ? 1 : 0;
    doorPhase.current += (target - doorPhase.current) * Math.min(1, dt * 1.6); // ~1.2s

    // §A.4 LOD: only render the detailed internal skid when the doors are open OR
    // the camera is within LOD0 range (~34u). Full detail always returns up close.
    if (skid.current) skid.current.visible = doorPhase.current > 0.03 || state.camera.position.distanceTo(worldPos) < 34;
    const a = doorPhase.current * (Math.PI * 0.62); // ~112°
    if (leftDoor.current) leftDoor.current.rotation.y = a;
    if (rightDoor.current) rightDoor.current.rotation.y = -a;
    if (interiorLight.current) interiorLight.current.intensity = doorPhase.current * 1.1;

    // live large gauge needle from outlet pressure (0..10 Bar → ±120°)
    const p = useSimStore.getState().values[id]?.pressure ?? 4;
    if (needle.current) needle.current.rotation.z = -(Math.min(10, p) / 10) * (Math.PI * 1.33) + Math.PI * 0.66;

    // duty/standby isolation lever positions (open = parallel/0, closed = perpendicular)
    const duty = useDrsStore.getState().duty[id] ?? unit.dutyDefault;
    if (s1Levers.current) s1Levers.current.rotation.z += ((duty === 1 ? 0 : Math.PI / 2) - s1Levers.current.rotation.z) * Math.min(1, dt * 4);
    if (s2Levers.current) s2Levers.current.rotation.z += ((duty === 2 ? 0 : Math.PI / 2) - s2Levers.current.rotation.z) * Math.min(1, dt * 4);

    // internal duty-stream flow particles (only visible when open)
    const mesh = particles.current;
    if (mesh) {
      mesh.visible = doorPhase.current > 0.4;
      if (mesh.visible) {
        const sim = useSimStore.getState();
        const curve = paths[duty as 1 | 2];
        const load = sim.values[id]?.load ?? 1;
        const step = sim.playing ? dt * 0.12 * sim.speed * Math.max(0.3, load) : 0;
        const N = 8;
        for (let i = 0; i < N; i++) {
          let t = ((mesh.userData['p' + i] ?? i / N) + step) % 1;
          mesh.userData['p' + i] = t;
          const pt = curve.getPoint(t);
          dummy.position.copy(pt);
          // denser/faster upstream (before regulators, t<0.5) → bigger; downstream smaller
          dummy.scale.setScalar(t < 0.5 ? 1 : 0.6);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  });


  return (
    <group rotation={[0, rotation, 0]}>
      {/* ── plinth + yellow perimeter + bollards ── */}
      <mesh position={[0, 0.12, 0]} receiveShadow material={concrete('#b9b5ac', 305)}><boxGeometry args={[3.0, 0.24, 2.0]} /></mesh>
      <mesh position={[0, 0.25, 0]} material={new THREE.MeshStandardMaterial({ color: '#e8b600', roughness: 0.6 })}><boxGeometry args={[2.9, 0.02, 1.9]} /></mesh>
      <mesh position={[0, 0.26, 0]} material={concrete('#b9b5ac', 306)}><boxGeometry args={[2.7, 0.02, 1.7]} /></mesh>
      {[[-1.35, -0.9], [1.35, -0.9], [-1.35, 0.9], [1.35, 0.9]].map((b, i) => (
        <group key={i} position={[b[0], 0, b[1]]}>
          <mesh position={[0, 0.5, 0]} material={new THREE.MeshStandardMaterial({ color: '#e8b600', roughness: 0.5 })}><cylinderGeometry args={[0.075, 0.075, 1.0, 12]} /></mesh>
          <mesh position={[0, 0.75, 0]} material={BLACK}><cylinderGeometry args={[0.077, 0.077, 0.12, 12]} /></mesh>
        </group>
      ))}

      {/* base channel frame */}
      <mesh position={[0, 0.3, 0]} material={GALV}><boxGeometry args={[W + 0.04, 0.1, D + 0.04]} /></mesh>

      {/* ── enclosure body: back + sides (front is doors) ── */}
      <mesh position={[0, 0.35 + H / 2, -D / 2]} castShadow receiveShadow material={bodyMat}><boxGeometry args={[W, H, 0.06]} /></mesh>
      <mesh position={[-W / 2, 0.35 + H / 2, 0]} castShadow receiveShadow material={bodyMat}><boxGeometry args={[0.06, H, D]} /></mesh>
      <mesh position={[W / 2, 0.35 + H / 2, 0]} castShadow receiveShadow material={bodyMat}><boxGeometry args={[0.06, H, D]} /></mesh>
      {/* panel seams (back) */}
      {[-0.6, 0.6].map((x, i) => <mesh key={i} position={[x, 0.35 + H / 2, -D / 2 + 0.035]} material={roofMat}><boxGeometry args={[0.02, H - 0.1, 0.01]} /></mesh>)}
      {/* chequer floor */}
      <mesh position={[0, 0.37, 0]} receiveShadow material={chequer}><boxGeometry args={[W - 0.12, 0.03, D - 0.12]} /></mesh>
      {/* stainless back liner */}
      <mesh position={[0, 0.35 + H / 2, -D / 2 + 0.05]} material={SILVER}><boxGeometry args={[W - 0.12, H - 0.15, 0.01]} /></mesh>

      {/* louvres: two per side + one rear + low/high vent slots */}
      <Louvre pos={[-W / 2 - 0.005, 1.4, -0.3]} rot={[0, Math.PI / 2, 0]} />
      <Louvre pos={[-W / 2 - 0.005, 1.4, 0.35]} rot={[0, Math.PI / 2, 0]} />
      <Louvre pos={[W / 2 + 0.005, 1.4, -0.3]} rot={[0, -Math.PI / 2, 0]} />
      <Louvre pos={[W / 2 + 0.005, 1.4, 0.35]} rot={[0, -Math.PI / 2, 0]} />
      <Louvre pos={[0, 1.4, -D / 2 - 0.005]} rot={[0, Math.PI, 0]} />
      {([-W / 2 - 0.01, W / 2 + 0.01] as const).map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.5, 0]} rotation={[0, i ? -Math.PI / 2 : Math.PI / 2, 0]} material={BLACK}><boxGeometry args={[D - 0.2, 0.08, 0.01]} /></mesh>
          <mesh position={[x, 2.28, 0]} rotation={[0, i ? -Math.PI / 2 : Math.PI / 2, 0]} material={BLACK}><boxGeometry args={[D - 0.2, 0.08, 0.01]} /></mesh>
        </group>
      ))}

      {/* ── double doors (openable) ── front face at z=+D/2 ── */}
      {([['left', -1] as const, ['right', 1] as const]).map(([side, sgn]) => (
        <group key={side} ref={side === 'left' ? leftDoor : rightDoor} position={[sgn * (W / 2 - 0.03), 0.35 + H / 2, D / 2]}>
          {/* door leaf pivoted at outer edge (group origin), extends inward */}
          <mesh position={[-sgn * (W / 4 - 0.03), 0, 0]} castShadow material={bodyMat}><boxGeometry args={[W / 2 - 0.06, H - 0.06, 0.05]} /></mesh>
          {/* inner face lighter + schematic */}
          <mesh position={[-sgn * (W / 4 - 0.03), 0, -0.026]} material={new THREE.MeshStandardMaterial({ color: '#c8d2d8', roughness: 0.6 })}><boxGeometry args={[W / 2 - 0.1, H - 0.12, 0.005]} /></mesh>
          {side === 'right' && <SignPlane text="P&ID · DRS SCHEMATIC" width={0.7} position={[-sgn * (W / 4 - 0.03), 0.3, -0.03]} rotation={[0, Math.PI, 0]} options={{ fg: '#123', bg: '#eef1f4', fontWeight: 600 }} />}
          {/* 3 barrel hinges on the outer edge */}
          {[-0.8, 0, 0.8].map((hy, i) => <mesh key={i} position={[0, hy, 0.02]} material={BLACK}><cylinderGeometry args={[0.03, 0.03, 0.14, 8]} /></mesh>)}
          {/* T-handle latch (inner edge) + padlock hasp on right */}
          <mesh position={[-sgn * (W / 2 - 0.12), 0, 0.04]} material={BLACK}><boxGeometry args={[0.04, 0.16, 0.04]} /></mesh>
          {side === 'right' && <mesh position={[-sgn * (W / 2 - 0.12), -0.1, 0.05]} material={GALV}><boxGeometry args={[0.06, 0.05, 0.02]} /></mesh>}
          {/* §17 C.1 — front signage lives ON the door leaves so it swings with the
              doors and never floats in the opening. Left = brand lockup; right = warnings. */}
          {side === 'left' && (
            <group position={[-sgn * (W / 4 - 0.03), 0, 0.04]}>
              <LogoDecal position={[0, 0.62, 0]} width={0.9} backing={false} />
              <mesh position={[0, 0.3, -0.004]} material={SILVER}><boxGeometry args={[1.02, 0.16, 0.005]} /></mesh>
              <SignPlane text={`${unit.no} · ADANI TOTAL GAS`} width={0.98} position={[0, 0.3, 0]} options={{ fg: '#0b2545', bg: '#e9ecef', fontWeight: 800 }} />
              <SignPlane text="IN 8.0 / OUT 4.0 Bar · 3000 SCMH" width={1.1} position={[0, -0.85, 0]} options={{ fg: '#123', bg: '#c8d2d8', fontWeight: 600 }} />
            </group>
          )}
          {side === 'right' && (
            <group position={[-sgn * (W / 4 - 0.03), 0, 0.04]}>
              <SignPlane text="DANGER — NATURAL GAS" width={1.05} position={[0, 0.5, 0]} options={{ fg: '#fff', bg: '#c01a1a', fontWeight: 800 }} />
              <SignPlane text="NO SMOKING · NO NAKED FLAME" width={1.05} position={[0, 0.2, 0]} options={{ fg: '#111', bg: '#e8b600', fontWeight: 800 }} />
              <SignPlane text="AUTHORISED PERSONNEL ONLY" width={1.0} position={[0, -0.1, 0]} options={{ fg: '#fff', bg: '#0b2545', fontWeight: 800 }} />
              <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 4]} material={new THREE.MeshStandardMaterial({ color: '#e8b600' })}><boxGeometry args={[0.34, 0.34, 0.005]} /></mesh>
              <SignPlane text="2" width={0.14} position={[0, -0.55, 0.004]} options={{ fg: '#111', bg: 'transparent', fontWeight: 800 }} />
            </group>
          )}
        </group>
      ))}

      {/* door frame lip — a thin raised BORDER around the opening (not a panel,
          so the open doors reveal the interior skid) */}
      {([[0, (H - 0.06) / 2, W, 0.08] as const, [0, -(H - 0.06) / 2, W, 0.08] as const, [-(W - 0.06) / 2, 0, 0.08, H] as const, [(W - 0.06) / 2, 0, 0.08, H] as const]).map((f, i) => (
        <mesh key={i} position={[f[0], 0.35 + H / 2 + f[1], D / 2]} material={roofMat}><boxGeometry args={[f[2], f[3], 0.05]} /></mesh>
      ))}

      {/* ── roof: pitched, eaves, drip edge, 2 vent stacks, lifting lugs ── */}
      <mesh position={[0, 0.35 + H + 0.05, -0.05]} rotation={[0.087, 0, 0]} castShadow material={roofMat}><boxGeometry args={[W + 0.16, 0.08, D + 0.16]} /></mesh>
      {[[-0.7, -0.4], [0.7, -0.4]].map((v, i) => (
        <group key={i} position={[v[0], 0.35 + H, v[1]]}>
          <mesh position={[0, 0.4, 0]} material={STEEL_TUBE}><cylinderGeometry args={[0.03, 0.03, 0.8, 10]} /></mesh>
          <mesh position={[0, 0.35, 0]} material={new THREE.MeshStandardMaterial({ color: '#e8b600' })}><cylinderGeometry args={[0.035, 0.035, 0.12, 10]} /></mesh>
          <mesh position={[0, 0.82, 0]} material={BLACK}><coneGeometry args={[0.06, 0.06, 10]} /></mesh>
        </group>
      ))}
      {[[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]].map((c, i) => (
        <mesh key={i} position={[c[0], 0.35 + H + 0.08, c[1]]} rotation={[Math.PI / 2, 0, 0]} material={GALV}><torusGeometry args={[0.04, 0.01, 6, 10]} /></mesh>
      ))}

      {/* interior light (brightens when doors open) */}
      <pointLight ref={interiorLight} position={[0, 1.9, 0]} color="#eaf2ff" intensity={0} distance={3} decay={2} />

      {/* ══ INTERNAL SKID ══ (inside the enclosure; LOD-gated) */}
      <group ref={skid}>
        {/* skid uprights */}
        {[-0.9, 0.9].map((x, i) => <mesh key={i} position={[x, 1.1, -0.45]} material={GALV}><boxGeometry args={[0.05, 1.6, 0.05]} /></mesh>)}

        {/* inlet riser + bottom run + U-bend (yellow) */}
        <mesh position={[-1.0, 0.5, -0.55]} material={YELLOW}><cylinderGeometry args={[0.055, 0.055, 0.3, 14]} /></mesh>
        <mesh position={[-1.0, 0.55, -0.25]} rotation={[Math.PI / 2, 0, 0]} material={YELLOW}><cylinderGeometry args={[0.055, 0.055, 0.6, 14]} /></mesh>
        {/* 180° U-bend on the left */}
        <mesh position={[-1.0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} material={YELLOW}><torusGeometry args={[0.4, 0.055, 12, 24, Math.PI]} /></mesh>
        <mesh position={[-1.05, 1.35, 0]} rotation={[0, 0, Math.PI / 2]} material={YELLOW}><cylinderGeometry args={[0.055, 0.055, 0.5, 14]} /></mesh>

        {/* main inlet ball valve + black handwheel + flanges */}
        <group position={[-1.0, 0.55, -0.45]}>
          <BoltFlange pos={[0, 0, -0.14]} r={0.11} rot={[Math.PI / 2, 0, 0]} />
          <mesh material={VALVE}><boxGeometry args={[0.2, 0.22, 0.22]} /></mesh>
          <BoltFlange pos={[0, 0, 0.14]} r={0.11} rot={[Math.PI / 2, 0, 0]} />
          <mesh position={[0, 0.2, 0]} material={STEEL_TUBE}><cylinderGeometry args={[0.02, 0.02, 0.16, 8]} /></mesh>
          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={BLACK}><torusGeometry args={[0.13, 0.014, 8, 20]} /></mesh>
          {[0, 1, 2, 3].map((k) => <mesh key={k} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, (k / 4) * Math.PI * 2]} material={BLACK}><boxGeometry args={[0.24, 0.014, 0.014]} /></mesh>)}
        </group>

        {/* tee split + two parallel streams + recombine */}
        {([[-0.42, 1] as const, [0.42, 2] as const]).map(([z, streamNo]) => (
          <group key={streamNo} position={[0, 1.4, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={YELLOW}><cylinderGeometry args={[0.045, 0.045, 1.8, 12]} /></mesh>
            {/* stream components in flow order */}
            <Filter pos={[-0.7, -0.02, 0]} />
            <SlamShut pos={[-0.35, 0, 0]} />
            <Regulator pos={[0.05, 0, 0]} />
            <Regulator pos={[0.45, 0, 0]} small />
            {/* isolation valves upstream + downstream w/ levers (grouped for animation) */}
            <group ref={streamNo === 1 ? s1Levers : s2Levers}>
              <mesh position={[-0.85, 0.08, 0]} material={streamNo === 1 ? YELLOW : BLACK}><boxGeometry args={[0.03, 0.16, 0.03]} /></mesh>
              <mesh position={[0.8, 0.08, 0]} material={streamNo === 1 ? YELLOW : BLACK}><boxGeometry args={[0.03, 0.16, 0.03]} /></mesh>
            </group>
            {/* isolation valve bodies */}
            <mesh position={[-0.85, 0, 0]} material={VALVE}><cylinderGeometry args={[0.05, 0.05, 0.1, 12]} /></mesh>
            <mesh position={[0.8, 0, 0]} material={VALVE}><cylinderGeometry args={[0.05, 0.05, 0.1, 12]} /></mesh>
            {/* small outlet gauge */}
            <mesh position={[0.6, 0.12, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={GAUGE_FACE}><cylinderGeometry args={[0.035, 0.035, 0.015, 14]} /></mesh>
            {/* stencil label */}
            <SignPlane text={streamNo === 1 ? 'STREAM 1 — DUTY' : 'STREAM 2 — STANDBY'} width={0.5} position={[0, -0.18, 0]} options={{ fg: '#111', bg: '#d7c76a', fontWeight: 700 }} />
            {/* impulse tubing: sensing port down to downstream tap */}
            <mesh position={[0.25, -0.1, 0.03]} material={STEEL_TUBE}><cylinderGeometry args={[0.006, 0.006, 0.2, 6]} /></mesh>
            <mesh position={[0.42, -0.18, 0.03]} rotation={[0, 0, Math.PI / 2]} material={STEEL_TUBE}><cylinderGeometry args={[0.006, 0.006, 0.34, 6]} /></mesh>
          </group>
        ))}
        {/* recombine + outlet valve + outlet riser (yellow) */}
        <mesh position={[1.0, 1.05, 0]} rotation={[0, 0, 0.5]} material={YELLOW}><cylinderGeometry args={[0.05, 0.05, 0.8, 12]} /></mesh>
        <mesh position={[1.0, 0.5, -0.25]} rotation={[Math.PI / 2, 0, 0]} material={YELLOW}><cylinderGeometry args={[0.055, 0.055, 0.6, 14]} /></mesh>
        <mesh position={[1.0, 0.5, -0.55]} material={YELLOW}><cylinderGeometry args={[0.055, 0.055, 0.3, 14]} /></mesh>
        <group position={[1.0, 0.7, 0]}>
          <mesh material={VALVE}><boxGeometry args={[0.16, 0.18, 0.18]} /></mesh>
          <mesh position={[0.14, 0.02, 0]} rotation={[0, 0, -0.5]} material={BLACK}><cylinderGeometry args={[0.014, 0.014, 0.2, 8]} /></mesh>
        </group>

        {/* row of 5 blue-lever isolation cocks on a manifold bar */}
        <group position={[-0.1, 0.95, 0.5]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={SILVER}><cylinderGeometry args={[0.02, 0.02, 0.6, 10]} /></mesh>
          {[-0.24, -0.12, 0, 0.12, 0.24].map((x, i) => <BlueCock key={i} x={x} />)}
        </group>

        {/* large pressure gauge high-centre, needle rotates live */}
        <group position={[0, 1.95, 0.35]}>
          <mesh material={GALV}><boxGeometry args={[0.03, 0.2, 0.03]} /></mesh>
          <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={SILVER}><cylinderGeometry args={[0.135, 0.135, 0.04, 24]} /></mesh>
          <mesh position={[0, 0, 0.082]} material={GAUGE_FACE}><circleGeometry args={[0.12, 24]} /></mesh>
          <mesh position={[0, 0.09, 0.083]} material={RED}><boxGeometry args={[0.01, 0.03, 0.002]} /></mesh>
          <mesh ref={needle} position={[0, 0, 0.084]} material={BLACK}><boxGeometry args={[0.012, 0.1, 0.004]} /></mesh>
          <mesh position={[0, 0, 0.09]} material={glass('#cfe0ea', 0.5)}><circleGeometry args={[0.12, 24]} /></mesh>
        </group>

        {/* relief + slam-shut vent lines routed up to the two roof stacks */}
        {[-0.7, 0.7].map((x, i) => (
          <mesh key={i} position={[x, 1.7, -0.4]} material={STEEL_TUBE}><cylinderGeometry args={[0.018, 0.018, 0.9, 8]} /></mesh>
        ))}

        {/* electrical junction box + conduit + hanging red warning tag */}
        <group position={[W / 2 - 0.12, 1.3, 0.3]}>
          <mesh material={new THREE.MeshStandardMaterial({ color: '#7d848b', metalness: 0.4, roughness: 0.6 })}><boxGeometry args={[0.1, 0.14, 0.08]} /></mesh>
          <mesh position={[0, -0.2, 0]} material={GALV}><cylinderGeometry args={[0.012, 0.012, 0.3, 6]} /></mesh>
        </group>
        <mesh position={[0.05, 0.75, -0.4]} material={RED}><boxGeometry args={[0.05, 0.07, 0.004]} /></mesh>
        <mesh position={[0.05, 0.82, -0.4]} material={STEEL_TUBE}><cylinderGeometry args={[0.003, 0.003, 0.06, 4]} /></mesh>

        {/* U-bolt pipe supports along the streams */}
        {[-0.6, -0.1, 0.4, 0.9].map((x, i) => (
          <mesh key={i} position={[x, 1.4, -0.45]} rotation={[Math.PI / 2, 0, 0]} material={GALV}><torusGeometry args={[0.06, 0.008, 6, 12, Math.PI]} /></mesh>
        ))}
      </group>

      {/* internal duty-stream flow particles */}
      <instancedMesh ref={particles} args={[undefined, undefined, 8]} frustumCulled={false} visible={false}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={'#7fb4ff'} toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>

      {/* Nameplate mirrored on the roof fascia so the unit is identifiable even
          with the doors open (stays on the BODY, above the opening). */}
      <SignPlane text={unit.no} width={0.9} position={[0, 0.35 + H + 0.02, D / 2 + 0.06]} options={{ fg: '#fff', bg: '#0B74B0', fontWeight: 800, letterSpacing: 1 }} />

      {/* gas detector head near roof */}
      <group position={[W / 2 - 0.3, 2.15, -0.3]}>
        <mesh material={SILVER}><cylinderGeometry args={[0.04, 0.04, 0.09, 12]} /></mesh>
        <mesh position={[0, -0.06, 0]} material={new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 1 })}><cylinderGeometry args={[0.015, 0.015, 0.008, 8]} /></mesh>
      </group>

      {/* RTU cabinet on a post beside the kiosk */}
      <group position={[W / 2 + 0.5, 0, 0.4]}>
        <mesh position={[0, 0.9, 0]} material={paintedMetal('#c4c0b8', 330)}><boxGeometry args={[0.4, 0.55, 0.2]} /></mesh>
        <mesh position={[0, 0.45, 0]} material={GALV}><boxGeometry args={[0.05, 0.9, 0.05]} /></mesh>
        <mesh position={[0.1, 1.4, 0]} material={GALV}><cylinderGeometry args={[0.01, 0.01, 0.5, 6]} /></mesh>
        <SignPlane text="RTU-05" width={0.3} position={[0, 0.95, 0.11]} options={{ fg: '#0b2545', bg: '#e9e6df', fontWeight: 700 }} />
      </group>

      {/* fire extinguisher on a bracket beside the door */}
      <group position={[-W / 2 - 0.18, 0.7, 0.5]}>
        <mesh position={[0, 0, 0]} material={RED}><cylinderGeometry args={[0.06, 0.06, 0.35, 12]} /></mesh>
        <mesh position={[0, 0.22, 0]} material={BLACK}><cylinderGeometry args={[0.03, 0.03, 0.08, 8]} /></mesh>
      </group>

      {/* earthing conductor to ground rod */}
      <mesh position={[-W / 2 - 0.05, 0.3, -0.5]} rotation={[0, 0, 0.2]} material={new THREE.MeshStandardMaterial({ color: '#b5732e', metalness: 0.7, roughness: 0.45 })}><cylinderGeometry args={[0.01, 0.01, 0.7, 6]} /></mesh>

      {/* one unit under inspection: maintenance cone + service note */}
      {unit.doorsOpenDefault && (
        <group position={[0, 0, D / 2 + 0.7]}>
          <mesh position={[0, 0.15, 0]} material={new THREE.MeshStandardMaterial({ color: '#e8621a', roughness: 0.5 })}><coneGeometry args={[0.14, 0.3, 16]} /></mesh>
          <mesh position={[0, 0.02, 0]} material={new THREE.MeshStandardMaterial({ color: '#e8621a', roughness: 0.5 })}><boxGeometry args={[0.3, 0.03, 0.3]} /></mesh>
          <mesh position={[0, 0.16, 0]} material={new THREE.MeshStandardMaterial({ color: '#f2f2f2' })}><cylinderGeometry args={[0.145, 0.145, 0.05, 16]} /></mesh>
        </group>
      )}
    </group>
  );
}
