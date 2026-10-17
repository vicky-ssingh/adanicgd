import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { steel, paintedMetal } from '@/materials/materials';
import { useGasStore, gasLevel } from '@/state/useGasStore';
import { closeAllPanels } from '@/state/panels';
import type { FacilityId } from '@/config/safetyLayout';

const bodyMat = new THREE.MeshStandardMaterial({ color: '#c2c7cc', roughness: 0.4, metalness: 0.85 });
const jbMat = new THREE.MeshStandardMaterial({ color: '#d4622a', roughness: 0.5, metalness: 0.3 });
const meshCapMat = new THREE.MeshStandardMaterial({ color: '#6b7078', roughness: 0.8, metalness: 0.6 });

/**
 * Section 08 §B.1 — gas detector head (sinter cap, junction box, weather hood,
 * status LED) or flame detector (lens + angled mount). The LED is green (normal),
 * amber (20% LEL) or red (40% LEL) while a leak at this facility is detected.
 * Clickable for the detector info panel.
 */
export function GasDetector({ id, facilityId, position, flame = false }: { id: string; facilityId: FacilityId; position: [number, number, number]; flame?: boolean }) {
  const led = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 1 }), []);
  const hoodMat = useMemo(() => paintedMetal('#8f959b', 1120), []);
  useFrame((state) => {
    const g = useGasStore.getState();
    const here = g.active && g.facilityId === facilityId;
    const lvl = here ? gasLevel(g.reading) : 'normal';
    const flash = Math.floor(state.clock.elapsedTime * 4) % 2 ? 1.6 : 0.2;
    if (lvl === 'high') { led.emissive.set('#ff3b3b'); led.emissiveIntensity = flash; }
    else if (lvl === 'low') { led.emissive.set('#ffb020'); led.emissiveIntensity = flash; }
    else { led.emissive.set('#39d98a'); led.emissiveIntensity = 1; }
  });
  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); useGasStore.getState().openPanel(id); };
  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };

  return (
    <group position={position} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {/* L-bracket to a short post */}
      <mesh position={[0, -0.25, 0]} material={steel({ color: '#8a9099', seed: 1121 })}><cylinderGeometry args={[0.03, 0.03, 0.5, 6]} /></mesh>
      <mesh position={[0.08, 0, 0]} material={steel({ color: '#8a9099', seed: 1122 })}><boxGeometry args={[0.16, 0.03, 0.03]} /></mesh>
      {flame ? (
        <group rotation={[0.5, 0, 0]}>
          <mesh material={bodyMat}><cylinderGeometry args={[0.06, 0.06, 0.16, 12]} /></mesh>
          <mesh position={[0, 0.09, 0]} material={new THREE.MeshStandardMaterial({ color: '#20303a', roughness: 0.1, metalness: 0.4 })}><cylinderGeometry args={[0.05, 0.05, 0.02, 12]} /></mesh>
          <mesh position={[0, -0.11, 0]} material={led}><cylinderGeometry args={[0.015, 0.015, 0.01, 8]} /></mesh>
        </group>
      ) : (
        <>
          <mesh material={bodyMat}><cylinderGeometry args={[0.045, 0.045, 0.16, 12]} /></mesh>
          {/* sinter mesh cap (gas entry, underside) */}
          <mesh position={[0, -0.1, 0]} material={meshCapMat}><cylinderGeometry args={[0.05, 0.05, 0.03, 12]} /></mesh>
          {/* junction box + weather hood + LED */}
          <mesh position={[0, 0.14, 0]} material={jbMat}><boxGeometry args={[0.12, 0.1, 0.08]} /></mesh>
          <mesh position={[0, 0.22, 0.01]} rotation={[0.2, 0, 0]} material={hoodMat}><boxGeometry args={[0.16, 0.02, 0.12]} /></mesh>
          <mesh position={[0.05, 0.14, 0.05]} material={led}><cylinderGeometry args={[0.014, 0.014, 0.01, 8]} /></mesh>
        </>
      )}
    </group>
  );
}
