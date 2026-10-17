import { useMemo } from 'react';
import * as THREE from 'three';
import { steel, paintedMetal } from '@/materials/materials';
import { Gauge } from '@/components3d/primitives/Fittings';
import { BRAND } from '@/theme/tokens';
import { SignPlane } from '@/components3d/branding/Branding';

/**
 * Wall-mounted PNG meter set (spec §2.20 / §2.21): service isolation valve,
 * regulator, diaphragm meter body with index dial, and inlet/outlet risers on a
 * bracket. Mounts on a building wall; faces +Z by default. `scale` up for
 * commercial/industrial consumers.
 */
export function PngMeter({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const meterMat = useMemo(() => paintedMetal('#e7e2d4', 170), []);
  const pipeMat = useMemo(() => steel({ color: '#c9a227', roughness: 0.5, metalness: 0.6, seed: 171 }), []); // yellow gas pipe
  const regMat = useMemo(() => paintedMetal('#5a6b52', 172), []);
  const valveMat = useMemo(() => paintedMetal(BRAND.alert, 173), []);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* mounting bracket */}
      <mesh position={[0, 1.1, -0.06]} material={steel({ color: '#8a9199', seed: 174 })}>
        <boxGeometry args={[0.5, 0.7, 0.04]} />
      </mesh>

      {/* meter body — light grey with blue Adani accent (addon §5) */}
      <mesh position={[0, 1.15, 0.12]} castShadow material={meterMat}>
        <boxGeometry args={[0.4, 0.42, 0.24]} />
      </mesh>
      <mesh position={[0, 1.31, 0.245]} material={paintedMetal(BRAND.primary, 177)}>
        <boxGeometry args={[0.4, 0.07, 0.01]} />
      </mesh>
      {/* branded label sticker */}
      <SignPlane
        text="ADANI TOTAL GAS  ·  PNG"
        width={0.38}
        position={[0, 0.99, 0.246]}
        options={{ fg: BRAND.primary, bg: '#f4f1e8', fontWeight: 800, radius: 6, paddingX: 20, paddingY: 14, letterSpacing: 1 }}
      />
      {/* index dial */}
      <group position={[0, 1.2, 0.25]} scale={0.7}>
        <Gauge radius={0.12} seed={175} />
      </group>
      {/* service-line danger tag near the inlet riser */}
      <SignPlane
        text="ADANI GAS — DO NOT TAMPER"
        width={0.5}
        position={[-0.18, 0.62, 0.19]}
        options={{ fg: '#7a1020', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 16, paddingY: 12 }}
      />

      {/* regulator on inlet */}
      <mesh position={[-0.18, 0.85, 0.14]} castShadow material={regMat}>
        <cylinderGeometry args={[0.09, 0.09, 0.18, 12]} />
      </mesh>
      <mesh position={[-0.18, 0.95, 0.14]} castShadow material={regMat}>
        <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* inlet riser (from ground) + service valve */}
      <mesh position={[-0.18, 0.4, 0.14]} castShadow material={pipeMat}>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 8]} />
      </mesh>
      <mesh position={[-0.18, 0.5, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow material={valveMat}>
        <boxGeometry args={[0.1, 0.1, 0.12]} />
      </mesh>

      {/* outlet riser into wall */}
      <mesh position={[0.18, 1.3, 0.12]} castShadow material={pipeMat}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
      </mesh>
      <mesh position={[0.18, 1.55, 0.0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={pipeMat}>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
      </mesh>
    </group>
  );
}

/** Small yellow MDPE→steel service riser emerging from the ground. */
export function ServiceRiser({
  position = [0, 0, 0],
  height = 0.9,
}: {
  position?: [number, number, number];
  height?: number;
}) {
  const pipeMat = useMemo(() => steel({ color: '#c9a227', roughness: 0.5, metalness: 0.6, seed: 176 }), []);
  const sleeveMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9c24a', roughness: 0.7 }), []);
  return (
    <group position={position}>
      {/* buried→riser transition sleeve */}
      <mesh position={[0, 0.12, 0]} material={sleeveMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.24, 8]} />
      </mesh>
      <mesh position={[0, height / 2 + 0.2, 0]} castShadow material={pipeMat}>
        <cylinderGeometry args={[0.035, 0.035, height, 8]} />
      </mesh>
    </group>
  );
}
