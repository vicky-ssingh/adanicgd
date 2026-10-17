import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Flange } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal, glass, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane } from '@/components3d/branding/Branding';
import { useEsdStore } from '@/state/useEsdStore';
import { useGasStore } from '@/state/useGasStore';
import { closeAllPanels } from '@/state/panels';
import type { FacilityId } from '@/config/safetyLayout';

const postMat = new THREE.MeshStandardMaterial({ color: '#9aa1a8', roughness: 0.5, metalness: 0.7 });
const yellowMat = new THREE.MeshStandardMaterial({ color: '#f2d21e', roughness: 0.5, metalness: 0.2 });
const redMat = new THREE.MeshStandardMaterial({ color: '#c01a1a', roughness: 0.5, metalness: 0.2 });
const reflMat = new THREE.MeshStandardMaterial({ color: '#eef2f6', emissive: new THREE.Color('#cfe0ee'), emissiveIntensity: 0.25, roughness: 0.4 });

/** ESD push-button station — clickable, LED green (armed) / flashing red (tripped). */
export function EsdButton({ facilityId, position, rotation = 0 }: { facilityId: FacilityId; position: [number, number, number]; rotation?: number }) {
  const led = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 1 }), []);
  useFrame((state) => {
    const tripped = useEsdStore.getState().fac[facilityId].tripped;
    if (tripped) { led.emissive.set('#ff3b3b'); led.emissiveIntensity = 0.4 + (Math.floor(state.clock.elapsedTime * 4) % 2) * 1.4; }
    else { led.emissive.set('#39d98a'); led.emissiveIntensity = 1; }
  });
  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); useEsdStore.getState().openPanel(facilityId); };
  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };
  return (
    <group position={position} rotation={[0, rotation, 0]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <mesh position={[0, 0.06, 0]} material={postMat}><boxGeometry args={[0.25, 0.12, 0.25]} /></mesh>
      <mesh position={[0, 0.72, 0]} castShadow material={postMat}><cylinderGeometry args={[0.04, 0.04, 1.25, 8]} /></mesh>
      <mesh position={[0, 1.0, 0]} material={reflMat}><cylinderGeometry args={[0.045, 0.045, 0.1, 8]} /></mesh>
      {/* yellow enclosure (tilted forward) */}
      <group position={[0, 1.28, 0.06]} rotation={[-0.2, 0, 0]}>
        <mesh castShadow material={yellowMat}><boxGeometry args={[0.25, 0.3, 0.15]} /></mesh>
        {/* red mushroom button + collar */}
        <mesh position={[0, 0.03, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={postMat}><cylinderGeometry args={[0.06, 0.06, 0.02, 12]} /></mesh>
        <mesh position={[0, 0.03, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={redMat}><cylinderGeometry args={[0.045, 0.045, 0.05, 14]} /></mesh>
        {/* flip guard (transparent shield) */}
        <mesh position={[0, 0.11, 0.11]} rotation={[-0.5, 0, 0]} material={glass('#bcd4e0', 0.5)}><boxGeometry args={[0.18, 0.12, 0.01]} /></mesh>
        {/* status LED */}
        <mesh position={[0.09, -0.02, 0.09]} material={led}><cylinderGeometry args={[0.015, 0.015, 0.01, 10]} /></mesh>
        {/* label */}
        <SignPlane text="EMERGENCY SHUTDOWN" width={0.24} position={[0, -0.1, 0.08]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800 }} />
      </group>
      <SignPlane text="PRESS IN EMERGENCY — STOPS ALL GAS FLOW" width={0.7} position={[0, 0.55, 0.13]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 700, radius: 3, paddingX: 6 }} />
    </group>
  );
}

/** Red strobe beacon — flashes during any facility alarm (ESD tripped or gas alarm). */
export function Strobe({ facilityId, position }: { facilityId: FacilityId; position: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5a1015', emissive: new THREE.Color('#ff2020'), emissiveIntensity: 0.1, roughness: 0.4 }), []);
  useFrame((state) => {
    const tripped = useEsdStore.getState().fac[facilityId].tripped;
    const g = useGasStore.getState();
    const gasAlarm = g.active && g.facilityId === facilityId && g.reading >= 20;
    const alarm = tripped || gasAlarm;
    mat.emissiveIntensity = alarm ? (Math.floor(state.clock.elapsedTime * 5) % 2 ? 2.4 : 0.15) : 0.08;
  });
  return (
    <group position={position}>
      <mesh position={[0, -0.3, 0]} material={postMat}><cylinderGeometry args={[0.04, 0.04, 0.6, 8]} /></mesh>
      <mesh material={mat}><cylinderGeometry args={[0.12, 0.15, 0.18, 12]} /></mesh>
      <mesh position={[0, 0.11, 0]} material={postMat}><cylinderGeometry args={[0.04, 0.12, 0.05, 12]} /></mesh>
    </group>
  );
}

/** ESD valve — spring-return actuator with a position flag that rotates to CLOSED on trip. */
export function EsdValve({ facilityId, position, rotation = 0 }: { facilityId: FacilityId; position: [number, number, number]; rotation?: number }) {
  const valveMat = useMemo(() => steel({ color: '#4a5a6a', roughness: 0.6, metalness: 0.8, seed: 1100 }), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 1101 }), []);
  const springMat = useMemo(() => paintedMetal('#2f6f8f', 1102), []);
  const flag = useRef<THREE.Group>(null);
  const flagMat = useMemo(() => emissive('#39d98a', 1.0), []);
  useFrame(() => {
    const ph = useEsdStore.getState().fac[facilityId].phase;
    const closed = Math.min(1, ph * 2); // closes in the first half of the trip
    if (flag.current) flag.current.rotation.y = closed * (Math.PI / 2);
    flagMat.emissive.set(closed > 0.5 ? '#ff3b3b' : '#39d98a');
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]} material={paintedMetal('#b0ada3', 1103)}><boxGeometry args={[1.2, 0.4, 0.8]} /></mesh>
      {/* pipe risers */}
      <mesh position={[-0.7, 0.6, 0]} material={steelMat}><cylinderGeometry args={[0.1, 0.1, 0.8, 12]} /></mesh>
      <mesh position={[0.7, 0.6, 0]} material={steelMat}><cylinderGeometry args={[0.1, 0.1, 0.8, 12]} /></mesh>
      {/* ball valve body + flanges */}
      <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={valveMat}><cylinderGeometry args={[0.22, 0.22, 0.5, 20]} /></mesh>
      {([-0.28, 0.28] as const).map((x, i) => (
        <group key={i} position={[x, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}><Flange radius={0.22} thickness={0.04} bolts={8} seed={1104 + i} /></group>
      ))}
      {/* spring-return pneumatic actuator + solenoid + air tube */}
      <mesh position={[0, 1.45, 0]} castShadow material={springMat}><cylinderGeometry args={[0.15, 0.15, 0.45, 16]} /></mesh>
      <mesh position={[0, 1.75, 0]} material={springMat}><cylinderGeometry args={[0.1, 0.12, 0.16, 12]} /></mesh>
      <mesh position={[0.18, 1.5, 0]} material={steelMat}><boxGeometry args={[0.1, 0.14, 0.1]} /></mesh>
      {/* position flag */}
      <group ref={flag} position={[0, 1.9, 0]}>
        <mesh position={[0.12, 0, 0]} material={flagMat}><boxGeometry args={[0.24, 0.06, 0.1]} /></mesh>
      </group>
      <SignPlane text="ESD VALVE — FAIL CLOSED" width={1.1} position={[0, 0.55, 0.42]} options={{ fg: '#ffffff', bg: BRAND.alert, fontWeight: 800, radius: 3, paddingX: 8 }} doubleSide />
    </group>
  );
}
