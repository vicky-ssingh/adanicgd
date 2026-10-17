import { useMemo } from 'react';
import * as THREE from 'three';
import { steel } from '@/materials/materials';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Straight pipe segment between two world points (spec §2.3). Optionally caps
 * each end with a flange. Used everywhere pipes connect equipment.
 */
export function Pipe({
  from,
  to,
  radius = 0.16,
  color = '#9aa1a8',
  metalness = 0.9,
  roughness = 0.4,
  flanges = false,
  seed = 1,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  flanges?: boolean;
  seed?: number;
}) {
  const mat = useMemo(
    () => steel({ color, metalness, roughness, seed }),
    [color, metalness, roughness, seed],
  );

  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      UP,
      dir.clone().normalize(),
    );
    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh castShadow receiveShadow material={mat}>
        <cylinderGeometry args={[radius, radius, length, 20]} />
      </mesh>
      {flanges && (
        <>
          <mesh position={[0, length / 2 - 0.02, 0]} castShadow material={mat}>
            <cylinderGeometry args={[radius * 1.7, radius * 1.7, 0.08, 20]} />
          </mesh>
          <mesh position={[0, -length / 2 + 0.02, 0]} castShadow material={mat}>
            <cylinderGeometry args={[radius * 1.7, radius * 1.7, 0.08, 20]} />
          </mesh>
        </>
      )}
    </group>
  );
}

/**
 * Smooth multi-point pipe run with rounded bends (spec §2.13). Builds a
 * TubeGeometry through the given waypoints — good for distribution routes and
 * underground transitions.
 */
export function PipeRun({
  points,
  radius = 0.16,
  color = '#8f969d',
  roughness = 0.42,
  metalness = 0.9,
  seed = 2,
  tension = 0.0,
  radialSegments = 16,
}: {
  points: [number, number, number][];
  radius?: number;
  color?: string;
  roughness?: number;
  metalness?: number;
  seed?: number;
  tension?: number;
  radialSegments?: number;
}) {
  const mat = useMemo(
    () => steel({ color, metalness, roughness, seed }),
    [color, metalness, roughness, seed],
  );

  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      tension,
    );
    const tubular = Math.max(16, points.length * 12);
    return new THREE.TubeGeometry(curve, tubular, radius, radialSegments, false);
  }, [points, radius, tension, radialSegments]);

  return <mesh geometry={geom} material={mat} castShadow receiveShadow />;
}
