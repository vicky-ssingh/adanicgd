import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SignPlane } from '@/components3d/branding/Branding';
import { useSimStore } from '@/state/useSimStore';

/**
 * Section 17 §C.3 (was §12 A.3.3) — permanent pipe cutaway showpieces. A short pipe
 * length with the upper half removed exposes the bore, with the WALL THICKNESS
 * visible as an annular ring at the cut ends, a darker inner surface, gas particles
 * flowing through, and a labelled stand. Exhibition-model devices that give the
 * internal-flow concept a permanent presence without the toggle.
 */
const shell = new THREE.MeshStandardMaterial({ color: '#9ba3ab', metalness: 0.75, roughness: 0.42, side: THREE.DoubleSide });
const bore = new THREE.MeshStandardMaterial({ color: '#2b3036', metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide });
const ringMat = new THREE.MeshStandardMaterial({ color: '#c7ccd1', metalness: 0.8, roughness: 0.3 });
const partColor = new THREE.Color('#7fb4ff');

function Cutaway({ pos, rot, r = 0.32, len = 6, color = '#f5c400' }: { pos: [number, number, number]; rot: number; r?: number; len?: number; color?: string }) {
  const parts = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const wall = r * 0.08;

  useFrame((_, dt) => {
    const mesh = parts.current;
    if (!mesh) return;
    const sim = useSimStore.getState();
    const step = sim.playing ? dt * 0.5 * sim.speed : 0;
    const N = 10;
    for (let i = 0; i < N; i++) {
      let t = ((mesh.userData['p' + i] ?? i / N) + step) % 1;
      mesh.userData['p' + i] = t;
      const a = ((i * 2.399) % 1) * Math.PI - Math.PI / 2; // spread across lower bore
      dummy.position.set(-len / 2 + t * len, Math.sin(a) * (r - wall) * 0.5 - 0.05, Math.cos(a) * (r - wall) * 0.5);
      dummy.scale.setScalar(0.06);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* bottom-half outer shell (upper half removed), axis along X */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={shell}><cylinderGeometry args={[r, r, len, 24, 1, true, 0, Math.PI]} /></mesh>
      {/* inner bore (darker), slightly smaller */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={bore}><cylinderGeometry args={[r - wall, r - wall, len - 0.02, 24, 1, true, 0, Math.PI]} /></mesh>
      {/* wall-thickness annular rings at the two cut ends */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * len / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={ringMat}>
          <ringGeometry args={[r - wall, r, 24, 1, Math.PI, Math.PI]} />
        </mesh>
      ))}
      {/* colour identification band on the intact underside */}
      <mesh position={[0, -r, 0]} rotation={[0, 0, Math.PI / 2]} material={new THREE.MeshStandardMaterial({ color })}><cylinderGeometry args={[r + 0.005, r + 0.005, 0.3, 24, 1, true, Math.PI * 0.6, Math.PI * 0.3]} /></mesh>
      {/* flowing particles in the bore */}
      <instancedMesh ref={parts} args={[undefined, undefined, 10]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={partColor} toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>
      {/* labelled stand */}
      <group position={[0, 0, r + 0.5]}>
        <mesh position={[0, -0.3, 0]} material={ringMat}><cylinderGeometry args={[0.025, 0.025, 0.6, 8]} /></mesh>
        <SignPlane text="CUTAWAY VIEW — GAS FLOW" width={2.0} position={[0, 0.15, 0]} options={{ fg: '#fff', bg: '#0B74B0', fontWeight: 800, letterSpacing: 1 }} doubleSide />
      </group>
    </group>
  );
}

export function PipeCutaways() {
  return (
    <group>
      {/* transmission line (east entry) */}
      <Cutaway pos={[124, 2.2, -84]} rot={0.2} r={0.34} color="#f5c400" />
      {/* primary distribution */}
      <Cutaway pos={[62, 1.2, -74]} rot={-0.5} r={0.2} color="#f5c400" />
      {/* MDPE / local service (near the PNG west district) */}
      <Cutaway pos={[-40, 0.9, 30]} rot={0.6} r={0.12} len={4} color="#f5c400" />
    </group>
  );
}
