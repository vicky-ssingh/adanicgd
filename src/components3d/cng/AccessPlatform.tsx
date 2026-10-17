import { useMemo } from 'react';
import { Handrail } from '@/components3d/primitives/Structure';
import { steel } from '@/materials/materials';

/**
 * Steel access platform (Section 02) — a grating deck on legs with a kick plate,
 * a handrail loop and a short access ladder. Used on the HP filtration skid and
 * the HP cascade so manifold valves / filter lids are reachable. Local origin at
 * ground; `deckY` is the walking-surface height.
 */
export function AccessPlatform({
  width = 2,
  depth = 1,
  deckY = 1,
  ladderX = 0,
  ladderZ,
}: {
  width?: number;
  depth?: number;
  deckY?: number;
  ladderX?: number;
  ladderZ?: number;
}) {
  const deckMat = useMemo(() => steel({ color: '#5b6068', roughness: 0.6, metalness: 0.8, seed: 400 }), []);
  const kickMat = useMemo(() => steel({ color: '#c9a227', roughness: 0.5, metalness: 0.7, seed: 401 }), []);
  const legMat = useMemo(() => steel({ color: '#6f757c', seed: 402 }), []);
  const lz = ladderZ ?? -depth / 2;

  return (
    <group>
      {/* legs */}
      {([[-width / 2 + 0.15, -depth / 2 + 0.15], [width / 2 - 0.15, -depth / 2 + 0.15], [-width / 2 + 0.15, depth / 2 - 0.15], [width / 2 - 0.15, depth / 2 - 0.15]] as const).map((p, i) => (
        <mesh key={i} position={[p[0], deckY / 2, p[1]]} castShadow material={legMat}>
          <boxGeometry args={[0.08, deckY, 0.08]} />
        </mesh>
      ))}
      {/* grating deck */}
      <mesh position={[0, deckY, 0]} castShadow receiveShadow material={deckMat}>
        <boxGeometry args={[width, 0.08, depth]} />
      </mesh>
      {/* kick plate around the edge */}
      {([[0, depth / 2 - 0.02, width, 0.04], [0, -depth / 2 + 0.02, width, 0.04]] as const).map((k, i) => (
        <mesh key={`kz${i}`} position={[k[0], deckY + 0.1, k[1]]} material={kickMat}>
          <boxGeometry args={[k[2], 0.12, k[3]]} />
        </mesh>
      ))}
      {([[width / 2 - 0.02, 0], [-width / 2 + 0.02, 0]] as const).map((k, i) => (
        <mesh key={`kx${i}`} position={[k[0], deckY + 0.1, k[1]]} material={kickMat}>
          <boxGeometry args={[0.04, 0.12, depth]} />
        </mesh>
      ))}
      {/* handrail loop just above the deck */}
      <group position={[0, deckY + 0.08, 0]}>
        <Handrail width={width} depth={depth} height={1.1} seed={403} />
      </group>
      {/* access ladder */}
      <group position={[ladderX, 0, lz]}>
        {([-0.22, 0.22] as const).map((x) => (
          <mesh key={x} position={[x, deckY / 2, -0.12]} material={legMat}>
            <cylinderGeometry args={[0.03, 0.03, deckY, 8]} />
          </mesh>
        ))}
        {Array.from({ length: Math.max(2, Math.round(deckY / 0.3)) }).map((_, i) => (
          <mesh key={i} position={[0, 0.15 + i * 0.3, -0.12]} rotation={[0, 0, Math.PI / 2]} material={legMat}>
            <cylinderGeometry args={[0.025, 0.025, 0.44, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
