import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ResidentialFlat } from './ResidentialFlat';
import { CommercialKitchen } from './CommercialKitchen';
import { IndustrialSkid } from './IndustrialSkid';
import { PipeRun } from '@/components3d/primitives/Pipe';
import { SignPlane } from '@/components3d/branding/Branding';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { useSimStore } from '@/state/useSimStore';
import { useViewStore } from '@/state/useViewStore';
import { concrete } from '@/materials/materials';
import { useValveStore, isolatedLines } from '@/state/useValveStore';
import type { ServiceLine } from '@/config/lineValves';
import { PngLastMile } from './PngLastMile';

/**
 * Section 10 — PNG consumer demonstration row (residential / commercial /
 * industrial) placed on open ground north of the city. Each has a service line
 * whose gas-particle density visibly reflects its demand tier (residential
 * sparse, commercial moderate, industrial heavy). A ConsumerRunner advances the
 * live demand from the sim clock. Additive; visible in PNG / BOTH focus.
 */
const LINE_KEYS: ServiceLine[] = ['residential', 'commercial', 'industrial'];
const LINES = [
  { from: [-58, 110] as [number, number], to: [-58, 124.5] as [number, number], per: 3, speed: 0.10, size: 0.10, color: '#8f7fe0', radius: 0.09 },
  { from: [-14, 110] as [number, number], to: [-14, 127] as [number, number], per: 10, speed: 0.16, size: 0.13, color: '#4db8ff', radius: 0.13 },
  { from: [34, 110] as [number, number], to: [34, 129] as [number, number], per: 24, speed: 0.24, size: 0.17, color: '#5ad0c0', radius: 0.2 },
];

function ServiceFlow() {
  const mode = useViewStore((s) => s.mode);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const items = useMemo(() => {
    const arr: { x0: number; z0: number; x1: number; z1: number; speed: number; size: number; t: number; col: THREE.Color; line: ServiceLine }[] = [];
    for (const [li, l] of LINES.entries()) {
      const col = new THREE.Color(l.color).multiplyScalar(1.6);
      for (let i = 0; i < l.per; i++) arr.push({ x0: l.from[0], z0: l.from[1], x1: l.to[0], z1: l.to[1], speed: l.speed, size: l.size, t: i / l.per, col, line: LINE_KEYS[li] });
    }
    return arr;
  }, []);
  const total = items.length;

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const sim = useSimStore.getState();
    const step = sim.playing ? dt * sim.speed : 0;
    const vis = mode !== 'CNG';
    const shut = isolatedLines(useValveStore.getState().rt);
    for (let i = 0; i < total; i++) {
      const it = items[i];
      it.t = (it.t + step * it.speed) % 1;
      dummy.position.set(it.x0 + (it.x1 - it.x0) * it.t, 0.2 + Math.sin(it.t * Math.PI) * 0.15, it.z0 + (it.z1 - it.z0) * it.t);
      dummy.scale.setScalar(vis && !shut.has(it.line) ? it.size / 0.13 : 0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, it.col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, total]} frustumCulled={false}>
      <sphereGeometry args={[0.13, 8, 8]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.95} />
    </instancedMesh>
  );
}

function ConsumerRunner() {
  useFrame((_, dt) => {
    usePngConsumerStore.getState().tick(Math.min(dt, 0.05));
  });
  return null;
}

export function PngConsumers() {
  return (
    <group>
      {/* service-line pads/pipes from the city edge to each consumer */}
      {LINES.map((l, i) => (
        <PipeRun
          key={i}
          points={[[l.from[0], 0.16, l.from[1]], [l.to[0], 0.16, l.to[1]]]}
          radius={l.radius}
          color={i === 2 ? '#9aa1a8' : '#f59e0b'}
          metalness={i === 2 ? 0.8 : 0.5}
          seed={460 + i}
          radialSegments={12}
        />
      ))}

      {/* ground strip under the demonstration row */}
      <mesh position={[-12, 0.03, 132]} receiveShadow material={concrete('#a9a59c', 461)}>
        <boxGeometry args={[130, 0.06, 22]} />
      </mesh>
      <SignPlane text="PNG CONSUMER CONNECTIONS — LAST MILE" width={16} position={[-12, 5.5, 143]} options={{ fg: '#fff', bg: '#0B74B0', fontWeight: 800, letterSpacing: 2 }} doubleSide />

      <ResidentialFlat position={[-58, 0, 128]} rotation={0} />
      <CommercialKitchen position={[-14, 0, 130]} rotation={0} />
      <IndustrialSkid position={[34, 0, 132]} rotation={0} />

      <PngLastMile />
      <ServiceFlow />
      <ConsumerRunner />
    </group>
  );
}
