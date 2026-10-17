import { useMemo } from 'react';
import * as THREE from 'three';
import { FiltrationSkid } from './FiltrationSkid';
import { MeteringSkid } from './MeteringSkid';
import { PrsSkid } from './PrsSkid';
import { OdorizationUnit } from './OdorizationUnit';
import { GasChromatograph } from './GasChromatograph';
import { Selectable } from '@/components3d/Selectable';
import { LogoDecal } from '@/components3d/branding/Branding';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Column } from '@/components3d/primitives/Structure';
import { concrete, paintedMetal, steel, glass, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * City Gate / Receiving Station (spec §2.9). Composes the Filtration, Metering
 * and PRS skids on a fenced gravel site with an inlet header from the
 * transmission pipeline, interconnecting process piping, an outlet header to the
 * primary distribution network, a control room, a vent stack, and Adani signage.
 * Local footprint ≈ 30 x 20, centred on origin. Inlet -X, outlet +X.
 */
export function CityGateStation(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;

  const gravelMat = useMemo(() => concrete('#8f8b81', 90), []);
  const fenceMat = useMemo(() => steel({ color: '#8a9099', roughness: 0.6, metalness: 0.7, seed: 91 }), []);
  const roomMat = useMemo(() => paintedMetal('#e7e3d8', 92), []);
  const roofMat = useMemo(() => paintedMetal(BRAND.primary, 93), []);
  const signMat = useMemo(() => paintedMetal(BRAND.navy, 94), []);

  const W = 30;
  const D = 20;

  // Perimeter fence posts + rails
  const fence = useMemo(() => {
    const posts: [number, number, number][] = [];
    const step = 3;
    for (let x = -W / 2; x <= W / 2; x += step) {
      posts.push([x, 0, -D / 2]);
      posts.push([x, 0, D / 2]);
    }
    for (let z = -D / 2 + step; z < D / 2; z += step) {
      posts.push([-W / 2, 0, z]);
      posts.push([W / 2, 0, z]);
    }
    return posts;
  }, []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Gravel site pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow material={gravelMat}>
        <planeGeometry args={[W, D]} />
      </mesh>

      {/* Fence posts + top rail (chain-link implied) */}
      {fence.map((p, i) => (
        <mesh key={i} position={[p[0], 0.9, p[2]]} castShadow material={fenceMat}>
          <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
        </mesh>
      ))}
      {/* fence mesh panels as thin translucent planes */}
      {[
        { pos: [0, 0.9, -D / 2], size: [W, 1.7] as [number, number], rot: 0 },
        { pos: [0, 0.9, D / 2], size: [W, 1.7] as [number, number], rot: 0 },
        { pos: [-W / 2, 0.9, 0], size: [D, 1.7] as [number, number], rot: Math.PI / 2 },
        { pos: [W / 2, 0.9, 0], size: [D, 1.7] as [number, number], rot: Math.PI / 2 },
      ].map((f, i) => (
        <mesh key={i} position={f.pos as [number, number, number]} rotation={[0, f.rot, 0]}>
          <planeGeometry args={f.size} />
          <meshStandardMaterial
            color="#b8bec4"
            roughness={0.8}
            metalness={0.3}
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Process skids in a row: filtration → metering → PRS (each selectable) */}
      <Selectable id="filtration" position={[-9, 0, 1.5]} radius={3.6}>
        <FiltrationSkid />
      </Selectable>
      <Selectable id="metering" position={[0, 0, 1.5]} radius={3.4}>
        <MeteringSkid />
      </Selectable>
      <Selectable id="prs" position={[9, 0, 1.5]} radius={3.8}>
        <PrsSkid />
      </Selectable>

      {/* Inlet header from transmission (-X) into filtration inlet */}
      <Pipe from={[-15, 1.0, 0.6]} to={[-12.4, 1.0, 0.6]} radius={0.26} flanges color="#8a9199" seed={95} />
      <Pipe from={[-12.4, 1.0, 0.6]} to={[-12.4, 1.0, 0.6]} radius={0.26} seed={96} />
      {/* Filtration → Metering */}
      <Pipe from={[-5.6, 1.0, 2.4]} to={[-3.2, 1.1, 1.5]} radius={0.18} seed={97} />
      {/* Metering → PRS */}
      <Pipe from={[3.2, 1.1, 1.5]} to={[5.8, 1.1, 1.5]} radius={0.18} seed={98} />
      {/* PRS outlet header to distribution (+X) */}
      <Pipe from={[12.2, 1.1, 1.5]} to={[15, 1.1, 1.5]} radius={0.2} flanges seed={99} />

      {/* Odorization unit (Section 06) — after PRS, taps the outlet header */}
      <OdorizationUnit position={[11, 0, -3]} />

      {/* Gas chromatograph + sample line from the metering skid (2D reference) */}
      <GasChromatograph />

      {/* Vent / relief stack */}
      <group position={[6, 0, -7]}>
        <Column radius={0.18} height={7} color="#c7ccd1" seed={100} />
        <mesh position={[0, 7.1, 0]} material={emissive(BRAND.alert, 0.6)}>
          <cylinderGeometry args={[0.22, 0.18, 0.3, 12]} />
        </mesh>
      </group>

      {/* Control room (selects the whole City Gate Station) */}
      <Selectable id="citygate" position={[-10, 0, -6]} radius={4.5}>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow material={roomMat}>
          <boxGeometry args={[6, 2.8, 4]} />
        </mesh>
        <mesh position={[0, 2.9, 0]} castShadow material={roofMat}>
          <boxGeometry args={[6.3, 0.2, 4.3]} />
        </mesh>
        {/* windows */}
        <mesh position={[0, 1.5, 2.01]} material={glass('#9fc4d8')}>
          <boxGeometry args={[4.5, 1.1, 0.05]} />
        </mesh>
        <mesh position={[2, 1.0, 2.02]} material={paintedMetal(BRAND.primary, 101)}>
          <boxGeometry args={[1.0, 2.0, 0.06]} />
        </mesh>
        {/* Adani logo sign panel on control-room wall (spec §2) */}
        <mesh position={[-1.5, 2.35, 2.02]}>
          <planeGeometry args={[2.7, 0.7]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <LogoDecal position={[-1.5, 2.35, 2.04]} width={2.2} backing={false} />
      </group>
      </Selectable>

      {/* Signage gantry */}
      <group position={[0, 0, -D / 2 + 0.6]}>
        <mesh position={[-4, 1.6, 0]} castShadow material={signMat}>
          <boxGeometry args={[0.2, 3.2, 0.2]} />
        </mesh>
        <mesh position={[4, 1.6, 0]} castShadow material={signMat}>
          <boxGeometry args={[0.2, 3.2, 0.2]} />
        </mesh>
        <mesh position={[0, 3.0, 0]} castShadow material={signMat}>
          <boxGeometry args={[8.6, 1.1, 0.15]} />
        </mesh>
        {/* Adani brand block on the sign (placeholder lockup) */}
        <mesh position={[-3.4, 3.0, 0.09]} material={emissive(BRAND.primary, 0.5)}>
          <boxGeometry args={[0.9, 0.9, 0.04]} />
        </mesh>
        <mesh position={[0.6, 3.0, 0.09]}>
          <boxGeometry args={[5.5, 0.5, 0.03]} />
          <meshStandardMaterial color="#eef2f6" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
