import { useMemo } from 'react';
import { GasHob, WaterHeater } from './GasAppliance';
import { PngMeter } from './PngMeter';
import { PipeRun, Pipe } from '@/components3d/primitives/Pipe';
import { concrete, paintedMetal } from '@/materials/materials';

/**
 * Residential PNG interior cutaway (spec §2.21): a two-wall kitchen showing the
 * complete last-mile path — service riser → PNG meter → internal gas pipe →
 * appliances (hob + water heater). Presented as an open cutaway so the internal
 * routing is visible; the "zoom into a building" camera preset (M8) frames it.
 */
export function ResidentialInterior(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;
  const floorMat = useMemo(() => concrete('#b9b0a2', 190), []);
  const wallMat = useMemo(() => paintedMetal('#e9e4d8', 191), []);
  const counterMat = useMemo(() => concrete('#cfd3d7', 192), []);

  const W = 4.2;
  const D = 3.6;
  const H = 2.6;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* base plinth */}
      <mesh position={[0, -0.15, 0]} receiveShadow material={concrete('#8d8980', 194)}>
        <boxGeometry args={[W + 0.6, 0.3, D + 0.6]} />
      </mesh>
      {/* floor */}
      <mesh position={[0, 0.02, 0]} receiveShadow material={floorMat}>
        <boxGeometry args={[W, 0.06, D]} />
      </mesh>
      {/* back wall (-Z) + left wall (-X) — cutaway */}
      <mesh position={[0, H / 2, -D / 2]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[W, H, 0.12]} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[0.12, H, D]} />
      </mesh>

      {/* kitchen counter along back wall */}
      <mesh position={[0.3, 0.5, -D / 2 + 0.35]} castShadow receiveShadow material={counterMat}>
        <boxGeometry args={[2.6, 0.1, 0.6]} />
      </mesh>
      <mesh position={[0.3, 0.25, -D / 2 + 0.35]} material={paintedMetal('#c7a06a', 195)}>
        <boxGeometry args={[2.6, 0.5, 0.55]} />
      </mesh>

      {/* Hob on counter */}
      <group position={[0.3, 0.1, -D / 2 + 0.35]} scale={0.85}>
        <GasHob />
      </group>

      {/* Water heater on left wall */}
      <WaterHeater position={[-W / 2 + 0.2, 1.6, 0.6]} rotation={Math.PI / 2} />

      {/* PNG meter on left wall near entry */}
      <group position={[-W / 2 + 0.15, 0, -0.9]} rotation={[0, Math.PI / 2, 0]}>
        <PngMeter />
      </group>

      {/* Internal gas piping: meter → up wall → across to hob + heater */}
      <Pipe from={[-W / 2 + 0.28, 1.55, -0.9]} to={[-W / 2 + 0.28, 2.2, -0.9]} radius={0.028} color="#c9a227" seed={196} />
      <PipeRun
        points={[
          [-W / 2 + 0.28, 2.2, -0.9],
          [-W / 2 + 0.28, 2.2, 0.6],
          [-W / 2 + 0.35, 2.2, 0.6],
        ]}
        radius={0.028}
        color="#c9a227"
        seed={197}
        radialSegments={8}
      />
      {/* branch down to water heater */}
      <Pipe from={[-W / 2 + 0.35, 2.2, 0.6]} to={[-W / 2 + 0.35, 2.0, 0.6]} radius={0.026} color="#c9a227" seed={198} />
      {/* branch across to hob */}
      <PipeRun
        points={[
          [-W / 2 + 0.28, 2.2, -0.9],
          [-W / 2 + 0.28, 2.2, -D / 2 + 0.5],
          [0.3, 2.2, -D / 2 + 0.5],
          [0.3, 1.0, -D / 2 + 0.5],
        ]}
        radius={0.026}
        color="#c9a227"
        seed={199}
        radialSegments={8}
      />
    </group>
  );
}
