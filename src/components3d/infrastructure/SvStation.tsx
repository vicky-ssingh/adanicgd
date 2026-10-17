import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Handrail } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Flange, Gauge } from '@/components3d/primitives/Fittings';
import { DynGauge } from '@/components3d/cng/DynGauge';
import { concrete, steel, paintedMetal, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { useViewStore } from '@/state/useViewStore';
import { useSvStore } from '@/state/useSvStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useOdorStore } from '@/state/useOdorStore';
import type { SvDef } from '@/config/svStations';

/**
 * Section 07 §A.2 — a Sectionalizing Valve station. A fenced gravel compound with
 * a large ball valve on a plinth (the pipeline emerges from underground, connects,
 * and returns underground), a gearbox + 5-spoke handwheel with a rotating OPEN/
 * CLOSED position indicator, a 4 m vent stack, upstream + downstream gauges (the
 * downstream needle falls when the valve closes), an instrument cabinet, a CP
 * test post, marker posts, a light and a signage board. Clickable to operate the
 * valve; hovering highlights the section it controls. Local origin at ground.
 */
export function SvStation({ def }: { def: SvDef }) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const gravelMat = useMemo(() => concrete('#8a867c', 940), []);
  const apronMat = useMemo(() => concrete('#b9b5ac', 941), []);
  const fenceMat = useMemo(() => steel({ color: '#8a9099', roughness: 0.6, metalness: 0.7, seed: 942 }), []);
  const valveMat = useMemo(() => steel({ color: '#4a5a6a', roughness: 0.6, metalness: 0.8, seed: 943 }), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 944 }), []);
  const gearMat = useMemo(() => paintedMetal('#3a4652', 945), []);
  const wheelMat = useMemo(() => paintedMetal('#c9a227', 946), []);
  const hazardMat = useMemo(() => paintedMetal('#e6b422', 947), []);
  const cpMat = useMemo(() => paintedMetal('#e6b422', 948), []);
  const boardMat = useMemo(() => paintedMetal(BRAND.navy, 949), []);
  const lampMat = useMemo(() => emissive('#fff4e0', night ? 2.4 : 0.1), [night]);
  const plumeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dfe7ec', transparent: true, opacity: 0, depthWrite: false }), []);

  const wheel = useRef<THREE.Group>(null);
  const indicator = useRef<THREE.Group>(null);
  const plume = useRef<THREE.Group>(null);

  useFrame(() => {
    const r = useSvStore.getState().rt[def.id];
    if (!r) return;
    if (wheel.current) wheel.current.rotation.y = r.wheel;
    if (indicator.current) indicator.current.rotation.z = -r.ind * (Math.PI / 2); // OPEN(0)→CLOSED(90°)
    if (plume.current) {
      const k = Math.min(1, r.blowdown / 2.5);
      plume.current.visible = r.blowdown > 0;
      plume.current.scale.setScalar(0.5 + (1 - k) * 1.5);
      plumeMat.opacity = r.blowdown > 0 ? 0.5 * k : 0;
    }
  });

  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); useSvStore.getState().setHover(def.id); document.body.style.cursor = 'pointer'; };
  const onOut = () => { useSvStore.getState().setHover(null); document.body.style.cursor = 'auto'; };
  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    useSelectionStore.getState().clear();
    useRouteStore.getState().clear();
    useStationInfoStore.getState().close();
    useMotherInfoStore.getState().close();
    useDaughterInfoStore.getState().close();
    useTrailerInfoStore.getState().close();
    useOdorStore.getState().close();
    useSvStore.getState().openPanel(def.id);
  };

  const downFrac = () => 1 - useSvStore.getState().rt[def.id].ind * 0.9; // downstream gauge falls when closed

  return (
    <group position={def.position} rotation={[0, def.rotation, 0]}>
      <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        {/* gravel compound + concrete apron */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={gravelMat}><planeGeometry args={[8, 6]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow material={apronMat}><planeGeometry args={[3.4, 2.4]} /></mesh>

        {/* mesh fence + posts + double gate (+Z) + barbed top */}
        {(() => {
          const posts: [number, number][] = [];
          for (let x = -4; x <= 4; x += 2) { posts.push([x, -3]); posts.push([x, 3]); }
          for (let z = -1; z <= 1; z += 2) { posts.push([-4, z]); posts.push([4, z]); }
          return posts.map((p, i) => (
            <mesh key={i} position={[p[0], 1.0, p[1]]} castShadow material={fenceMat}><cylinderGeometry args={[0.05, 0.05, 2.0, 6]} /></mesh>
          ));
        })()}
        {[
          { pos: [-4, 1.0, 0] as [number, number, number], size: [6, 1.9] as [number, number], rot: Math.PI / 2 },
          { pos: [4, 1.0, 0] as [number, number, number], size: [6, 1.9] as [number, number], rot: Math.PI / 2 },
          { pos: [0, 1.0, -3] as [number, number, number], size: [8, 1.9] as [number, number], rot: 0 },
          { pos: [-2.9, 1.0, 3] as [number, number, number], size: [2, 1.9] as [number, number], rot: 0 },
          { pos: [2.9, 1.0, 3] as [number, number, number], size: [2, 1.9] as [number, number], rot: 0 },
        ].map((f, i) => (
          <mesh key={i} position={f.pos} rotation={[0, f.rot, 0]}>
            <planeGeometry args={f.size} />
            <meshStandardMaterial color="#b8bec4" roughness={0.8} metalness={0.3} transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {/* barbed top strand */}
        {[-3, 3].map((z, i) => (
          <mesh key={i} position={[0, 2.05, z]} material={fenceMat}><boxGeometry args={[8, 0.02, 0.02]} /></mesh>
        ))}
        {/* double gate */}
        {([-0.45, 0.45] as const).map((x, i) => (
          <mesh key={i} position={[x, 1.0, 3]} material={fenceMat}><boxGeometry args={[0.9, 1.9, 0.05]} /></mesh>
        ))}

        {/* underground pipe: emerges (-X), up, through valve, down, returns (+X) */}
        <mesh position={[-1.5, -0.4, 0]} material={steelMat}><cylinderGeometry args={[0.16, 0.16, 2.4, 16]} /></mesh>
        <mesh position={[1.5, -0.4, 0]} material={steelMat}><cylinderGeometry args={[0.16, 0.16, 2.4, 16]} /></mesh>
        <Pipe from={[-1.5, 1.0, 0]} to={[-0.55, 1.0, 0]} radius={0.16} color="#8a9199" seed={950} />
        <Pipe from={[0.55, 1.0, 0]} to={[1.5, 1.0, 0]} radius={0.16} color="#8a9199" seed={951} />
        {/* saddle supports */}
        {([-1.2, 1.2] as const).map((x, i) => (
          <mesh key={i} position={[x, 0.55, 0]} material={apronMat}><boxGeometry args={[0.3, 0.9, 0.4]} /></mesh>
        ))}

        {/* valve plinth + ball valve body (cast look) + flanges (16 bolts each) */}
        <mesh position={[0, 0.2, 0]} receiveShadow material={concrete('#b0ada3', 952)}><boxGeometry args={[2.0, 0.4, 1.2]} /></mesh>
        <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={valveMat}><cylinderGeometry args={[0.38, 0.38, 0.9, 24]} /></mesh>
        <mesh position={[0, 1.35, 0]} castShadow material={valveMat}><sphereGeometry args={[0.34, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        {([-0.5, 0.5] as const).map((x, i) => (
          <group key={i} position={[x, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}><Flange radius={0.38} thickness={0.06} bolts={16} seed={953 + i} /></group>
        ))}

        {/* stem + protector + gearbox + handwheel + rotating position indicator */}
        <mesh position={[0, 1.75, 0]} material={steelMat}><cylinderGeometry args={[0.05, 0.05, 0.5, 10]} /></mesh>
        <mesh position={[0, 2.05, 0]} castShadow material={gearMat}><boxGeometry args={[0.4, 0.3, 0.35]} /></mesh>
        <group ref={wheel} position={[0, 2.35, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={wheelMat}><torusGeometry args={[0.27, 0.03, 8, 24]} /></mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]} material={wheelMat}><boxGeometry args={[0.54, 0.03, 0.03]} /></mesh>
          ))}
          <mesh material={wheelMat}><cylinderGeometry args={[0.05, 0.05, 0.08, 10]} /></mesh>
        </group>
        {/* position indicator plate + pointer + lock hasp */}
        <group position={[0.28, 2.05, 0.18]}>
          <mesh material={steel({ color: '#e8eaec', roughness: 0.4, seed: 954 })}><boxGeometry args={[0.02, 0.24, 0.24]} /></mesh>
          <group ref={indicator} position={[0.02, 0, 0]}>
            <mesh position={[0, 0.06, 0]} material={paintedMetal(BRAND.alert, 955)}><boxGeometry args={[0.01, 0.12, 0.03]} /></mesh>
          </group>
          <SignPlane text="O" width={0.06} position={[0.02, 0.09, 0.09]} options={{ fg: '#0a7d3a', fontWeight: 800 }} />
          <SignPlane text="C" width={0.06} position={[0.02, 0.09, -0.09]} options={{ fg: '#c01a1a', fontWeight: 800 }} />
        </group>
        <mesh position={[0.2, 2.2, -0.1]} material={steelMat}><boxGeometry args={[0.04, 0.06, 0.03]} /></mesh>

        {/* vent stack 4.0 with hazard band, rain cap, base vent valve + blowdown plume */}
        <group position={[1.6, 0, -1.2]}>
          <mesh position={[0, 2.0, 0]} castShadow material={steelMat}><cylinderGeometry args={[0.06, 0.06, 4.0, 10]} /></mesh>
          <mesh position={[0, 0.4, 0]} material={hazardMat}><cylinderGeometry args={[0.07, 0.07, 0.4, 10]} /></mesh>
          <mesh position={[0, 4.05, 0]} castShadow material={steelMat}><coneGeometry args={[0.11, 0.14, 12]} /></mesh>
          <group ref={plume} position={[0, 4.2, 0]} visible={false}>
            <mesh material={plumeMat}><sphereGeometry args={[0.3, 10, 10]} /></mesh>
            <mesh position={[0.1, 0.25, 0]} material={plumeMat}><sphereGeometry args={[0.2, 10, 10]} /></mesh>
          </group>
        </group>
        {/* blowdown valve + short discharge */}
        <mesh position={[1.0, 0.5, 0.3]} material={steelMat}><cylinderGeometry args={[0.05, 0.05, 0.3, 8]} /></mesh>

        {/* upstream + downstream gauges (downstream falls when closed) */}
        <group position={[-0.9, 1.35, 0.35]} rotation={[Math.PI / 2, 0, 0]} scale={0.7}><Gauge radius={0.16} seed={956} /></group>
        <group position={[0.9, 1.35, 0.35]} scale={0.7}><DynGauge radius={0.16} getValue={downFrac} seed={957} /></group>
        <SignPlane text="U/S" width={0.16} position={[-0.9, 1.65, 0.35]} options={{ fg: '#16202b', fontWeight: 700 }} />
        <SignPlane text="D/S" width={0.16} position={[0.9, 1.65, 0.35]} options={{ fg: '#16202b', fontWeight: 700 }} />

        {/* instrument cabinet + CP test post */}
        <group position={[-3, 0, -1.5]}>
          <mesh position={[0, 0.7, 0]} material={steelMat}><boxGeometry args={[0.06, 1.0, 0.06]} /></mesh>
          <mesh position={[0, 1.3, 0]} castShadow material={steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 958 })}><boxGeometry args={[0.7, 0.5, 0.25]} /></mesh>
          <mesh position={[0, 1.35, 0.13]} material={emissive(BRAND.tealCng, 0.9)}><boxGeometry args={[0.3, 0.16, 0.02]} /></mesh>
        </group>
        <group position={[-3, 0, 1.0]}>
          <mesh position={[0, 0.5, 0]} castShadow material={cpMat}><boxGeometry args={[0.1, 1.0, 0.1]} /></mesh>
          <mesh position={[0, 0.9, 0.06]} material={gearMat}><boxGeometry args={[0.14, 0.16, 0.06]} /></mesh>
          <SignPlane text="CP" width={0.1} position={[0, 0.9, 0.1]} options={{ fg: '#16202b', fontWeight: 800 }} />
        </group>

        {/* handrail around the valve plinth */}
        <group position={[0, 0.4, 0]}><Handrail width={2.2} depth={1.4} height={1.0} seed={959} /></group>

        {/* light pole */}
        <group position={[3.4, 0, -1.8]}>
          <mesh position={[0, 1.8, 0]} castShadow material={steelMat}><cylinderGeometry args={[0.06, 0.08, 3.6, 8]} /></mesh>
          <mesh position={[0, 3.6, 0.3]} material={lampMat}><boxGeometry args={[0.4, 0.12, 0.3]} /></mesh>
        </group>

        {/* signage board */}
        <group position={[0, 0, 3.05]}>
          <mesh position={[-1.4, 1.2, 0]} material={boardMat}><boxGeometry args={[0.08, 2.4, 0.08]} /></mesh>
          <mesh position={[1.4, 1.2, 0]} material={boardMat}><boxGeometry args={[0.08, 2.4, 0.08]} /></mesh>
          <mesh position={[0, 2.2, 0]} castShadow material={boardMat}><boxGeometry args={[3.0, 1.2, 0.08]} /></mesh>
          <LogoDecal position={[-1.0, 2.45, 0.05]} width={0.9} backing={false} />
          <SignPlane text={`ADANI TOTAL GAS — ${def.id}`} width={2.6} position={[0.2, 2.45, 0.05]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 1 }} />
          <SignPlane text="HIGH PRESSURE GAS PIPELINE" width={2.6} position={[0, 2.15, 0.05]} options={{ fg: '#8ad0ff', fontWeight: 700 }} />
          <SignPlane text="NO UNAUTHORISED ENTRY · EMERGENCY 1906" width={2.8} position={[0, 1.9, 0.05]} options={{ fg: '#f2d21e', fontWeight: 700 }} />
        </group>

        {/* two marker posts flanking */}
        {([-4.6, 4.6] as const).map((x, i) => (
          <group key={i} position={[x, 0, 2]}>
            <mesh position={[0, 0.6, 0]} castShadow material={hazardMat}><boxGeometry args={[0.1, 1.2, 0.1]} /></mesh>
            <mesh position={[0, 1.3, 0.06]} rotation={[-0.35, 0, 0]} material={hazardMat}><boxGeometry args={[0.45, 0.35, 0.03]} /></mesh>
            <SignPlane text="GAS" width={0.3} position={[0, 1.32, 0.09]} rotation={[-0.35, 0, 0]} options={{ fg: '#16202b', fontWeight: 800 }} />
          </group>
        ))}
      </group>
    </group>
  );
}
