import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { steel, paintedMetal, concrete, emissive } from '@/materials/materials';

/**
 * Structural primitives (spec §2.3): skid base frame, pressure vessel, handrail,
 * control cabinet, and concrete pad. These assemble into the CGD equipment so no
 * asset is a single block.
 */

/** Concrete equipment pad. */
export function Pad({
  size = [6, 4],
  height = 0.3,
  seed = 12,
}: {
  size?: [number, number];
  height?: number;
  seed?: number;
}) {
  const mat = useMemo(() => concrete('#9a968e', seed), [seed]);
  return (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={mat}>
      <boxGeometry args={[size[0], height, size[1]]} />
    </mesh>
  );
}

/** Skid base: runner beams + cross members forming a lifting frame. */
export function SkidBase({
  width = 5,
  depth = 3,
  beam = 0.22,
  y = 0.35,
  seed = 13,
}: {
  width?: number;
  depth?: number;
  beam?: number;
  y?: number;
  seed?: number;
}) {
  const mat = useMemo(() => steel({ color: '#5b6068', roughness: 0.55, metalness: 0.85, seed }), [seed]);
  const crosses = useMemo(() => {
    const n = Math.max(2, Math.round(width / 1.2));
    return Array.from({ length: n }, (_, i) => -width / 2 + (i / (n - 1)) * width);
  }, [width]);
  return (
    <group position={[0, y, 0]}>
      {/* two long runners */}
      <mesh position={[0, 0, depth / 2 - beam / 2]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[width, beam, beam]} />
      </mesh>
      <mesh position={[0, 0, -depth / 2 + beam / 2]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[width, beam, beam]} />
      </mesh>
      {/* cross members */}
      {crosses.map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} castShadow receiveShadow material={mat}>
          <boxGeometry args={[beam, beam, depth]} />
        </mesh>
      ))}
    </group>
  );
}

/** Horizontal pressure vessel with dished ends + saddle supports. */
export function Vessel({
  radius = 0.7,
  length = 4,
  color = '#d3d7db',
  seed = 14,
  saddles = true,
}: {
  radius?: number;
  length?: number;
  color?: string;
  seed?: number;
  saddles?: boolean;
}) {
  const mat = useMemo(() => steel({ color, roughness: 0.34, metalness: 0.9, seed }), [color, seed]);
  const saddleMat = useMemo(() => paintedMetal('#3f4a52', seed + 3), [seed]);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={mat}>
        <cylinderGeometry args={[radius, radius, length, 32]} />
      </mesh>
      {/* dished ends */}
      <mesh position={[length / 2, 0, 0]} castShadow material={mat}>
        <sphereGeometry args={[radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[-length / 2, 0, 0]} rotation={[Math.PI, 0, 0]} castShadow material={mat}>
        <sphereGeometry args={[radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {saddles &&
        [length * 0.28, -length * 0.28].map((x, i) => (
          <mesh key={i} position={[x, -radius * 0.75, 0]} castShadow receiveShadow material={saddleMat}>
            <boxGeometry args={[0.25, radius * 0.7, radius * 2.1]} />
          </mesh>
        ))}
    </group>
  );
}

/** Vertical pressure vessel / filter column. */
export function Column({
  radius = 0.55,
  height = 3,
  color = '#c7ccd1',
  seed = 16,
}: {
  radius?: number;
  height?: number;
  color?: string;
  seed?: number;
}) {
  const mat = useMemo(() => steel({ color, roughness: 0.34, metalness: 0.9, seed }), [color, seed]);
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={mat}>
        <cylinderGeometry args={[radius, radius, height, 28]} />
      </mesh>
      <mesh position={[0, height, 0]} castShadow material={mat}>
        <sphereGeometry args={[radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} castShadow material={mat}>
        <sphereGeometry args={[radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

/** Handrail loop around a rectangular platform edge. */
export function Handrail({
  width = 4,
  depth = 3,
  height = 1.05,
  seed = 18,
}: {
  width?: number;
  depth?: number;
  height?: number;
  seed?: number;
}) {
  const mat = useMemo(() => steel({ color: '#c9a227', roughness: 0.5, metalness: 0.7, seed }), [seed]);
  const posts = useMemo(() => {
    const pts: [number, number][] = [];
    const nx = Math.max(2, Math.round(width / 1.1));
    const nz = Math.max(2, Math.round(depth / 1.1));
    for (let i = 0; i <= nx; i++) {
      const x = -width / 2 + (i / nx) * width;
      pts.push([x, -depth / 2]);
      pts.push([x, depth / 2]);
    }
    for (let i = 1; i < nz; i++) {
      const z = -depth / 2 + (i / nz) * depth;
      pts.push([-width / 2, z]);
      pts.push([width / 2, z]);
    }
    return pts;
  }, [width, depth]);

  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={[p[0], height / 2, p[1]]} castShadow material={mat}>
          <cylinderGeometry args={[0.03, 0.03, height, 6]} />
        </mesh>
      ))}
      {/* top rails (4 sides) */}
      {[
        { pos: [0, height, depth / 2], rot: [0, 0, Math.PI / 2], len: width },
        { pos: [0, height, -depth / 2], rot: [0, 0, Math.PI / 2], len: width },
        { pos: [width / 2, height, 0], rot: [Math.PI / 2, 0, 0], len: depth },
        { pos: [-width / 2, height, 0], rot: [Math.PI / 2, 0, 0], len: depth },
      ].map((r, i) => (
        <mesh
          key={i}
          position={r.pos as [number, number, number]}
          rotation={r.rot as [number, number, number]}
          castShadow
          material={mat}
        >
          <cylinderGeometry args={[0.03, 0.03, r.len, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Brand-painted control cabinet with an emissive status strip. */
export function ControlCabinet({
  width = 0.8,
  height = 1.7,
  depth = 0.5,
  color,
  statusColor,
  seed = 20,
}: {
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
  statusColor?: string;
  seed?: number;
}) {
  const bodyColor = color ?? 'var';
  const mat = useMemo(
    () => paintedMetal(bodyColor === 'var' ? '#2f5f86' : bodyColor, seed),
    [bodyColor, seed],
  );
  const strip = useMemo(
    () => emissive(statusColor ?? '#0f8b8d', 1.4),
    [statusColor],
  );
  return (
    <group>
      <RoundedBox
        args={[width, height, depth]}
        radius={0.03}
        smoothness={3}
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
        material={mat}
      />
      <mesh position={[0, height * 0.62, depth / 2 + 0.005]} material={strip}>
        <boxGeometry args={[width * 0.7, 0.08, 0.02]} />
      </mesh>
      {/* louvres */}
      {[0.3, 0.4, 0.5].map((f, i) => (
        <mesh key={i} position={[0, height * f, depth / 2 + 0.002]}>
          <boxGeometry args={[width * 0.6, 0.02, 0.01]} />
          <meshStandardMaterial color="#1c2732" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
