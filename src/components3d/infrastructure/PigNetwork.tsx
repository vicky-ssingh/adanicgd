import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PigTrap } from './PigTrap';
import { usePigStore, pigView } from '@/state/usePigStore';
import { useSimStore } from '@/state/useSimStore';

/** Advances the pigging run, scaled by the sim speed while playing. */
function PigRunner() {
  useFrame((_, delta) => {
    const sim = useSimStore.getState();
    if (!sim.playing) return;
    usePigStore.getState().tick(Math.min(delta, 0.05) * sim.speed);
  });
  return null;
}

/** Glowing marker travelling the pipeline route during a pigging run. */
function PigMarker() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const v = pigView();
    if (!ref.current) return;
    ref.current.visible = v.traveling;
    if (v.traveling) ref.current.position.set(v.pigPos.x, v.pigPos.y, v.pigPos.z);
  });
  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.45, 12, 12]} />
      <meshBasicMaterial color="#ffd27a" toneMapped={false} transparent opacity={0.9} />
    </mesh>
  );
}

/**
 * Section 07 Part B placement — pig launcher (PL-01) at the City Gate inlet and
 * receiver (PR-01) at the far end of the primary pipeline, with the travelling
 * pig marker. Additive: it taps nothing in the existing network geometry.
 */
export function PigNetwork() {
  return (
    <group>
      <PigRunner />
      <group position={[110, 0, -86]} rotation={[0, Math.PI, 0]}>
        <PigTrap id="PL-01" label="PIG LAUNCHER — PL-01" mode="launcher" />
      </group>
      <group position={[-60, 0, 28]} rotation={[0, -0.6, 0]}>
        <PigTrap id="PR-01" label="PIG RECEIVER — PR-01" mode="receiver" />
      </group>
      <PigMarker />
    </group>
  );
}
