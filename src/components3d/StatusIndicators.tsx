import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NETWORK } from '@/config/network';
import { useSimStore } from '@/state/useSimStore';
import { BRAND } from '@/theme/tokens';

/**
 * In-scene status reactions (spec §2.26 reaction / §2.27 alerts). For any node
 * not "online", a pulsing ground ring + vertical beacon appears at its world
 * position, coloured amber (warning) or maroon (critical/offline), so scenario
 * effects — isolation, pressure drop, equipment shutdown — are visible in the
 * 3D scene, not just on the dashboard. Reads live status each frame.
 */
export function StatusIndicators() {
  const groupRef = useRef<THREE.Group>(null);
  const items = useRef(
    NETWORK.nodes.map((n) => ({ id: n.id, pos: n.position })),
  );

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const values = useSimStore.getState().values;
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + Math.sin(t * 4) * 0.5;

    g.children.forEach((child, i) => {
      const it = items.current[i];
      const st = values[it.id]?.status ?? 'online';
      const show = st !== 'online';
      child.visible = show;
      if (!show) return;
      const critical = st === 'critical' || st === 'offline';
      const col = critical ? CRITICAL : WARN;
      const ring = child.children[0] as THREE.Mesh;
      const beam = child.children[1] as THREE.Mesh;
      (ring.material as THREE.MeshBasicMaterial).color.copy(col);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + pulse * 0.5;
      const s = 1 + pulse * 0.12;
      ring.scale.set(s, s, s);
      (beam.material as THREE.MeshBasicMaterial).color.copy(col);
      (beam.material as THREE.MeshBasicMaterial).opacity = 0.15 + pulse * 0.25;
    });
  });

  return (
    <group ref={groupRef}>
      {items.current.map((it) => (
        <group key={it.id} position={[it.pos[0], 0, it.pos[2]]} visible={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
            <ringGeometry args={[3.6, 4.2, 40]} />
            <meshBasicMaterial color={CRITICAL} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh position={[0, 8, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 16, 8, 1, true]} />
            <meshBasicMaterial color={CRITICAL} transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const CRITICAL = new THREE.Color(BRAND.alert);
const WARN = new THREE.Color('#e0a23c');
