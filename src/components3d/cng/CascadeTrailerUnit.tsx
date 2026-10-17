import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useFrame } from '@react-three/fiber';
import { useViewStore } from '@/state/useViewStore';
import { LogoDecal, SignPlane } from '@/components3d/branding/Branding';
import { BRAND } from '@/theme/tokens';
import { useTrailerStore } from '@/state/useTrailerStore';
import { Gauge, Valve } from '@/components3d/primitives/Fittings';

/**
 * Section 03 §3 — the gas-carrying cascade trailer. 32 domed cylinders (4 banks ×
 * 8) threaded through 5 transverse support bulkheads inside a blue protective
 * cage, a heavy chassis with retractable landing legs + underrun bar, 12 wheels,
 * and a rear manifold cabinet with opening doors (bank manifolds, pigtails,
 * valves, gauges, couplings, vent stack). Full hazard livery. Self-drives from
 * the fleet snapshot at `index`: transform, wheel roll, progressive bank glow,
 * door open/close, landing-leg extend/retract — all imperative (no re-render).
 * Local origin at ground under the kingpin (front, +X); body extends −X.
 */

const BANK_COLOR = ['#063f3c', '#0a5f5a', '#0e8b82', '#14b8a6']; // D(bottom)→A(top)
const chassisMat = new THREE.MeshStandardMaterial({ color: '#2b3036', roughness: 0.6, metalness: 0.7 });
const cageMat = new THREE.MeshStandardMaterial({ color: BRAND.primary, roughness: 0.45, metalness: 0.4 });
const cabMat = new THREE.MeshStandardMaterial({ color: BRAND.primary, roughness: 0.45, metalness: 0.4 });
const steelInner = new THREE.MeshStandardMaterial({ color: '#c2c7cc', roughness: 0.35, metalness: 0.85 });
const strapMat = new THREE.MeshStandardMaterial({ color: '#1c1f22', roughness: 0.6, metalness: 0.6 });
const tyreMat = new THREE.MeshStandardMaterial({ color: '#14171b', roughness: 0.9, metalness: 0.0 });
const rimMat = new THREE.MeshStandardMaterial({ color: '#8f969d', roughness: 0.4, metalness: 0.85 });
const chevronMat = new THREE.MeshStandardMaterial({ color: '#e6b422', roughness: 0.5, metalness: 0.2 });
const liveryBackMat = new THREE.MeshStandardMaterial({ color: '#0b2545', roughness: 0.5, metalness: 0.3 });

const tyreGeom = (() => { const g = new THREE.CylinderGeometry(0.5, 0.5, 0.34, 20); g.rotateX(Math.PI / 2); return g; })();
const rimGeom = (() => { const g = new THREE.CylinderGeometry(0.25, 0.25, 0.36, 12); g.rotateX(Math.PI / 2); return g; })();
// Domed-end cylinder = capsule, axis baked to X.
const capGeom = (() => { const g = new THREE.CapsuleGeometry(0.135, 9.2, 4, 12); g.rotateZ(Math.PI / 2); return g; })();

const ROWS_Y = [1.55, 1.9, 2.25, 2.6]; // D,C,B,A
const COLS_Z = [-1.02, -0.73, -0.44, -0.15, 0.15, 0.44, 0.73, 1.02];
const BULK_X = [-0.3, -2.6, -4.9, -7.2, -9.5];
const CYL_CX = -4.75; // cylinder centre along X

export interface StaticTrailerPose {
  pos: [number, number, number];
  rot: number;
  /** Live fill % (0..100) — drives cylinder glow (progressive by bank). */
  getFill?: () => number;
  getBanks?: () => Record<'A' | 'B' | 'C' | 'D', number>;
  fillPercent?: number;
  doorsOpen?: boolean;
  legsDown?: boolean;
}

