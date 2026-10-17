import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Pad } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Flange, Valve, Gauge } from '@/components3d/primitives/Fittings';
import { OdorPartPicker } from '@/components3d/cng/OdorPartPicker';
import { concrete, steel, paintedMetal, glass, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { useSimStore } from '@/state/useSimStore';
import { useOdorStore } from '@/state/useOdorStore';

/**
 * Section 06 — Odorization Unit (mercaptan dosing skid) inside a fenced hazardous
 * compound at the City Gate Station, downstream of the PRS on the outlet header.
 * A cream storage tank in a concrete bund, a twin-pump dosing skid with a
 * calibration pot, an injection quill tapping the main gas pipe, a control panel,
 * and full safety kit (shower/eyewash, spill/PPE cabinets, gas detector, fire
 * extinguisher, wind sock, hazard signage). Injects odorant so leaks smell —
 * mandatory under PNGRB. Local origin at compound centre; the gas pipe is at +Z.
 */

function OdorRunner() {
  useFrame((_, delta) => useOdorStore.getState().tick(Math.min(delta, 0.05) * useSimStore.getState().speed));
  return null;
}

export function OdorizationUnit({ position = [0, 0, 0], rotation = 0 }: { position?: [number, number, number]; rotation?: number }) {
  const gravelMat = useMemo(() => concrete('#8a867c', 900), []);
  const fenceMat = useMemo(() => steel({ color: '#8a9099', roughness: 0.6, metalness: 0.7, seed: 901 }), []);
  const tankMat = useMemo(() => paintedMetal('#efeae0', 902), []);
  const bandMat = useMemo(() => paintedMetal('#d4622a', 903), []);
  const bundMat = useMemo(() => concrete('#c2beb4', 904), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 905 }), []);
  const frameMat = useMemo(() => steel({ color: '#9ba3ab', roughness: 0.5, metalness: 0.85, seed: 906 }), []);
  const pumpMat = useMemo(() => paintedMetal('#2f6f8f', 907), []);
  const cabMat = useMemo(() => steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 908 }), []);
  const showerMat = useMemo(() => paintedMetal('#b8d430', 909), []);
  const yellowMat = useMemo(() => paintedMetal('#e6b422', 910), []);
  const redMat = useMemo(() => paintedMetal('#c01a1a', 911), []);
  const screenMat = useMemo(() => emissive(BRAND.tealCng, 1.0), []);
  const liquidMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9a24a', roughness: 0.3, metalness: 0.1 }), []);

  const pumpHead = useRef<THREE.Group>(null);
  const windSock = useRef<THREE.Group>(null);
  const liquid = useRef<THREE.Mesh>(null);
  const ledA = useMemo(() => emissive('#39d98a', 1.2), []);
  const ledB = useMemo(() => emissive('#e0a23c', 1.0), []);
  const ledFault = useMemo(() => emissive('#d94f4f', 0.3), []);
  const parts = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tvals = useMemo(() => Float32Array.from({ length: 10 }, (_, i) => i / 10), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { pumpsOn, tankPct } = useOdorStore.getState();
    // pump A diaphragm stroke (~1 Hz)
    if (pumpHead.current) pumpHead.current.position.x = pumpsOn ? Math.sin(t * Math.PI * 2) * 0.02 : 0;
    // wind sock sway
    if (windSock.current) windSock.current.rotation.z = -0.5 + Math.sin(t * 1.2) * 0.25;
    // tank sight-glass liquid level
    if (liquid.current) {
      const h = 1.5 * (tankPct / 100);
      liquid.current.scale.y = Math.max(0.02, h / 1.5);
      liquid.current.position.y = 0.55 + h / 2;
    }
    // LEDs
    ledA.emissiveIntensity = pumpsOn ? 1.0 + Math.sin(t * 5) * 0.6 : 0.15;
    ledFault.emissiveIntensity = pumpsOn ? 0.2 : 1.2 + Math.sin(t * 8) * 0.5;
    // faint injection particles (odorant into the gas pipe, +Z)
    if (parts.current) {
      parts.current.visible = pumpsOn;
      if (pumpsOn) {
        const dt = Math.min(delta, 0.05) * useSimStore.getState().speed;
        for (let i = 0; i < 10; i++) {
          let v = tvals[i] + dt * 0.6;
          if (v > 1) v -= 1;
          tvals[i] = v;
          dummy.position.set(1, 1.1, 3.2 + v * 1.4);
          dummy.scale.setScalar(0.05);
          dummy.updateMatrix();
          parts.current.setMatrixAt(i, dummy.matrix);
        }
        parts.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  const fencePosts = useMemo(() => {
    const arr: [number, number][] = [];
    for (let x = -4; x <= 4; x += 2) { arr.push([x, -3]); arr.push([x, 3]); }
    for (let z = -1; z <= 1; z += 2) { arr.push([-4, z]); arr.push([4, z]); }
    return arr;
  }, []);
  const warnSigns = ['MERCAPTAN — HAZARDOUS CHEMICAL', 'PPE REQUIRED BEYOND THIS POINT', 'NO UNAUTHORISED ENTRY', 'TOXIC — DO NOT INHALE'];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <OdorPartPicker>
        <group>
          {/* compound pad */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={gravelMat}><planeGeometry args={[8, 6]} /></mesh>

          {/* mesh fence + gate gap on +Z */}
          {fencePosts.map((p, i) => (
            <mesh key={i} position={[p[0], 1.0, p[1]]} castShadow material={fenceMat}><cylinderGeometry args={[0.05, 0.05, 2.0, 6]} /></mesh>
          ))}
          {[
            { pos: [-4, 1.0, 0] as [number, number, number], size: [6, 1.9] as [number, number], rot: Math.PI / 2 },
            { pos: [4, 1.0, 0] as [number, number, number], size: [6, 1.9] as [number, number], rot: Math.PI / 2 },
            { pos: [0, 1.0, -3] as [number, number, number], size: [8, 1.9] as [number, number], rot: 0 },
            { pos: [-2.9, 1.0, 3] as [number, number, number], size: [2, 1.9] as [number, number], rot: 0 },
            { pos: [2.9, 1.0, 3] as [number, number, number], size: [2, 1.9] as [number, number], rot: 0 },
          ].map((f, i) => (
            <mesh key={i} position={f.pos} rotation={[0, f.rot, 0]}>
              <planeGeometry args={f.size} />
              <meshStandardMaterial color="#b8bec4" roughness={0.8} metalness={0.3} transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* lockable gate (+Z) */}
          <mesh position={[0, 1.0, 3]} material={fenceMat}><boxGeometry args={[1.8, 1.9, 0.06]} /></mesh>
          <mesh position={[0.7, 1.0, 3.04]} material={yellowMat}><boxGeometry args={[0.12, 0.12, 0.06]} /></mesh>
          {/* warning signs on the fence */}
          {warnSigns.map((s, i) => (
            <SignPlane key={i} text={s} width={2.4} position={[-2.5 + (i % 2) * 5, 1.6, -2.96]} options={{ fg: '#16202b', bg: i < 2 ? '#f2d21e' : '#ff8c42', fontWeight: 800, radius: 4, paddingX: 10 }} />
          ))}

          {/* ── Storage tank in a concrete bund (back-left) ── */}
          <group position={[-2, 0, -1.4]}>
            {/* bund walls (3.0 × 2.5) + yellow stripe */}
            {([[0, -1.25, 3.0, 0.35], [0, 1.25, 3.0, 0.35]] as const).map((w, i) => (
              <mesh key={`bz${i}`} position={[w[0], 0.35, w[1]]} material={bundMat}><boxGeometry args={[w[2], 0.7, w[3]]} /></mesh>
            ))}
            {([[-1.5, 0], [1.5, 0]] as const).map((w, i) => (
              <mesh key={`bx${i}`} position={[w[0], 0.35, w[1]]} material={bundMat}><boxGeometry args={[0.35, 0.7, 2.5]} /></mesh>
            ))}
            <mesh position={[0, 0.72, 1.25]} material={yellowMat}><boxGeometry args={[3.05, 0.04, 0.4]} /></mesh>
            <mesh position={[0, 0.03, 0]} receiveShadow material={bundMat}><boxGeometry args={[2.7, 0.06, 2.2]} /></mesh>
            {/* sump + grating + pump */}
            <mesh position={[1.0, 0.06, 0.8]} material={steelMat}><boxGeometry args={[0.4, 0.05, 0.4]} /></mesh>
            <mesh position={[1.5, 0.3, 0.8]} material={pumpMat}><boxGeometry args={[0.3, 0.4, 0.3]} /></mesh>
            {/* access steps + handrail over the wall (+Z) */}
            <mesh position={[0, 0.15, 1.5]} material={bundMat}><boxGeometry args={[0.8, 0.3, 0.3]} /></mesh>
            <mesh position={[0, 0.35, 1.75]} material={bundMat}><boxGeometry args={[0.8, 0.2, 0.3]} /></mesh>
            {([-0.4, 0.4] as const).map((x, i) => (
              <mesh key={i} position={[x, 0.85, 1.6]} material={steelMat}><cylinderGeometry args={[0.02, 0.02, 0.9, 6]} /></mesh>
            ))}

            {/* tank body + domed heads + hazard band + legs */}
            <group position={[0, 0, 0]}>
              <mesh position={[0, 1.3, 0]} castShadow receiveShadow material={tankMat}><cylinderGeometry args={[0.55, 0.55, 1.5, 24]} /></mesh>
              <mesh position={[0, 2.05, 0]} castShadow material={tankMat}><sphereGeometry args={[0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
              <mesh position={[0, 0.55, 0]} rotation={[Math.PI, 0, 0]} castShadow material={tankMat}><sphereGeometry args={[0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
              <mesh position={[0, 1.85, 0]} material={bandMat}><cylinderGeometry args={[0.56, 0.56, 0.25, 24]} /></mesh>
              {/* 3 legs */}
              {[0, 1, 2].map((i) => { const a = (i / 3) * Math.PI * 2; return (
                <mesh key={i} position={[Math.cos(a) * 0.45, 0.28, Math.sin(a) * 0.45]} castShadow material={frameMat}><cylinderGeometry args={[0.04, 0.04, 0.55, 6]} /></mesh>
              ); })}
              {/* sight-glass level gauge + liquid line */}
              <mesh position={[0.57, 1.3, 0]} material={glass('#cfe4ee', 0.1)}><cylinderGeometry args={[0.03, 0.03, 1.5, 8]} /></mesh>
              <mesh ref={liquid} position={[0.57, 1.0, 0]} material={liquidMat}><cylinderGeometry args={[0.025, 0.025, 1.5, 8]} /></mesh>
              {/* manway + PV relief + level transmitter on top */}
              <mesh position={[0, 2.35, 0]} material={steelMat}><cylinderGeometry args={[0.12, 0.12, 0.08, 12]} /></mesh>
              <mesh position={[0.2, 2.3, 0]} material={steelMat}><cylinderGeometry args={[0.04, 0.04, 0.14, 8]} /></mesh>
              {/* vent → carbon canister drum beside tank */}
              <Pipe from={[0, 2.35, 0]} to={[0.9, 2.0, 0]} radius={0.02} color="#8a9199" seed={912} />
              <mesh position={[0.95, 0.65, 0]} castShadow material={steelMat}><cylinderGeometry args={[0.18, 0.18, 0.5, 16]} /></mesh>
              <SignPlane text="CARBON" width={0.3} position={[0.95, 0.65, 0.19]} options={{ fg: '#ffffff', fontWeight: 700 }} />
              {/* fill nozzle + platform, outlet nozzle (bottom), nameplate, earthing */}
              <mesh position={[-0.55, 1.5, 0]} rotation={[0, 0, Math.PI / 2]} material={steelMat}><cylinderGeometry args={[0.05, 0.05, 0.1, 8]} /></mesh>
              <mesh position={[-0.55, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} material={steelMat}><cylinderGeometry args={[0.05, 0.05, 0.14, 8]} /></mesh>
              <SignPlane text="C6H5SH" width={0.28} position={[0, 1.3, 0.56]} options={{ fg: '#16202b', bg: '#d6dade', fontWeight: 700 }} />
              <mesh position={[-0.4, 0.15, 0.3]} material={yellowMat}><boxGeometry args={[0.05, 0.08, 0.05]} /></mesh>
            </group>
          </group>

          {/* ── Dosing pump skid (front-centre) ── */}
          <group position={[1, 0, -0.4]}>
            <Pad size={[2.2, 1.2]} height={0.25} seed={913} />
            {/* drip tray */}
            <mesh position={[0, 0.3, 0]} material={steelMat}><boxGeometry args={[2.0, 0.05, 1.0]} /></mesh>
            <mesh position={[0, 0.36, 0.48]} material={frameMat}><boxGeometry args={[2.0, 0.08, 0.04]} /></mesh>
            {/* twin dosing pumps (A duty w/ stroke knob + reciprocating head, B standby) */}
            {([-0.5, 0.5] as const).map((x, i) => (
              <group key={i} position={[x, 0.55, -0.2]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={pumpMat}><cylinderGeometry args={[0.13, 0.13, 0.35, 16]} /></mesh>
                {i === 0 ? (
                  <group ref={pumpHead} position={[0.28, 0, 0]}>
                    <mesh material={steelMat}><cylinderGeometry args={[0.09, 0.09, 0.14, 14]} /></mesh>
                  </group>
                ) : (
                  <mesh position={[0.28, 0, 0]} material={steelMat}><cylinderGeometry args={[0.09, 0.09, 0.14, 14]} /></mesh>
                )}
                {/* stroke adjustment knob w/ graduated dial */}
                <mesh position={[0, 0.22, 0]} material={steelMat}><cylinderGeometry args={[0.06, 0.07, 0.08, 12]} /></mesh>
                <SignPlane text={i === 0 ? 'A' : 'B'} width={0.12} position={[0, 0.27, 0.001]} options={{ fg: '#16202b', fontWeight: 800 }} />
              </group>
            ))}
            {/* calibration pot (graduated transparent cylinder) — key detail */}
            <group position={[0.9, 0.7, 0.2]}>
              <mesh material={glass('#dfeaf0', 0.05)}><cylinderGeometry args={[0.05, 0.05, 0.4, 12]} /></mesh>
              <mesh position={[0, -0.05, 0]} material={liquidMat}><cylinderGeometry args={[0.045, 0.045, 0.28, 12]} /></mesh>
              <group position={[0, 0.24, 0]} scale={0.22}><Valve size={0.28} color={BRAND.primary} handwheel seed={914} /></group>
              <group position={[0, -0.24, 0]} scale={0.22}><Valve size={0.28} color={BRAND.primary} handwheel seed={915} /></group>
              <SignPlane text="CAL" width={0.14} position={[0.06, 0, 0.05]} options={{ fg: '#16202b', fontWeight: 700 }} />
            </group>
            {/* pulsation dampener (sphere) + relief valve + gauge + strainer + tubing */}
            <mesh position={[-0.9, 0.7, 0.2]} material={steelMat}><sphereGeometry args={[0.12, 14, 10]} /></mesh>
            <group position={[-0.9, 0.95, 0.2]} rotation={[Math.PI / 2, 0, 0]} scale={0.4}><Gauge radius={0.14} seed={916} /></group>
            <mesh position={[-1.3, 0.5, -0.2]} material={steelMat}><cylinderGeometry args={[0.06, 0.06, 0.2, 10]} /></mesh>
            {/* small-bore tubing with clamps */}
            <Pipe from={[-1.3, 0.55, -0.2]} to={[-0.5, 0.55, -0.2]} radius={0.015} color="#c2c7cc" seed={917} />
            <Pipe from={[0.5, 0.55, -0.2]} to={[0.9, 0.55, 0.2]} radius={0.015} color="#c2c7cc" seed={918} />
            {/* 6 small isolation ball valves */}
            {[[-1.3, 0.3], [-0.2, 0.3], [0.9, 0.3], [-0.6, -0.35], [0.3, -0.35], [1.0, -0.35]].map((v, i) => (
              <group key={i} position={[v[0], 0.55, v[1]]} scale={0.16}><Valve size={0.28} color={BRAND.alert} handwheel seed={919 + i} /></group>
            ))}
          </group>

          {/* ── Injection point on the main gas pipe (+Z, reaches station outlet) ── */}
          <group position={[1, 1.1, 4.5]}>
            {/* boss + flange + isolation valve + quill + check valve */}
            <mesh position={[0, -0.5, 0]} material={steelMat}><boxGeometry args={[0.12, 0.12, 0.12]} /></mesh>
            <group position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}><Flange radius={0.1} thickness={0.03} bolts={6} seed={926} /></group>
            <group position={[0, -0.15, 0]} scale={0.2}><Valve size={0.28} color={BRAND.primary} handwheel seed={927} /></group>
            <mesh position={[0, 0.05, 0]} material={steelMat}><cylinderGeometry args={[0.025, 0.025, 0.3, 8]} /></mesh>
            <mesh position={[0, -0.4, 0.12]} material={steelMat}><sphereGeometry args={[0.05, 10, 8]} /></mesh>
            {/* painted band on the main pipe + label */}
            <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={bandMat}><cylinderGeometry args={[0.22, 0.22, 0.2, 16]} /></mesh>
            <SignPlane text="ODORANT INJECTION POINT" width={1.6} position={[0, 0.35, 0]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 10 }} doubleSide />
            <SignPlane text="ODORIZED GAS →" width={1.2} position={[0.9, -0.5, 0]} options={{ fg: '#ffffff', bg: BRAND.tealCng, fontWeight: 700, radius: 4, paddingX: 8 }} doubleSide />
          </group>
          {/* dosing line from skid up to injection point */}
          <Pipe from={[1, 0.7, 0.1]} to={[1, 1.1, 3.9]} radius={0.02} color="#c2c7cc" seed={928} />
          <instancedMesh ref={parts} args={[undefined, undefined, 10]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#ff9a3c" toneMapped={false} transparent opacity={0.8} />
          </instancedMesh>

          {/* ── Control panel (right) ── */}
          <group position={[3, 0, -0.5]}>
            {([-0.25, 0.25] as const).map((x, i) => (
              <mesh key={i} position={[x, 0.35, 0]} material={steelMat}><boxGeometry args={[0.06, 0.7, 0.06]} /></mesh>
            ))}
            <mesh position={[0, 1.15, 0]} castShadow receiveShadow material={cabMat}><boxGeometry args={[0.7, 0.9, 0.3]} /></mesh>
            {/* two displays */}
            <mesh position={[-0.15, 1.35, 0.16]} material={screenMat}><boxGeometry args={[0.28, 0.18, 0.02]} /></mesh>
            <SignPlane text="DOSE mg/SCM" width={0.26} position={[-0.15, 1.35, 0.172]} options={{ fg: '#8ef3d6', fontWeight: 700 }} />
            <mesh position={[0.18, 1.35, 0.16]} material={screenMat}><boxGeometry args={[0.24, 0.18, 0.02]} /></mesh>
            <SignPlane text="TANK %" width={0.22} position={[0.18, 1.35, 0.172]} options={{ fg: '#8ef3d6', fontWeight: 700 }} />
            {/* 4 LEDs + selector + ESD */}
            <mesh position={[-0.22, 1.1, 0.16]} material={ledA}><cylinderGeometry args={[0.02, 0.02, 0.02, 10]} /></mesh>
            <mesh position={[-0.08, 1.1, 0.16]} material={ledB}><cylinderGeometry args={[0.02, 0.02, 0.02, 10]} /></mesh>
            <mesh position={[0.06, 1.1, 0.16]} material={ledFault}><cylinderGeometry args={[0.02, 0.02, 0.02, 10]} /></mesh>
            <mesh position={[0.2, 1.1, 0.16]} material={ledFault}><cylinderGeometry args={[0.02, 0.02, 0.02, 10]} /></mesh>
            <mesh position={[0.2, 0.92, 0.16]} rotation={[Math.PI / 2, 0, 0]} material={redMat}><cylinderGeometry args={[0.045, 0.045, 0.04, 12]} /></mesh>
            <LogoDecal position={[-0.12, 0.92, 0.16]} width={0.3} backing backingColor="#ffffff" />
            <mesh position={[0.1, 0.35, -0.1]} material={steelMat}><cylinderGeometry args={[0.02, 0.02, 0.7, 8]} /></mesh>
          </group>

          {/* ── Safety equipment ── */}
          {/* safety shower + eyewash (bright yellow-green) */}
          <group position={[-3.2, 0, 1.8]}>
            <mesh position={[0, 1.2, 0]} castShadow material={showerMat}><cylinderGeometry args={[0.06, 0.06, 2.4, 8]} /></mesh>
            <mesh position={[0, 2.35, 0.15]} material={showerMat}><cylinderGeometry args={[0.2, 0.2, 0.06, 16]} /></mesh>
            <mesh position={[0, 1.7, 0.1]} material={showerMat}><cylinderGeometry args={[0.01, 0.01, 0.4, 6]} /></mesh>
            <mesh position={[0.2, 1.1, 0]} material={showerMat}><cylinderGeometry args={[0.15, 0.12, 0.08, 12]} /></mesh>
            <mesh position={[0, 0.03, 0]} material={steelMat}><boxGeometry args={[0.6, 0.05, 0.6]} /></mesh>
          </group>
          {/* spill kit cabinet */}
          <group position={[-3.3, 0, 0.4]}>
            <mesh position={[0, 0.75, 0]} castShadow material={yellowMat}><boxGeometry args={[0.6, 0.9, 0.4]} /></mesh>
            <SignPlane text="SPILL KIT" width={0.5} position={[0, 0.85, 0.21]} options={{ fg: '#16202b', fontWeight: 800 }} />
          </group>
          {/* PPE cabinet */}
          <group position={[-3.3, 0, -1.2]}>
            <mesh position={[0, 0.7, 0]} castShadow material={paintedMetal('#3a6ea5', 932)}><boxGeometry args={[0.6, 0.8, 0.35]} /></mesh>
            <SignPlane text="PPE" width={0.4} position={[0, 0.82, 0.19]} options={{ fg: '#ffffff', fontWeight: 800 }} />
            <SignPlane text="RESPIRATOR·GLOVES·GOGGLES" width={0.56} position={[0, 0.55, 0.19]} options={{ fg: '#eaf2f8', fontWeight: 600 }} />
          </group>
          {/* fire extinguisher on the control-panel stand */}
          <mesh position={[3.5, 0.5, -0.4]} castShadow material={redMat}><cylinderGeometry args={[0.09, 0.09, 0.5, 12]} /></mesh>
          {/* gas detector on the fence */}
          <group position={[3.9, 1.6, -1.5]}>
            <mesh material={paintedMetal('#e0a23c', 933)}><boxGeometry args={[0.14, 0.18, 0.1]} /></mesh>
            <SignPlane text="GAS" width={0.12} position={[0, 0, 0.06]} options={{ fg: '#16202b', fontWeight: 700 }} />
          </group>
          {/* emergency signage board */}
          <group position={[2.4, 0, 2.6]}>
            <mesh position={[0, 1.3, 0]} material={steelMat}><boxGeometry args={[0.06, 2.0, 0.06]} /></mesh>
            <mesh position={[0, 2.0, 0]} material={paintedMetal('#ffffff', 934)}><boxGeometry args={[1.2, 0.9, 0.05]} /></mesh>
            <SignPlane text="⚠ MERCAPTAN — HAZARD & FIRST AID" width={1.1} position={[0, 2.2, 0.03]} options={{ fg: '#c01a1a', fontWeight: 800 }} />
            <SignPlane text="EMERGENCY ☎ 1906" width={1.0} position={[0, 1.85, 0.03]} options={{ fg: '#16202b', fontWeight: 700 }} />
          </group>

          {/* ── Wind sock on a pole (animated) ── */}
          <group position={[3.5, 0, 2.2]}>
            <mesh position={[0, 2.0, 0]} castShadow material={steelMat}><cylinderGeometry args={[0.05, 0.06, 4.0, 8]} /></mesh>
            <group ref={windSock} position={[0, 3.9, 0]}>
              <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#ff8c42', 935)}><coneGeometry args={[0.18, 0.7, 12, 1, true]} /></mesh>
              <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#ffffff', 936)}><coneGeometry args={[0.1, 0.3, 12, 1, true]} /></mesh>
            </group>
          </group>

          {/* compound sign */}
          <SignPlane text="ODORIZATION UNIT" width={2.4} position={[0, 2.4, 3.02]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, radius: 6, paddingX: 16 }} doubleSide />
        </group>
      </OdorPartPicker>
      <OdorRunner />
    </group>
  );
}
