import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Pad, Handrail } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Valve, Gauge } from '@/components3d/primitives/Fittings';
import { concrete, steel, paintedMetal } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { usePigStore, pigView } from '@/state/usePigStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useSvStore } from '@/state/useSvStore';
import { useMarkerStore } from '@/state/useMarkerStore';
import { useOdorStore } from '@/state/useOdorStore';

/**
 * Section 07 Part B — pig launcher / receiver barrel with an eccentric taper down
 * to line size and a quick-opening closure (dished door, 8-segment locking ring,
 * hinge arm, davit, operating handle, pressure indicator). Kicker line, isolation
 * valves, vent, drain + sump, gauge, a pig signaller with a flip flag, a handling
 * platform with handrails, and a pig storage rack. The closure animates during a
 * pigging run and the signaller flag flips as the pig passes. Local origin at
 * plinth centre; barrel along X with the closure (large end) at −X.
 */
export function PigTrap({ id, label, mode }: { id: 'PL-01' | 'PR-01'; label: string; mode: 'launcher' | 'receiver' }) {
  const plinthMat = useMemo(() => concrete('#b0ada3', 990), []);
  const barrelMat = useMemo(() => steel({ color: '#3e5266', roughness: 0.62, metalness: 0.8, seed: 991 }), []);
  const doorMat = useMemo(() => steel({ color: '#4a5f74', roughness: 0.5, metalness: 0.85, seed: 992 }), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 993 }), []);
  const ringMat = useMemo(() => paintedMetal('#c9a227', 994), []);
  const flagMat = useMemo(() => paintedMetal(BRAND.alert, 995), []);
  const gratingMat = useMemo(() => steel({ color: '#5b6068', roughness: 0.6, metalness: 0.8, seed: 996 }), []);

  const door = useRef<THREE.Group>(null);
  const flag = useRef<THREE.Group>(null);

  useFrame(() => {
    const v = pigView();
    const frac = mode === 'launcher' ? v.launcherDoor : v.receiverDoor;
    if (door.current) door.current.rotation.y = (1 - frac) * 1.9; // 1 closed → 0 open
    if (flag.current) flag.current.rotation.z = v.signallerFlipped ? -1.2 : 0;
  });

  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    useSelectionStore.getState().clear();
    useRouteStore.getState().clear();
    useSvStore.getState().closePanel();
    useMarkerStore.getState().close();
    useOdorStore.getState().close();
    usePigStore.getState().openPanel(id);
  };
  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };

  return (
    <group rotation={[0, mode === 'receiver' ? Math.PI : 0, 0]}>
      <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        <Pad size={[4.5, 1.5]} height={0.35} seed={997} />

        {/* saddle supports */}
        {([-1.2, 1.0] as const).map((x, i) => (
          <mesh key={i} position={[x, 0.7, 0]} material={plinthMat}><boxGeometry args={[0.4, 0.7, 0.9]} /></mesh>
        ))}

        {/* barrel + eccentric reducer to line size (+X) */}
        <mesh position={[-0.4, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={barrelMat}><cylinderGeometry args={[0.425, 0.425, 2.7, 24]} /></mesh>
        <mesh position={[1.15, 0.9, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow material={barrelMat}><cylinderGeometry args={[0.175, 0.425, 1.2, 24]} /></mesh>
        {/* line pipe onward (+X) */}
        <Pipe from={[1.75, 0.9, 0]} to={[2.6, 0.9, 0]} radius={0.16} color="#8a9199" seed={998} />

        {/* quick-opening closure at the large end (−X) */}
        <group position={[-1.75, 1.0, 0]}>
          {/* locking ring w/ 8 segments */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={ringMat}><torusGeometry args={[0.46, 0.05, 8, 8]} /></mesh>
          {Array.from({ length: 8 }).map((_, i) => { const a = (i / 8) * Math.PI * 2; return (
            <mesh key={i} position={[0, Math.cos(a) * 0.46, Math.sin(a) * 0.46]} material={ringMat}><boxGeometry args={[0.08, 0.08, 0.05]} /></mesh>
          ); })}
          {/* hinge arm (one side) + davit */}
          <mesh position={[0, 0.5, 0.46]} material={steelMat}><boxGeometry args={[0.1, 0.5, 0.1]} /></mesh>
          <mesh position={[0, 0.9, 0.3]} rotation={[0.5, 0, 0]} material={steelMat}><boxGeometry args={[0.08, 0.08, 0.8]} /></mesh>
          {/* dished door on a hinge (animates open) */}
          <group ref={door} position={[0, 0, 0.46]}>
            <mesh position={[-0.05, 0, -0.46]} material={doorMat}><cylinderGeometry args={[0.44, 0.44, 0.1, 24]} /></mesh>
            <mesh position={[-0.12, 0, -0.46]} material={doorMat}><sphereGeometry args={[0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            {/* operating handle + pressure indicator/bleed on the door face */}
            <mesh position={[-0.18, 0, -0.2]} rotation={[0, 0, Math.PI / 2]} material={steelMat}><cylinderGeometry args={[0.02, 0.02, 0.4, 8]} /></mesh>
            <group position={[-0.16, 0.2, -0.46]} rotation={[Math.PI / 2, 0, 0]} scale={0.5}><Gauge radius={0.14} seed={999} /></group>
          </group>
        </group>

        {/* kicker line (bypass loop into barrel top) + isolation valve */}
        <Pipe from={[2.6, 0.9, 0]} to={[2.6, 1.8, 0]} radius={0.06} color="#b0b6bd" seed={1000} />
        <Pipe from={[2.6, 1.8, 0]} to={[-0.4, 1.8, 0]} radius={0.06} color="#b0b6bd" seed={1001} />
        <Pipe from={[-0.4, 1.8, 0]} to={[-0.4, 1.4, 0]} radius={0.06} color="#b0b6bd" seed={1002} />
        <group position={[1.4, 1.8, 0]} scale={0.35}><Valve size={0.28} color={BRAND.primary} handwheel seed={1003} /></group>
        {/* main line valve + barrel isolation valve */}
        <group position={[2.2, 0.9, 0]} scale={0.4}><Valve size={0.3} color={BRAND.alert} handwheel seed={1004} /></group>
        <group position={[0.6, 1.0, 0]} scale={0.35}><Valve size={0.3} color={BRAND.primary} handwheel seed={1005} /></group>
        {/* vent valve + pipe (top) */}
        <mesh position={[-0.4, 1.5, 0.3]} material={steelMat}><cylinderGeometry args={[0.03, 0.03, 0.4, 8]} /></mesh>
        {/* drain valve + sump (bottom) */}
        <mesh position={[-0.4, 0.5, -0.3]} material={steelMat}><cylinderGeometry args={[0.03, 0.03, 0.3, 8]} /></mesh>
        <mesh position={[-0.4, 0.06, -0.5]} material={gratingMat}><boxGeometry args={[0.3, 0.05, 0.3]} /></mesh>
        {/* barrel pressure gauge */}
        <group position={[-0.4, 1.5, -0.1]} rotation={[Math.PI / 2, 0, 0]} scale={0.5}><Gauge radius={0.14} seed={1006} /></group>

        {/* pig signaller with a flip flag (on the main line just downstream) */}
        <group position={[2.6, 1.0, 0.3]}>
          <mesh material={steelMat}><boxGeometry args={[0.1, 0.2, 0.1]} /></mesh>
          <group ref={flag} position={[0, 0.15, 0]}>
            <mesh position={[0, 0.12, 0]} material={flagMat}><boxGeometry args={[0.02, 0.24, 0.12]} /></mesh>
          </group>
        </group>

        {/* handling platform + handrails beside the closure */}
        <group position={[-1.75, 0, 1.1]}>
          <mesh position={[0, 0.6, 0]} material={gratingMat}><boxGeometry args={[1.2, 0.06, 0.9]} /></mesh>
          {([-0.5, 0.5] as const).map((x, i) => (
            <mesh key={i} position={[x, 0.35, 0]} material={steelMat}><boxGeometry args={[0.06, 0.6, 0.06]} /></mesh>
          ))}
          <group position={[0, 0.6, 0]}><Handrail width={1.2} depth={0.9} height={1.0} seed={1007} /></group>
        </group>

        {/* pig storage rack (2 spare pigs — short cylinders w/ seal cups) */}
        <group position={[-2.4, 0, -1.0]}>
          <mesh position={[0, 0.5, 0]} material={steelMat}><boxGeometry args={[1.0, 0.06, 0.4]} /></mesh>
          {([-0.25, 0.25] as const).map((z, i) => (
            <group key={i} position={[0, 0.65, z]}>
              <mesh rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#c99', 1008 + i)}><cylinderGeometry args={[0.12, 0.12, 0.5, 14]} /></mesh>
              {([-0.25, 0.25] as const).map((x, k) => (
                <mesh key={k} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#5a6472', 1010 + k)}><cylinderGeometry args={[0.15, 0.15, 0.04, 14]} /></mesh>
              ))}
            </group>
          ))}
        </group>

        {/* signage */}
        <group position={[-0.4, 0, -0.9]}>
          <SignPlane text={label} width={1.6} position={[0, 1.9, 0]} rotation={[0, mode === 'receiver' ? Math.PI : 0, 0]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, radius: 4, paddingX: 14 }} doubleSide />
          <SignPlane text="DO NOT OPEN UNDER PRESSURE" width={1.8} position={[0, 1.6, 0]} rotation={[0, mode === 'receiver' ? Math.PI : 0, 0]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 8 }} doubleSide />
          <LogoDecal position={[0, 2.15, 0.01]} rotation={[0, mode === 'receiver' ? Math.PI : 0, 0]} width={0.8} backing={false} />
        </group>
      </group>
    </group>
  );
}
