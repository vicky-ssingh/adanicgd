import { useMemo } from 'react';
import * as THREE from 'three';
import type { PropInstance } from '@/config/cityLayout';
import { useViewStore } from '@/state/useViewStore';

/**
 * Instanced streetlights (spec §2.7 / §2.32). A tapered pole + arm + lamp head.
 * Lamp heads emit warm light at night (emissive + a shared point-light budget is
 * avoided for performance — the emissive head + bloom reads as lit).
 */
export function Streetlights({ items }: { items: PropInstance[] }) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const poleGeom = useMemo(() => new THREE.CylinderGeometry(0.09, 0.13, 6, 8), []);
  const armGeom = useMemo(() => new THREE.BoxGeometry(1.4, 0.12, 0.12), []);
  const headGeom = useMemo(() => new THREE.BoxGeometry(0.7, 0.22, 0.35), []);

  const poleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3c4148', roughness: 0.5, metalness: 0.8 }),
    [],
  );
  const headMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#20242a',
        roughness: 0.4,
        metalness: 0.6,
        emissive: new THREE.Color('#eaf1ff'), // cool LED, not sodium orange (addon §6)
        emissiveIntensity: 0,
      }),
    [],
  );
  headMat.emissiveIntensity = night ? 2.4 : 0;

  const count = items.length;

  const { poles, arms, heads } = useMemo(() => {
    const p = new THREE.InstancedMesh(poleGeom, poleMat, count);
    const a = new THREE.InstancedMesh(armGeom, poleMat, count);
    const h = new THREE.InstancedMesh(headGeom, headMat, count);
    items.forEach((it, i) => {
      const [x, , z] = it.position;
      // pole
      dummy.position.set(x, 3, z);
      dummy.rotation.set(0, it.rotation, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      p.setMatrixAt(i, dummy.matrix);
      // arm reaches toward the road (local +x rotated by it.rotation)
      const ax = Math.cos(it.rotation) * 0.7;
      const az = -Math.sin(it.rotation) * 0.7;
      dummy.position.set(x + ax, 5.9, z + az);
      dummy.rotation.set(0, it.rotation, 0);
      dummy.updateMatrix();
      a.setMatrixAt(i, dummy.matrix);
      // head at arm end
      const hx = Math.cos(it.rotation) * 1.3;
      const hz = -Math.sin(it.rotation) * 1.3;
      dummy.position.set(x + hx, 5.82, z + hz);
      dummy.rotation.set(0, it.rotation, 0);
      dummy.updateMatrix();
      h.setMatrixAt(i, dummy.matrix);
    });
    p.instanceMatrix.needsUpdate = true;
    a.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
    p.castShadow = true;
    return { poles: p, arms: a, heads: h };
  }, [poleGeom, armGeom, headGeom, poleMat, headMat, count, items, dummy]);

  return (
    <group>
      <primitive object={poles} />
      <primitive object={arms} />
      <primitive object={heads} />
    </group>
  );
}
