import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { PropInstance } from '@/config/cityLayout';

const CAR_COLORS = ['#b7c0c9', '#2a3442', '#7f1d2e', '#26506e', '#e6e8ea', '#2f3a31', '#c9a227', '#3a5a40'];
type CarType = 'sedan' | 'suv' | 'hatch';

const SPEC: Record<CarType, {
  len: number; w: number; bodyH: number; bodyY: number;
  cabLen: number; cabH: number; cabX: number; cabY: number;
  wheelR: number; wheelX: number;
}> = {
  sedan: { len: 4.2, w: 1.9, bodyH: 0.72, bodyY: 0.62, cabLen: 2.15, cabH: 0.66, cabX: -0.1, cabY: 1.24, wheelR: 0.36, wheelX: 1.28 },
  suv: { len: 4.35, w: 2.0, bodyH: 0.95, bodyY: 0.78, cabLen: 2.7, cabH: 0.82, cabX: -0.05, cabY: 1.55, wheelR: 0.42, wheelX: 1.34 },
  hatch: { len: 3.55, w: 1.82, bodyH: 0.7, bodyY: 0.58, cabLen: 2.0, cabH: 0.66, cabX: -0.32, cabY: 1.18, wheelR: 0.33, wheelX: 1.12 },
};

// Shared (non-colour) materials + geometries — created once.
const glassMat = new THREE.MeshStandardMaterial({ color: '#141c26', roughness: 0.08, metalness: 0.2, envMapIntensity: 1.5 });
const tireMat = new THREE.MeshStandardMaterial({ color: '#14171b', roughness: 0.85, metalness: 0.05 });
const rimMat = new THREE.MeshStandardMaterial({ color: '#c8ccd0', roughness: 0.35, metalness: 0.85 });
const headMat = new THREE.MeshStandardMaterial({ color: '#fff8e6', emissive: new THREE.Color('#fff2cf'), emissiveIntensity: 0.6, roughness: 0.3 });
const tailMat = new THREE.MeshStandardMaterial({ color: '#c0182a', emissive: new THREE.Color('#c0182a'), emissiveIntensity: 0.5, roughness: 0.3 });
const bumperMat = new THREE.MeshStandardMaterial({ color: '#2a2f35', roughness: 0.6, metalness: 0.4 });

// Per-type wheel geometries with the axle baked along Z (car width).
function mkWheel(r: number) {
  const tire = new THREE.CylinderGeometry(r, r, 0.3, 18);
  tire.rotateX(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.34, 12);
  rim.rotateX(Math.PI / 2);
  return { tire, rim };
}
const WHEEL_GEOM: Record<CarType, { tire: THREE.BufferGeometry; rim: THREE.BufferGeometry }> = {
  sedan: mkWheel(SPEC.sedan.wheelR),
  suv: mkWheel(SPEC.suv.wheelR),
  hatch: mkWheel(SPEC.hatch.wheelR),
};

const bodyMatCache = new Map<string, THREE.MeshStandardMaterial>();
function bodyMaterial(color: string) {
  let m = bodyMatCache.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.6, envMapIntensity: 1.2 });
    bodyMatCache.set(color, m);
  }
  return m;
}

/**
 * A detailed low-poly car (spec §2.7): body + glazed cabin with side windows,
 * wheels with alloy rims, head/tail-lights, and bumpers. Three body types
 * (sedan / SUV / hatch) for variety. Reused for CNG vehicles at stations.
 */
export function Car({
  position = [0, 0, 0],
  rotation = 0,
  color = CAR_COLORS[0],
  scale = 1,
  type = 'sedan',
}: {
  position?: [number, number, number];
  rotation?: number;
  color?: string;
  scale?: number;
  type?: CarType;
}) {
  const s = SPEC[type];
  const body = useMemo(() => bodyMaterial(color), [color]);
  const g = WHEEL_GEOM[type];
  const wheelZ = s.w / 2 - 0.06;

  const wheel = (x: number, z: number) => (
    <group position={[x, s.wheelR, z]}>
      <mesh castShadow geometry={g.tire} material={tireMat} />
      <mesh geometry={g.rim} material={rimMat} />
    </group>
  );

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* main body */}
      <RoundedBox args={[s.len, s.bodyH, s.w]} radius={0.22} smoothness={4} position={[0, s.bodyY, 0]} castShadow receiveShadow material={body} />
      {/* cabin */}
      <RoundedBox args={[s.cabLen, s.cabH, s.w - 0.12]} radius={0.24} smoothness={4} position={[s.cabX, s.cabY, 0]} castShadow material={body} />
      {/* greenhouse glass (windshield + rear) */}
      <RoundedBox args={[s.cabLen - 0.18, s.cabH - 0.12, s.w - 0.04]} radius={0.18} smoothness={3} position={[s.cabX, s.cabY + 0.03, 0]} material={glassMat} />
      {/* side windows */}
      {[s.w / 2 - 0.02, -s.w / 2 + 0.02].map((z, i) => (
        <mesh key={i} position={[s.cabX, s.cabY + 0.02, z]} material={glassMat}>
          <boxGeometry args={[s.cabLen - 0.3, s.cabH - 0.22, 0.02]} />
        </mesh>
      ))}
      {/* wheels */}
      {wheel(s.wheelX, wheelZ)}
      {wheel(s.wheelX, -wheelZ)}
      {wheel(-s.wheelX, wheelZ)}
      {wheel(-s.wheelX, -wheelZ)}
      {/* headlights */}
      {[wheelZ - 0.2, -wheelZ + 0.2].map((z, i) => (
        <mesh key={i} position={[s.len / 2 - 0.02, s.bodyY, z]} material={headMat}>
          <boxGeometry args={[0.06, 0.16, 0.28]} />
        </mesh>
      ))}
      {/* taillights */}
      {[wheelZ - 0.18, -wheelZ + 0.18].map((z, i) => (
        <mesh key={i} position={[-s.len / 2 + 0.02, s.bodyY + 0.05, z]} material={tailMat}>
          <boxGeometry args={[0.05, 0.14, 0.34]} />
        </mesh>
      ))}
      {/* bumpers */}
      <mesh position={[s.len / 2 - 0.03, s.bodyY - 0.24, 0]} material={bumperMat}>
        <boxGeometry args={[0.12, 0.2, s.w - 0.1]} />
      </mesh>
      <mesh position={[-s.len / 2 + 0.03, s.bodyY - 0.24, 0]} material={bumperMat}>
        <boxGeometry args={[0.12, 0.2, s.w - 0.1]} />
      </mesh>
    </group>
  );
}

const TYPES: CarType[] = ['sedan', 'suv', 'hatch', 'sedan', 'suv'];

export function Vehicles({ items }: { items: PropInstance[] }) {
  return (
    <group>
      {items.map((it, i) => (
        <Car
          key={i}
          position={[it.position[0], 0, it.position[2]]}
          rotation={it.rotation}
          color={CAR_COLORS[it.variant % CAR_COLORS.length]}
          type={TYPES[it.variant % TYPES.length]}
          scale={it.scale}
        />
      ))}
    </group>
  );
}
