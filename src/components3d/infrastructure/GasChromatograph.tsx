import { useMemo } from 'react';
import { Selectable } from '@/components3d/Selectable';
import { SignPlane } from '@/components3d/branding/Branding';
import { Pipe } from '@/components3d/primitives/Pipe';
import { concrete, steel, paintedMetal, glass, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Gas Chromatograph analyser shelter (2D reference: "City Gate Station · Gas
 * quality"). Placed in City Gate LOCAL coordinates beside the metering skid:
 * a small walk-in analyser house with louvres and a status lamp, an outdoor
 * rack of carrier / calibration gas cylinders, and a stainless sample line
 * from the metering skid (its ball valve V-501 is an operable line valve).
 * Selectable → node 'gc'.
 */
export function GasChromatograph({ position = [1, 0, -5.5] as [number, number, number] }) {
  const padMat = useMemo(() => concrete('#b3afa5', 1820), []);
  const wallMat = useMemo(() => paintedMetal('#eceae3', 1821), []);
  const roofMat = useMemo(() => paintedMetal(BRAND.primary, 1822), []);
  const louvreMat = useMemo(() => steel({ color: '#9aa1a8', seed: 1823 }), []);
  const doorMat = useMemo(() => paintedMetal(BRAND.navy, 1824), []);
  const cylMat = useMemo(() => paintedMetal('#7c8a96', 1825), []);
  const calMat = useMemo(() => paintedMetal('#c8a23a', 1826), []);
  const rackMat = useMemo(() => steel({ color: '#6f767d', seed: 1827 }), []);
  const lampMat = useMemo(() => emissive('#22c55e', 1.4), []);
  const winMat = useMemo(() => glass('#9fc4d8'), []);

  return (
    <>
      <Selectable id="gc" position={position} radius={2.2}>
        <group>
          <mesh position={[0, 0.08, 0]} receiveShadow material={padMat}>
            <boxGeometry args={[3.6, 0.16, 2.6]} />
          </mesh>
          {/* analyser house: door faces local +Z (towards the skids) */}
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={wallMat}>
            <boxGeometry args={[2.4, 2.1, 1.8]} />
          </mesh>
          <mesh position={[0, 2.3, 0]} castShadow material={roofMat}>
            <boxGeometry args={[2.7, 0.12, 2.1]} />
          </mesh>
          <mesh position={[-0.5, 1.05, 0.91]} material={doorMat}>
            <boxGeometry args={[0.8, 1.8, 0.04]} />
          </mesh>
          <mesh position={[0.6, 1.5, 0.91]} material={winMat}>
            <boxGeometry args={[0.6, 0.4, 0.03]} />
          </mesh>
          {/* louvres on the side + status lamp + HVAC */}
          {[0.7, 0.9, 1.1, 1.3].map((y) => (
            <mesh key={y} position={[1.21, y, 0]} material={louvreMat}>
              <boxGeometry args={[0.03, 0.06, 1.0]} />
            </mesh>
          ))}
          <mesh position={[0.95, 2.42, 0.6]} material={lampMat}>
            <sphereGeometry args={[0.08, 10, 8]} />
          </mesh>
          <mesh position={[-1.35, 1.6, 0]} castShadow material={louvreMat}>
            <boxGeometry args={[0.3, 0.5, 0.7]} />
          </mesh>
          {/* carrier (helium) + calibration gas cylinder rack */}
          <group position={[1.65, 0, -0.3]}>
            <mesh position={[0, 0.9, -0.25]} material={rackMat}>
              <boxGeometry args={[0.08, 1.6, 0.08]} />
            </mesh>
            <mesh position={[0, 1.3, 0.2]} material={rackMat}>
              <boxGeometry args={[0.06, 0.06, 1.0]} />
            </mesh>
            {[-0.15, 0.15, 0.45].map((z, i) => (
              <group key={z} position={[0.05, 0, z]}>
                <mesh position={[0, 0.75, 0]} castShadow material={i === 2 ? calMat : cylMat}>
                  <cylinderGeometry args={[0.11, 0.11, 1.3, 14]} />
                </mesh>
                <mesh position={[0, 1.45, 0]} material={rackMat}>
                  <cylinderGeometry args={[0.04, 0.06, 0.12, 8]} />
                </mesh>
              </group>
            ))}
          </group>
          <SignPlane
            text="GAS CHROMATOGRAPH · GC-01"
            width={2.0}
            position={[0, 1.95, 0.93]}
            options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, letterSpacing: 1 }}
          />
        </group>
      </Selectable>

      {/* stainless sample line: metering skid → valve V-501 → analyser house */}
      <Pipe from={[0.4, 1.05, 0.3]} to={[0.6, 0.4, -0.6]} radius={0.03} color="#c7ccd1" seed={1830} />
      <Pipe from={[0.6, 0.4, -0.6]} to={[0.6, 0.4, -4.55]} radius={0.03} color="#c7ccd1" seed={1831} />
      <Pipe from={[0.6, 0.4, -4.55]} to={[0.6, 1.0, -4.6]} radius={0.03} color="#c7ccd1" seed={1832} />
    </>
  );
}
