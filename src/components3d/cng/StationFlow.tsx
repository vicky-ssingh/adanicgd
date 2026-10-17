import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '@/state/useSimStore';
import { useViewStore } from '@/state/useViewStore';
import { useStationStore } from '@/state/useStationStore';

/**
 * Section 01 §11 — internal station gas flow. Teal particles travel the full
 * chain (inlet skid → compressor → cascade → priority panel → dispenser → hose →
 * vehicle) in the station's local frame. Particles grow after the compressor
 * (denser, compressed gas). Halts when the sim is paused or the upstream PRS is
 * offline (ESD / equipment-shutdown), and only shows in CNG / BOTH view modes.
 * Speeds up while a vehicle is refuelling. Reads the shared sim — adds no logic.
 */

// Local-space chain waypoints (must track the layout in OnlineCngStation).
// The gas stays INSIDE equipment/piping the whole way — it never crosses the
// forecourt in open air. From the priority panel the high-pressure line dives
// underground (y<0, buried under the slab) to the dispenser island, then rises
// up inside the dispenser and travels the hose to the vehicle fill point.
const PATH: [number, number, number][] = [
  [13, 1.0, -4.5], // inlet skid
  [9.5, 1.0, -4.5],
  [6.5, 1.1, -4.5], // compressor (suction/inside)
  [8, 1.6, -1],
  [11, 1.7, 4], // cascade
  [8.5, 1.2, 4],
  [6.5, 0.9, 4], // priority panel outlet
  [5.5, 0.15, 3.4], // drop to buried HP header
  [1, -1.35, 1.2], // buried under the forecourt
  [-5, -1.4, -1.2], // buried crossing to the dispenser island
  [-8.7, -1.2, -3.2], // riser at the dispenser base
  [-9, 0.6, -3.4], // up inside the dispenser
  [-9, 1.35, -3.4], // dispenser nozzle head
  [-10.2, 0.7, -3.4], // hose → vehicle fill point
];
const COMPRESSOR_T = 0.22; // fraction of the path where gas becomes "compressed"
const COUNT = 46;

export function StationFlow() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mode = useViewStore((s) => s.mode);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2),
    [],
  );
  const tvals = useMemo(() => Float32Array.from({ length: COUNT }, (_, i) => i / COUNT), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const show = mode === 'CNG' || mode === 'BOTH';
    const sim = useSimStore.getState();
    const feedAlive = (sim.values['prs']?.status ?? 'online') !== 'offline';
    const st = useStationStore.getState();
    const running = show && sim.playing && feedAlive;
    mesh.visible = show;
    if (!running) return;

    const dt = Math.min(delta, 0.05);
    const boost = st.refueling ? 1.7 : 1.0;
    const speed = 0.06 * sim.speed * boost;

    for (let i = 0; i < COUNT; i++) {
      let t = tvals[i] + speed * dt;
      if (t > 1) t -= 1;
      tvals[i] = t;
      const p = curve.getPointAt(t);
      dummy.position.set(p.x, p.y, p.z);
      const s = t > COMPRESSOR_T ? 0.2 : 0.13;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color="#00e5cc" toneMapped={false} transparent opacity={0.95} />
    </instancedMesh>
  );
}
