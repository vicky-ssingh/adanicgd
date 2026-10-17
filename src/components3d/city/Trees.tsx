import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PropInstance } from '@/config/cityLayout';
import { useTourFxStore } from '@/state/useTourFxStore';

/**
 * Instanced landscaping (spec §2.7). Two species for a premium-township feel:
 * broadleaf trees with a full three-lobe crown + tapered trunk, and slender
 * palms with radiating fronds (variant 2). Everything stays instanced so the
 * dense avenue planting is cheap. Per-instance colour + jitter break up repetition.
 */

const GREENS = ['#3f6b3a', '#4c7a3e', '#588a45', '#39602f', '#63913f'];
const PALM_GREENS = ['#4a7d3a', '#5a8f42', '#3f6f33'];

function seedRand(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Trees({ items }: { items: PropInstance[] }) {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const broadleaf = useMemo(() => items.filter((i) => i.variant !== 2), [items]);
  const palms = useMemo(() => items.filter((i) => i.variant === 2), [items]);

  // Shared geometries.
  const trunkGeom = useMemo(() => new THREE.CylinderGeometry(0.11, 0.2, 2.0, 8), []);
  const lobeGeom = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const palmTrunkGeom = useMemo(() => new THREE.CylinderGeometry(0.09, 0.16, 3.4, 8), []);
  const frondGeom = useMemo(() => {
    const g = new THREE.ConeGeometry(0.28, 2.1, 5);
    g.translate(0, 1.05, 0); // pivot at base
    return g;
  }, []);

  const barkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6b5236', roughness: 0.92, metalness: 0 }),
    [],
  );
  const palmBarkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8a7350', roughness: 0.9, metalness: 0 }),
    [],
  );
  const foliageMat = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, flatShading: true }),
    [],
  );
  const frondMat = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, flatShading: true }),
    [],
  );

  // ---- Broadleaf: trunk + 3 crown lobes ----
  const { trunks, crown } = useMemo(() => {
    const n = broadleaf.length;
    const t = new THREE.InstancedMesh(trunkGeom, barkMat, n);
    const c = new THREE.InstancedMesh(lobeGeom, foliageMat, n * 3);
    broadleaf.forEach((it, i) => {
      const s = it.scale;
      const r = seedRand(Math.round(it.position[0] * 7 + it.position[2] * 13));
      const [x, , z] = it.position;

      dummy.position.set(x, 1.0 * s, z);
      dummy.rotation.set(0, it.rotation, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      t.setMatrixAt(i, dummy.matrix);

      const lobes: [number, number, number, number][] = [
        [0, 2.5, 1.35, 0], // [dx-scaled offset x, y, scale, dz]
        [(r() - 0.5) * 0.7, 3.15, 1.1, (r() - 0.5) * 0.7],
        [(r() - 0.5) * 0.5, 3.75, 0.82, (r() - 0.5) * 0.5],
      ];
      lobes.forEach((lo, li) => {
        dummy.position.set(x + lo[0] * s, lo[1] * s, z + lo[3] * s);
        const sc = lo[2] * s * (0.92 + r() * 0.16);
        dummy.scale.set(sc, sc * 0.92, sc);
        dummy.rotation.set(0, it.rotation + li, 0);
        dummy.updateMatrix();
        c.setMatrixAt(i * 3 + li, dummy.matrix);
        color.set(GREENS[Math.floor(r() * GREENS.length)]);
        c.setColorAt(i * 3 + li, color);
      });
    });
    t.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
    t.castShadow = true;
    c.castShadow = true;
    return { trunks: t, crown: c };
  }, [broadleaf, trunkGeom, lobeGeom, barkMat, foliageMat, dummy, color]);

  // ---- Palm: trunk + radiating fronds ----
  const FRONDS = 7;
  const { palmTrunks, fronds } = useMemo(() => {
    const n = palms.length;
    const t = new THREE.InstancedMesh(palmTrunkGeom, palmBarkMat, n);
    const f = new THREE.InstancedMesh(frondGeom, frondMat, n * FRONDS);
    palms.forEach((it, i) => {
      const s = it.scale * 1.1;
      const [x, , z] = it.position;
      const lean = 0.05;
      dummy.position.set(x, 1.7 * s, z);
      dummy.rotation.set(lean, it.rotation, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      t.setMatrixAt(i, dummy.matrix);

      const crownY = 3.35 * s;
      for (let j = 0; j < FRONDS; j++) {
        const ang = it.rotation + (j / FRONDS) * Math.PI * 2;
        // arch fronds outward to near-horizontal, drooping slightly at the tips
        const droop = 1.35 + (j % 2) * 0.22;
        dummy.position.set(x, crownY, z);
        dummy.rotation.set(0, ang, droop);
        dummy.scale.set(s * 0.8, s, s * 0.5);
        dummy.updateMatrix();
        f.setMatrixAt(i * FRONDS + j, dummy.matrix);
        color.set(PALM_GREENS[j % PALM_GREENS.length]);
        f.setColorAt(i * FRONDS + j, color);
      }
    });
    t.instanceMatrix.needsUpdate = true;
    f.instanceMatrix.needsUpdate = true;
    if (f.instanceColor) f.instanceColor.needsUpdate = true;
    t.castShadow = true;
    f.castShadow = true;
    return { palmTrunks: t, fronds: f };
  }, [palms, palmTrunkGeom, frondGeom, palmBarkMat, frondMat, dummy, color]);

  // Section 14 §D.4 — the guided tour can temporarily fade trees that would
  // occlude a stop's subject. Applied to the shared materials; reverts to 1.
  const mats = useMemo(() => [barkMat, palmBarkMat, foliageMat, frondMat], [barkMat, palmBarkMat, foliageMat, frondMat]);
  useFrame(() => {
    const o = useTourFxStore.getState().propOpacity;
    for (const m of mats) {
      const transparent = o < 0.999;
      if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
      m.opacity = o;
      m.depthWrite = !transparent;
    }
  });

  return (
    <group>
      <primitive object={trunks} />
      <primitive object={crown} />
      <primitive object={palmTrunks} />
      <primitive object={fronds} />
    </group>
  );
}
