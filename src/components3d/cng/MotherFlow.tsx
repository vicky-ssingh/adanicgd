import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '@/state/useSimStore';
import { useViewStore } from '@/state/useViewStore';
import { useMotherStore } from '@/state/useMotherStore';

/**
 * Section 02 §10 — internal Mother Station gas flow. Teal particles run the main
 * chain (inlet → filtration → metering → compressors → discharge header →
 * cascade → priority → dispenser → vehicle) and, when a trailer is filling, a
 * visibly heavier stream on the trailer-fill branch (reserve → filling panel →
 * hoses → trailer). Gated by the live sim (halts on pause / PRS offline) and the
 * CNG / BOTH view mode. Reads the shared sim — adds no logic.
 */

const MAIN_PATH: [number, number, number][] = [
  [-30, 1.0, -16],
  [-30, 1.1, -12],
  [-18, 1.0, -16],
  [-2, 1.3, -8],
  [10, 1.5, -6],
  [22, 1.7, -6],
  [14, 1.0, -12],
  [6, 0.9, -16],
  [16, 0.7, 4],
  [26, 1.4, 20],
  [28, 0.7, 23],
];
const TRAILER_PATH: [number, number, number][] = [
  [22, 1.2, -6],
  [10, 1.0, 0],
  [-2, 1.2, 8],
  [-5, 1.7, 12],
  [-10, 1.6, 12],
  [-14, 1.5, 12],
];
const MAIN_COUNT = 60;
const TRAILER_COUNT = 40;
const COMPRESSOR_T = 0.36; // past the compressor on the main path

export function MotherFlow() {
  const mainRef = useRef<THREE.InstancedMesh>(null);
  const trailerRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mode = useViewStore((s) => s.mode);

  const mainCurve = useMemo(() => new THREE.CatmullRomCurve3(MAIN_PATH.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2), []);
  const trailerCurve = useMemo(() => new THREE.CatmullRomCurve3(TRAILER_PATH.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2), []);
  const mainT = useMemo(() => Float32Array.from({ length: MAIN_COUNT }, (_, i) => i / MAIN_COUNT), []);
  const trailerT = useMemo(() => Float32Array.from({ length: TRAILER_COUNT }, (_, i) => i / TRAILER_COUNT), []);

  useFrame((_, delta) => {
    const show = mode === 'CNG' || mode === 'BOTH';
    const sim = useSimStore.getState();
    const feedAlive = (sim.values['prs']?.status ?? 'online') !== 'offline';
    const running = show && sim.playing && feedAlive;
    const filling = useMotherStore.getState().stage === 'filling';
    const dt = Math.min(delta, 0.05);

    const main = mainRef.current;
    if (main) {
      main.visible = show;
      if (running) {
        const speed = 0.05 * sim.speed;
        for (let i = 0; i < MAIN_COUNT; i++) {
          let t = mainT[i] + speed * dt;
          if (t > 1) t -= 1;
          mainT[i] = t;
          const p = mainCurve.getPointAt(t);
          dummy.position.set(p.x, p.y, p.z);
          dummy.scale.setScalar(t > COMPRESSOR_T ? 0.24 : 0.16);
          dummy.updateMatrix();
          main.setMatrixAt(i, dummy.matrix);
        }
        main.instanceMatrix.needsUpdate = true;
      }
    }

    const tr = trailerRef.current;
    if (tr) {
      // Heavier, visible stream only while actually filling a trailer.
      tr.visible = show && filling;
      if (running && filling) {
        const speed = 0.09 * sim.speed;
        for (let i = 0; i < TRAILER_COUNT; i++) {
          let t = trailerT[i] + speed * dt;
          if (t > 1) t -= 1;
          trailerT[i] = t;
          const p = trailerCurve.getPointAt(t);
          dummy.position.set(p.x, p.y, p.z);
          dummy.scale.setScalar(0.26);
          dummy.updateMatrix();
          tr.setMatrixAt(i, dummy.matrix);
        }
        tr.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <instancedMesh ref={mainRef} args={[undefined, undefined, MAIN_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#14b8a6" toneMapped={false} transparent opacity={0.95} />
      </instancedMesh>
      <instancedMesh ref={trailerRef} args={[undefined, undefined, TRAILER_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#3ff0d6" toneMapped={false} transparent opacity={0.98} />
      </instancedMesh>
    </group>
  );
}
