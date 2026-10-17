import { useMemo } from 'react';
import * as THREE from 'three';
import { steel, paintedMetal, concrete, emissive } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';
import { useCpStore } from '@/state/useCpStore';
import { closeAllPanels } from '@/state/panels';

/**
 * Section 08 Part D — cathodic-protection visible elements. Transformer-Rectifier
 * (TR) unit: a grey cabinet on posts with cooling fins, a meter window, a rain
 * hood, a louvre, earthing + conduit, and an anode-bed marker. CP test post:
 * ORANGE (deliberately distinct from Section-07's yellow route markers) with a
 * terminal box. Both clickable for their info panels.
 */
const orange = new THREE.MeshStandardMaterial({ color: '#e87722', roughness: 0.5, metalness: 0.2 });

export function TrUnit({ id, label, pos, rotation = 0, protectedKm, chainageKm }: { id: string; label: string; pos: [number, number, number]; rotation?: number; protectedKm: number; chainageKm: number }) {
  const cabMat = useMemo(() => paintedMetal('#b8bcc0', 1160), []);
  const finMat = useMemo(() => steel({ color: '#9aa1a8', seed: 1161 }), []);
  const postMat = useMemo(() => steel({ color: '#8a9099', seed: 1162 }), []);
  const winMat = useMemo(() => emissive('#0d1b1a', 0.5), []);
  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); useCpStore.getState().openInfo({ kind: 'tr', id, label, outputV: '18.5 V DC', outputA: '4.2 A', protectedKm, chainageKm }); };
  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };
  return (
    <group position={pos} rotation={[0, rotation, 0]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {([-0.3, 0.3] as const).map((x, i) => (
        <mesh key={i} position={[x, 1.0, 0]} castShadow material={postMat}><boxGeometry args={[0.08, 2.0, 0.08]} /></mesh>
      ))}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow material={cabMat}><boxGeometry args={[0.65, 0.85, 0.4]} /></mesh>
      {/* cooling fins both sides */}
      {([-0.34, 0.34] as const).map((x) => Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`${x}-${i}`} position={[x, 1.3 + i * 0.12, 0]} material={finMat}><boxGeometry args={[0.04, 0.02, 0.34]} /></mesh>
      )))}
      {/* meter window (2 meters) */}
      <mesh position={[0, 1.62, 0.21]} material={winMat}><boxGeometry args={[0.34, 0.16, 0.02]} /></mesh>
      <SignPlane text="V   A" width={0.3} position={[0, 1.62, 0.222]} options={{ fg: '#8ef3d6', fontWeight: 800, letterSpacing: 4 }} />
      {/* louvre + rain hood + earthing */}
      <mesh position={[0, 1.22, 0.205]} material={steel({ color: '#3a4048', seed: 1163 })}><boxGeometry args={[0.4, 0.1, 0.01]} /></mesh>
      <mesh position={[0, 1.97, 0.03]} rotation={[-0.3, 0, 0]} material={cabMat}><boxGeometry args={[0.72, 0.04, 0.2]} /></mesh>
      <mesh position={[0.3, 0.6, -0.1]} material={postMat}><cylinderGeometry args={[0.02, 0.02, 1.2, 6]} /></mesh>
      <SignPlane text="CATHODIC PROTECTION — TR UNIT" width={0.62} position={[0, 1.05, 0.205]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 700 }} />
      <SignPlane text="⚡ DANGER: ELECTRICAL — DO NOT OPEN" width={0.62} position={[0, 0.95, 0.205]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 700 }} />
      {/* anode bed marker */}
      <group position={[1.6, 0, 0.4]}>
        <mesh position={[0, 0.05, 0]} material={concrete('#c2beb4', 1164)}><boxGeometry args={[0.7, 0.1, 0.5]} /></mesh>
        <SignPlane text="CP ANODE BED — DO NOT EXCAVATE" width={0.66} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#16202b', bg: '#e6b422', fontWeight: 700 }} />
      </group>
    </group>
  );
}

export function CpTestPost({ id, pos, chainageKm }: { id: string; pos: [number, number, number]; chainageKm: number }) {
  const baseMat = useMemo(() => concrete('#b9b5ac', 1165), []);
  const boxMat = useMemo(() => paintedMetal('#c9662a', 1166), []);
  const reflMat = useMemo(() => emissive('#cfe0ee', 0.25), []);
  const potential = chainageKm > 5.2 && chainageKm < 5.9 ? '-0.88 V' : '-0.98 V';
  const marginal = potential === '-0.88 V';
  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    closeAllPanels();
    useCpStore.getState().openInfo({ kind: 'tp', id, chainageKm, potential, assessment: marginal ? '⚠ MARGINAL' : '✓ PROTECTED' });
  };
  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };
  return (
    <group position={pos} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <mesh position={[0, 0.06, 0]} material={baseMat}><boxGeometry args={[0.25, 0.12, 0.25]} /></mesh>
      <mesh position={[0, 0.55, 0]} castShadow material={orange}><boxGeometry args={[0.08, 1.0, 0.08]} /></mesh>
      <mesh position={[0, 0.9, 0.02]} material={reflMat}><boxGeometry args={[0.09, 0.08, 0.09]} /></mesh>
      <mesh position={[0, 1.1, 0]} material={boxMat}><boxGeometry args={[0.15, 0.12, 0.1]} /></mesh>
      <SignPlane text={`CP TEST — ${id}`} width={0.3} position={[0, 1.1, 0.06]} options={{ fg: '#ffffff', bg: '#c9662a', fontWeight: 700 }} />
    </group>
  );
}