export function CascadeTrailerUnit({
  index = 0,
  id,
  onSelect,
  pose,
}: {
  index?: number;
  id: string;
  onSelect?: () => void;
  /** When provided the trailer is a static, station-parked fixture (no journey). */
  pose?: StaticTrailerPose;
}) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const leftDoor = useRef<THREE.Group>(null);
  const rightDoor = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);

  // One emissive material per bank row (mutated by fill).
  const rowMats = useMemo(
    () => BANK_COLOR.map((c) => new THREE.MeshStandardMaterial({ color: '#b8bcc0', emissive: new THREE.Color(c), emissiveIntensity: 0, roughness: 0.35, metalness: 0.7 })),
    [],
  );
  const bandMats = useMemo(() => BANK_COLOR.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.5 })), []);

  // Section 16 §C.1 — 32 curved pigtail tubes from every cylinder neck to its bank
  // manifold header (merged into one geometry for performance). This is the single
  // biggest contributor to the "real cascade" look.
  const pigtailGeom = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    ROWS_Y.forEach((y, r) => {
      const headerY = 1.4 + r * 0.34; // matches the cabinet bank manifolds
      COLS_Z.forEach((z) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-9.35, y, z),
          new THREE.Vector3(-9.9, y + 0.08, z),
          new THREE.Vector3(-10.5, (y + headerY) / 2, z * 0.85),
          new THREE.Vector3(-10.8, headerY, z * 0.7),
        ]);
        parts.push(new THREE.TubeGeometry(curve, 14, 0.015, 6, false));
      });
    });
    return mergeGeometries(parts, false) ?? new THREE.BufferGeometry();
  }, []);
  const pigtailMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c7ccd1', roughness: 0.3, metalness: 0.85 }), []);
  const markerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a2f10', emissive: new THREE.Color('#ffb020'), emissiveIntensity: 0.3, roughness: 0.4 }), []);
  const tailMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a0f14', emissive: new THREE.Color('#e02030'), emissiveIntensity: 0.4, roughness: 0.4 }), []);

  // Per-row instanced cylinders (8 each) + rear neck bands.
  const rowInst = useMemo(() => {
    const dummy = new THREE.Object3D();
    return ROWS_Y.map((y, r) => {
      const bodies = new THREE.InstancedMesh(capGeom, rowMats[r], 8);
      const bands = new THREE.InstancedMesh(new THREE.TorusGeometry(0.16, 0.03, 6, 12), bandMats[r], 8);
      COLS_Z.forEach((z, c) => {
        dummy.position.set(CYL_CX, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        bodies.setMatrixAt(c, dummy.matrix);
        dummy.position.set(-9.4, y, z);
        dummy.rotation.set(0, Math.PI / 2, 0);
        dummy.updateMatrix();
        bands.setMatrixAt(c, dummy.matrix);
      });
      bodies.castShadow = true;
      return { bodies, bands };
    });
  }, [rowMats, bandMats]);

  useFrame(() => {
    if (!root.current) return;
    // View = static station pose OR the moving-fleet snapshot.
    let pos: [number, number, number];
    let rot: number;
    let bank: Record<'A' | 'B' | 'C' | 'D', number>;
    let doorsOpen: boolean;
    let legsDown: boolean;
    let wheelSpin: number;
    let moving: boolean;
    if (pose) {
      pos = pose.pos; rot = pose.rot;
      const f = pose.getFill ? pose.getFill() : pose.fillPercent ?? 100;
      bank = pose.getBanks ? pose.getBanks() : { A: Math.max(0, f * 2.48 - 100), B: Math.max(0, f * 2.48 - 50), C: f * 2.4, D: f * 2.46 };
      doorsOpen = pose.doorsOpen ?? true;
      legsDown = pose.legsDown ?? true;
      wheelSpin = 0; moving = false;
    } else {
      const snap = useTrailerStore.getState().snapshots()[index];
      if (!snap) return;
      pos = snap.trailer.pos; rot = snap.trailer.rot;
      bank = snap.bank; doorsOpen = snap.doorsOpen; legsDown = snap.legsDown;
      wheelSpin = snap.wheelSpin; moving = snap.moving;
    }
    root.current.position.set(pos[0], pos[1], pos[2]);
    root.current.rotation.y = rot;
    for (const w of wheels.current) if (w) w.rotation.z = wheelSpin;
    rowMats[0].emissiveIntensity = (bank.D / 248) * 0.55; // bottom
    rowMats[1].emissiveIntensity = (bank.C / 248) * 0.55;
    rowMats[2].emissiveIntensity = (bank.B / 248) * 0.55;
    rowMats[3].emissiveIntensity = (bank.A / 248) * 0.55;
    const open = doorsOpen ? 1 : 0;
    if (leftDoor.current) leftDoor.current.rotation.y = THREE.MathUtils.lerp(leftDoor.current.rotation.y, open * 2.0, 0.2);
    if (rightDoor.current) rightDoor.current.rotation.y = THREE.MathUtils.lerp(rightDoor.current.rotation.y, open * -2.0, 0.2);
    if (legs.current) legs.current.position.y = THREE.MathUtils.lerp(legs.current.position.y, legsDown ? 0 : 0.9, 0.2);
    markerMat.emissiveIntensity = night ? 1.3 : moving ? 0.7 : 0.3;
    tailMat.emissiveIntensity = night || moving ? 1.1 : 0.4;
  });

  const addWheel = (el: THREE.Group | null, i: number) => { if (el) wheels.current[i] = el; };
  let wi = 0;
  const wheel = (x: number, z: number) => {
    const i = wi++;
    return (
      <group key={`${x}-${z}`} ref={(el) => addWheel(el, i)} position={[x, 0.5, z]}>
        <mesh castShadow geometry={tyreGeom} material={tyreMat} />
        <mesh geometry={rimGeom} material={rimMat} />
      </group>
    );
  };

  return (
    <group
      ref={root}
      onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(); } : undefined}
      onPointerOver={onSelect ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={onSelect ? () => { document.body.style.cursor = 'auto'; } : undefined}
    >
      {/* ---- Chassis ---- */}
      {([-1.05, 1.05] as const).map((z) => (
        <mesh key={z} position={[-5.7, 1.15, z * 0.5]} material={chassisMat}>
          <boxGeometry args={[12.0, 0.25, 0.12]} />
        </mesh>
      ))}
      {BULK_X.concat([-11.2]).map((x, i) => (
        <mesh key={i} position={[x, 1.15, 0]} material={chassisMat}>
          <boxGeometry args={[0.12, 0.2, 1.1]} />
        </mesh>
      ))}
      {/* kingpin plate */}
      <mesh position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={steelInner}>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 20]} />
      </mesh>
      {/* landing legs (retractable) */}
      <group ref={legs}>
        {([-0.9, 0.9] as const).map((z, i) => (
          <group key={i} position={[-1.8, 0, z]}>
            <mesh position={[0, 0.55, 0]} material={chassisMat}>
              <boxGeometry args={[0.14, 1.1, 0.14]} />
            </mesh>
            <mesh position={[0, 0.03, 0]} material={chassisMat}>
              <boxGeometry args={[0.3, 0.06, 0.3]} />
            </mesh>
          </group>
        ))}
        {/* crank handle */}
        <mesh position={[-1.8, 0.9, 1.05]} rotation={[Math.PI / 2, 0, 0]} material={steelInner}>
          <torusGeometry args={[0.12, 0.02, 6, 12]} />
        </mesh>
      </group>
      {/* rear underrun bar with chevrons */}
      <mesh position={[-11.6, 0.7, 0]} material={chassisMat}>
        <boxGeometry args={[0.1, 0.16, 2.2]} />
      </mesh>
      {/* toolbox + spare wheel */}
      <mesh position={[-5.5, 0.85, 1.15]} material={chassisMat}>
        <boxGeometry args={[1.2, 0.5, 0.3]} />
      </mesh>
      <mesh position={[-6.5, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} material={tyreMat}>
        <cylinderGeometry args={[0.5, 0.5, 0.3, 16]} />
      </mesh>

      {/* ---- Cylinder bank (instanced, domed) + neck bands ---- */}
      {rowInst.map((ri, r) => (
        <group key={r}>
          <primitive object={ri.bodies} />
          <primitive object={ri.bands} />
        </group>
      ))}

      {/* ---- Pigtail tubes (32, cylinder neck → bank manifold) ---- */}
      <mesh geometry={pigtailGeom} material={pigtailMat} />

      {/* ---- Support bulkheads ---- */}
      {BULK_X.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* frame border */}
          <mesh position={[0, 2.9, 0]} material={chassisMat}><boxGeometry args={[0.08, 0.1, 2.5]} /></mesh>
          <mesh position={[0, 1.35, 0]} material={chassisMat}><boxGeometry args={[0.08, 0.1, 2.5]} /></mesh>
          {([-1.2, 1.2] as const).map((z, k) => (
            <mesh key={k} position={[0, 2.1, z]} material={chassisMat}><boxGeometry args={[0.08, 1.6, 0.1]} /></mesh>
          ))}
          {/* two internal divider bars (cutout hint) */}
          {[1.72, 2.42].map((y, k) => (
            <mesh key={k} position={[0, y, 0]} material={chassisMat}><boxGeometry args={[0.06, 0.06, 2.4]} /></mesh>
          ))}
          {/* retaining straps over top row */}
          <mesh position={[0, 2.75, 0]} material={strapMat}><boxGeometry args={[0.05, 0.06, 2.3]} /></mesh>
        </group>
      ))}

      {/* ---- Protective cage (blue) ---- */}
      {BULK_X.map((x, i) => (
        <group key={i}>
          {([-1.35, 1.35] as const).map((z, k) => (
            <mesh key={k} position={[x, 2.15, z]} material={cageMat}><boxGeometry args={[0.1, 1.9, 0.1]} /></mesh>
          ))}
          {/* roof transverse */}
          <mesh position={[x, 3.05, 0]} material={cageMat}><boxGeometry args={[0.1, 0.1, 2.8]} /></mesh>
        </group>
      ))}
      {/* longitudinal rails: top + mid, both sides + roof */}
      {([-1.35, 1.35] as const).map((z, i) =>
        [3.05, 2.6, 1.35].map((y, k) => (
          <mesh key={`${i}-${k}`} position={[-4.9, y, z]} material={cageMat}><boxGeometry args={[9.6, 0.1, 0.1]} /></mesh>
        )),
      )}
      {[-0.7, 0.7].map((z, i) => (
        <mesh key={i} position={[-4.9, 3.05, z]} material={cageMat}><boxGeometry args={[9.6, 0.08, 0.08]} /></mesh>
      ))}
      {/* X-bracing on the two side panels */}
      {([-1.36, 1.36] as const).map((z, i) =>
        [1, -1].map((s, k) => (
          <mesh key={`${i}-${k}`} position={[-4.9, 2.2, z]} rotation={[0, 0, s * 0.5]} material={cageMat}><boxGeometry args={[6.5, 0.06, 0.06]} /></mesh>
        )),
      )}

      {/* ---- Rear manifold cabinet with doors ---- */}
      <group position={[-11.0, 1.9, 0]}>
        <mesh material={cabMat}><boxGeometry args={[0.6, 1.4, 2.4]} /></mesh>
        <mesh position={[-0.31, 0, 0]} material={steelInner}><boxGeometry args={[0.02, 1.3, 2.3]} /></mesh>
        {/* internals: 4 bank manifolds + gauges + couplings + valves + vent stack */}
        {ROWS_Y.map((_, r) => (
          <group key={r} position={[-0.34, -0.5 + r * 0.34, 0]}>
            <mesh material={bandMats[r]}><boxGeometry args={[0.04, 0.05, 1.9]} /></mesh>
            <group position={[0, 0, 0.9]} scale={0.3}><Valve size={0.3} color={BANK_COLOR[r]} handwheel seed={700 + r} /></group>
            <group position={[-0.04, 0.12, -0.7]} rotation={[0, -Math.PI / 2, 0]} scale={0.5}><Gauge radius={0.13} seed={704 + r} /></group>
          </group>
        ))}
        {/* master gauge + 3 couplings + dust caps */}
        <group position={[-0.36, 0.5, 0.4]} rotation={[0, -Math.PI / 2, 0]} scale={0.6}><Gauge radius={0.14} seed={708} /></group>
        {[-0.5, 0, 0.5].map((z, i) => (
          <group key={i} position={[-0.4, -0.2, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={steelInner}><cylinderGeometry args={[0.05, 0.05, 0.25, 12]} /></mesh>
            <mesh position={[-0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={chevronMat}><cylinderGeometry args={[0.06, 0.06, 0.04, 12]} /></mesh>
          </group>
        ))}
        {/* vent stack + common relief stack rising 0.8 above the cabinet */}
        <mesh position={[0, 1.1, 0.7]} material={steelInner}><cylinderGeometry args={[0.04, 0.04, 0.9, 10]} /></mesh>
        <mesh position={[0, 1.3, -0.5]} material={steelInner}><cylinderGeometry args={[0.05, 0.05, 1.3, 10]} /></mesh>
        <mesh position={[0, 1.95, -0.5]} material={chevronMat}><cylinderGeometry args={[0.055, 0.055, 0.18, 10]} /></mesh>
        <mesh position={[0, 2.02, -0.5]} material={chassisMat}><coneGeometry args={[0.07, 0.08, 10]} /></mesh>
        {/* earthing lug + stainless data plate */}
        <mesh position={[0.31, -0.6, 1.0]} material={chevronMat}><boxGeometry args={[0.06, 0.1, 0.1]} /></mesh>
        <SignPlane text="H2O 3200 L · 250 BAR · TEST 04/26" width={0.9} position={[0.32, 0.3, 0.6]} rotation={[0, Math.PI / 2, 0]} options={{ fg: '#123', bg: '#c8d2d8', fontWeight: 600 }} />
        {/* doors (hinged at outer edges) */}
        <group ref={leftDoor} position={[0.3, 0, 1.2]}>
          <mesh position={[0, 0, -0.6]} material={cabMat}><boxGeometry args={[0.05, 1.35, 1.2]} /></mesh>
        </group>
        <group ref={rightDoor} position={[0.3, 0, -1.2]}>
          <mesh position={[0, 0, 0.6]} material={cabMat}><boxGeometry args={[0.05, 1.35, 1.2]} /></mesh>
        </group>
      </group>

      {/* ---- Wheels (3 axles × dual) ---- */}
      {[-7.8, -9.1, -10.4].map((x) => [1.0, 1.34, -1.0, -1.34].map((z) => wheel(x, z)))}

      {/* ---- Livery + hazard markings (Section 16 §D — separate non-overlapping
             zones; brand lockup on a backing panel so no frame member splits it) ---- */}
      {([1, -1] as const).map((s) => (
        <group key={s} position={[-4.9, 2.15, s * 1.42]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          {/* [A] brand lockup — upper band, centred, on a navy backing panel */}
          <mesh position={[0, 0.58, 0.015]} material={liveryBackMat}><boxGeometry args={[5.8, 0.72, 0.02]} /></mesh>
          <LogoDecal position={[-1.95, 0.58, 0.05]} width={1.35} backing={false} />
          <SignPlane text="ADANI TOTAL GAS" width={3.1} position={[1.05, 0.58, 0.05]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 2 }} />
          {/* [B] product descriptor — directly below A, smaller */}
          <SignPlane text="CNG — COMPRESSED NATURAL GAS" width={3.6} position={[0, 0.06, 0.04]} options={{ fg: '#dCE8f2', fontWeight: 700, letterSpacing: 1 }} />
          {/* [C] fleet number — lower LEFT on its own white panel */}
          <SignPlane text={id} width={1.3} position={[-3.35, -0.55, 0.04]} options={{ fg: '#16202b', bg: '#ffffff', fontWeight: 800, radius: 4, paddingX: 14 }} />
          {/* [D] pressure marking — lower CENTRE on its own yellow panel */}
          <SignPlane text="MAX PRESSURE 250 BAR" width={2.4} position={[0, -0.55, 0.04]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 700, radius: 4, paddingX: 10 }} />
          {/* [E] hazard diamond placard — lower RIGHT */}
          <group position={[3.35, -0.5, 0.02]} rotation={[0, 0, Math.PI / 4]}>
            <mesh material={new THREE.MeshStandardMaterial({ color: '#c01a1a', roughness: 0.5 })}><boxGeometry args={[0.5, 0.5, 0.02]} /></mesh>
          </group>
          <SignPlane text="2" width={0.28} position={[3.35, -0.7, 0.06]} options={{ fg: '#ffffff', fontWeight: 800 }} />
          {/* reflective strip at deck level */}
          <mesh position={[0, -0.92, 0.01]} material={chevronMat}><boxGeometry args={[9.4, 0.12, 0.02]} /></mesh>
        </group>
      ))}
      {/* rear hazard chevron panel + placard + text */}
      <group position={[-11.65, 1.5, 0]} rotation={[0, Math.PI, 0]}>
        {[-0.7, 0, 0.7].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, 0.6]} material={chevronMat}><boxGeometry args={[0.02, 1.4, 0.3]} /></mesh>
        ))}
        <SignPlane text="COMPRESSED NATURAL GAS" width={2.2} position={[0.01, 0.9, 0]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 800, radius: 4, paddingX: 10 }} />
      </group>
      {/* rear tail lamp clusters */}
      {([-0.9, 0.9] as const).map((z, i) => (
        <mesh key={i} position={[-11.66, 0.9, z]} material={tailMat}><boxGeometry args={[0.04, 0.3, 0.2]} /></mesh>
      ))}
      {/* top-rail marker lamps (amber) */}
      {[-8, -6, -4, -2].map((x, i) => (
        <mesh key={i} position={[x, 3.12, 1.36]} material={markerMat}><boxGeometry args={[0.1, 0.06, 0.05]} /></mesh>
      ))}
    </group>
  );
}
