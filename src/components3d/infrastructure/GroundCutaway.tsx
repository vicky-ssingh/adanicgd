import { useMemo } from 'react';
import * as THREE from 'three';
import { SignPlane } from '@/components3d/branding/Branding';
import { useTourFxStore } from '@/state/useTourFxStore';

/**
 * Section 17 §B.3 — a ground "SECTION VIEW" cutaway over a buried pipeline. When the
 * tour's buried-pipeline stop is active, the ground goes semi-transparent along the
 * route and a trench profile is revealed: topsoil / backfill / bedding-sand strata
 * on the cut face, the pipe at full opacity, and yellow warning tape above it. A
 * hatch on the cut face reads as a section drawing. Reverts on stop exit.
 */
const CENTRE: [number, number, number] = [14, 0, -40]; // along the buried e-secondary-1 dip
const LEN = 12, WIDE = 3.2, DEPTH = 2.0;

export function GroundCutaway() {
  const on = useTourFxStore((s) => s.cutaway);
  const ground = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b7b09c', transparent: true, opacity: 0.25, roughness: 1, depthWrite: false }), []);
  const topsoil = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b5a3c', roughness: 1 }), []);
  const backfill = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a7a58', roughness: 1 }), []);
  const sand = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8c88a', roughness: 1 }), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9ba3ab', metalness: 0.75, roughness: 0.42 }), []);
  const tape = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5c400', roughness: 0.6, emissive: new THREE.Color('#f5c400'), emissiveIntensity: 0.1 }), []);
  const hatch = useMemo(() => new THREE.MeshBasicMaterial({ color: '#2a2018' }), []);

  if (!on) return null;
  const rot = -0.6; // align roughly with the route direction
  return (
    <group position={CENTRE} rotation={[0, rot, 0]}>
      {/* semi-transparent ground over the trench */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ground}><planeGeometry args={[LEN + 2, WIDE + 3]} /></mesh>
      {/* trench soil strata on the two long cut faces */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[0, 0, s * WIDE / 2]}>
          <mesh position={[0, -0.25, 0]} material={topsoil}><boxGeometry args={[LEN, 0.5, 0.04]} /></mesh>
          <mesh position={[0, -0.85, 0]} material={backfill}><boxGeometry args={[LEN, 0.7, 0.04]} /></mesh>
          <mesh position={[0, -1.6, 0]} material={sand}><boxGeometry args={[LEN, 0.8, 0.04]} /></mesh>
          {/* hatch lines on the cut face */}
          {[-4, -2, 0, 2, 4].map((x, i) => (
            <mesh key={i} position={[x, -1.0, s * 0.03]} rotation={[0, 0, 0.6]} material={hatch}><boxGeometry args={[0.02, 1.9, 0.005]} /></mesh>
          ))}
        </group>
      ))}
      {/* trench floor (bedding sand) */}
      <mesh position={[0, -DEPTH + 0.15, 0]} material={sand}><boxGeometry args={[LEN, 0.3, WIDE]} /></mesh>
      {/* the pipe at full opacity on the bedding */}
      <mesh position={[0, -1.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={steel}><cylinderGeometry args={[0.32, 0.32, LEN, 20]} /></mesh>
      {/* yellow warning tape above the pipe */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]} material={tape}><planeGeometry args={[LEN, 0.18]} /></mesh>
      {/* SECTION VIEW label on a small stand */}
      <group position={[LEN / 2 + 0.4, 0, WIDE / 2 + 0.6]}>
        <mesh position={[0, 0.6, 0]} material={steel}><cylinderGeometry args={[0.03, 0.03, 1.2, 8]} /></mesh>
        <SignPlane text="BURIED PIPELINE — SECTION VIEW" width={2.4} position={[0, 1.25, 0]} options={{ fg: '#fff', bg: '#0B74B0', fontWeight: 800, letterSpacing: 1 }} doubleSide />
      </group>
    </group>
  );
}
