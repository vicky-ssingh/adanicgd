import { useMemo } from 'react';
import * as THREE from 'three';
import { paintedMetal, steel, emissive } from '@/materials/materials';
import { useViewStore } from '@/state/useViewStore';

/**
 * Gas appliances (spec §2.21): a kitchen hob with burners (blue flame when the
 * sim is in day/active use) and a wall water heater. Used inside the residential
 * interior cutaway.
 */
export function GasHob({
  position = [0, 0, 0],
  rotation = 0,
}: {
  position?: [number, number, number];
  rotation?: number;
}) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const topMat = useMemo(() => steel({ color: '#20242a', roughness: 0.35, metalness: 0.7, seed: 180 }), []);
  const bodyMat = useMemo(() => paintedMetal('#d7dbe0', 181), []);
  const grateMat = useMemo(() => steel({ color: '#15181c', roughness: 0.6, metalness: 0.5, seed: 182 }), []);
  const flameMat = useMemo(() => emissive('#3aa0ff', 2.2), []);

  const burners: [number, number][] = [
    [-0.22, -0.16],
    [0.22, -0.16],
    [-0.22, 0.16],
    [0.22, 0.16],
  ];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* cabinet under hob */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[0.9, 0.9, 0.6]} />
      </mesh>
      {/* hob top */}
      <mesh position={[0, 0.92, 0]} castShadow material={topMat}>
        <boxGeometry args={[0.92, 0.06, 0.62]} />
      </mesh>
      {burners.map((b, i) => (
        <group key={i} position={[b[0], 0.96, b[1]]}>
          <mesh material={grateMat}>
            <torusGeometry args={[0.11, 0.012, 6, 16]} />
          </mesh>
          <mesh material={grateMat}>
            <cylinderGeometry args={[0.05, 0.06, 0.04, 12]} />
          </mesh>
          {/* blue flame ring (always lit — demonstrates active PNG use) */}
          <mesh position={[0, 0.02, 0]} material={flameMat}>
            <torusGeometry args={[0.06, 0.02, 6, 14]} />
          </mesh>
        </group>
      ))}
      {/* knobs */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.9, 0.32]} rotation={[Math.PI / 2, 0, 0]} material={grateMat}>
          <cylinderGeometry args={[0.04, 0.04, 0.05, 10]} />
        </mesh>
      ))}
      {/* oven window */}
      <mesh position={[0, 0.35, 0.31]}>
        <boxGeometry args={[0.6, 0.4, 0.02]} />
        <meshStandardMaterial color="#0a0f14" emissive={night ? '#331a00' : '#000'} emissiveIntensity={night ? 0.5 : 0} roughness={0.2} metalness={0.1} />
      </mesh>
    </group>
  );
}

export function WaterHeater({
  position = [0, 0, 0],
  rotation = 0,
}: {
  position?: [number, number, number];
  rotation?: number;
}) {
  const bodyMat = useMemo(() => paintedMetal('#eef1f4', 183), []);
  const pipeMat = useMemo(() => steel({ color: '#b95a2a', roughness: 0.5, metalness: 0.7, seed: 184 }), []); // copper
  const flueMat = useMemo(() => steel({ color: '#c7ccd1', seed: 185 }), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[0.5, 0.7, 0.28]} />
      </mesh>
      {/* control knob */}
      <mesh position={[0, -0.15, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#20242a' })}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
      </mesh>
      {/* water pipes */}
      <mesh position={[-0.12, -0.42, 0.05]} material={pipeMat}>
        <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
      </mesh>
      <mesh position={[0.12, -0.42, 0.05]} material={pipeMat}>
        <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
      </mesh>
      {/* flue */}
      <mesh position={[0, 0.5, 0]} material={flueMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 10]} />
      </mesh>
    </group>
  );
}
