import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateCity } from '@/config/cityLayout';
import { pipeworkBuildings, wallPipeLocal } from '@/config/wallPipework';
import { useSimStore } from '@/state/useSimStore';
import { useViewStore } from '@/state/useViewStore';

/**
 * Gas-flow particles rising up the yellow PNG wall service pipes (wall-pipework
 * fix). Small bright-blue particles travel UPWARD (low-pressure service line);
 * they halt when the sim is paused. One instanced mesh across all wall pipes.
 */
const PER = 4; // particles per pipe
const SPEED = 0.06; // fraction of pipe height per second (slow service line)

export function WallServiceFlow() {
  const mode = useViewStore((s) => s.mode);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const pipes = useMemo(() => {
    const city = generateCity();
    return pipeworkBuildings(city.buildings).map(({ lot }) => {
      const { x, z } = wallPipeLocal(lot.width, lot.depth, lot.category);
      const c = Math.cos(lot.rotation);
      const s = Math.sin(lot.rotation);
      const wx = lot.position[0] + x * c + z * s;
      const wz = lot.position[2] + -x * s + z * c;
      return { wx, wz, baseY: 0.3, topY: lot.height - 0.3 };
    });
  }, []);

  const total = pipes.length * PER;
  const color = useMemo(() => new THREE.Color('#60a5fa').multiplyScalar(1.9), []);
  const tvals = useMemo(() => {
    const arr = new Float32Array(total);
    for (let p = 0; p < pipes.length; p++) {
      for (let i = 0; i < PER; i++) arr[p * PER + i] = i / PER;
    }
    return arr;
  }, [pipes, total]);

  const visible = mode !== 'CNG';

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || total === 0) return;
    const sim = useSimStore.getState();
    const dt = Math.min(delta, 0.05);
    const step = sim.playing ? SPEED * sim.speed * dt : 0;
    for (let p = 0; p < pipes.length; p++) {
      const pipe = pipes[p];
      for (let i = 0; i < PER; i++) {
        const gi = p * PER + i;
        let t = tvals[gi] + step;
        if (t > 1) t -= 1;
        tvals[gi] = t;
        dummy.position.set(pipe.wx, pipe.baseY + t * (pipe.topY - pipe.baseY), pipe.wz);
        dummy.scale.setScalar(visible ? 1 : 0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(gi, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (total === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, total]} frustumCulled={false}>
      <sphereGeometry args={[0.09, 8, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.95} />
    </instancedMesh>
  );
}
