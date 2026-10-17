import { useMemo } from 'react';
import * as THREE from 'three';
import { asphalt, concrete } from '@/materials/materials';
import {
  generateCity,
  GRID,
  type CityLayout,
} from '@/config/cityLayout';

/**
 * Road network + sidewalks + markings (spec §2.7). One large asphalt sheet under
 * the whole city with a raised concrete sidewalk slab per block, plus instanced
 * lane dashes and crosswalk bars. Kept as a few large meshes + instances for
 * performance.
 */
export function Roads({ layout }: { layout: CityLayout }) {
  const asphaltMat = useMemo(() => {
    const m = asphalt(30).clone();
    const scale = layout.bounds / 4;
    [m.roughnessMap, m.normalMap].forEach((t) => {
      if (t) {
        t.repeat.set(scale, scale);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
      }
    });
    return m;
  }, [layout.bounds]);

  // Shantigram: light beige/cream paver-tile footpaths (addon §6)
  const sidewalkMat = useMemo(() => concrete('#e4dac4', 71), []);
  const paintMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d9d7cb',
        roughness: 0.7,
        metalness: 0,
        emissive: new THREE.Color('#d9d7cb'),
        emissiveIntensity: 0.05,
      }),
    [],
  );

  const { N, BLOCK } = GRID;

  // Sidewalk slabs — one per block cell, slightly larger than the buildable area
  // so building edges sit on pavement, raised 0.12 above the road.
  const sidewalks = useMemo(() => {
    const slabs: { pos: [number, number, number]; size: [number, number] }[] = [];
    for (let cx = 0; cx < N; cx++) {
      for (let cz = 0; cz < N; cz++) {
        const bx =
          -layout.bounds / 2 + GRID.ROAD + BLOCK / 2 + cx * (BLOCK + GRID.ROAD);
        const bz =
          -layout.bounds / 2 + GRID.ROAD + BLOCK / 2 + cz * (BLOCK + GRID.ROAD);
        slabs.push({ pos: [bx, 0.06, bz], size: [BLOCK + 1.5, BLOCK + 1.5] });
      }
    }
    return slabs;
  }, [layout.bounds, N, BLOCK]);

  return (
    <group>
      {/* Asphalt base sheet */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        material={asphaltMat}
      >
        <planeGeometry args={[layout.bounds + 8, layout.bounds + 8]} />
      </mesh>

      {/* Sidewalk slabs */}
      {sidewalks.map((s, i) => (
        <mesh
          key={i}
          position={s.pos}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          castShadow
          material={sidewalkMat}
        >
          <boxGeometry args={[s.size[0], s.size[1], 0.12]} />
        </mesh>
      ))}

      {/* Lane centreline dashes (instanced) */}
      <LaneDashes layout={layout} material={paintMat} />

      {/* Crosswalk bars (instanced) */}
      <Crosswalks layout={layout} material={paintMat} />
    </group>
  );
}

function LaneDashes({
  layout,
  material,
}: {
  layout: CityLayout;
  material: THREE.Material;
}) {
  const ref = useMemo(() => new THREE.Object3D(), []);
  const geom = useMemo(() => new THREE.PlaneGeometry(1.6, 0.18), []);
  const count = layout.laneDashes.length;

  const inst = useMemo(() => {
    const mesh = new THREE.InstancedMesh(geom, material, count);
    layout.laneDashes.forEach((d, i) => {
      ref.position.set(d.position[0], 0.03, d.position[2]);
      ref.rotation.set(-Math.PI / 2, 0, d.rotation);
      ref.scale.setScalar(1);
      ref.updateMatrix();
      mesh.setMatrixAt(i, ref.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [geom, material, count, layout.laneDashes, ref]);

  return <primitive object={inst} />;
}

function Crosswalks({
  layout,
  material,
}: {
  layout: CityLayout;
  material: THREE.Material;
}) {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geom = useMemo(() => new THREE.PlaneGeometry(0.4, 3.4), []);
  // 6 bars per crosswalk
  const barsPer = 6;
  const count = layout.crosswalks.length * barsPer;

  const inst = useMemo(() => {
    const mesh = new THREE.InstancedMesh(geom, material, count);
    let idx = 0;
    layout.crosswalks.forEach((cw) => {
      for (let b = 0; b < barsPer; b++) {
        const off = (b - (barsPer - 1) / 2) * 0.7;
        if (cw.horizontal) {
          dummy.position.set(cw.x + off, 0.035, cw.z);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
        } else {
          dummy.position.set(cw.x, 0.035, cw.z + off);
          dummy.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
        }
        dummy.updateMatrix();
        mesh.setMatrixAt(idx++, dummy.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [geom, count, layout.crosswalks, dummy]);

  return <primitive object={inst} />;
}

// Re-export the generator so consumers can build a layout once.
export { generateCity };
