import { useMemo } from 'react';
import { Selectable } from '@/components3d/Selectable';
import { SignPlane } from '@/components3d/branding/Branding';
import { Gauge, Sensor } from '@/components3d/primitives/Fittings';
import { concrete, steel, paintedMetal, glass } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Custody Transfer Meter (2D reference: "NG supply · Custody transfer"). Sits on
 * the elevated transmission line (y 2.2, along X) between the supply tie-in and
 * the City Gate inlet valve: flow-conditioner spool → ultrasonic meter body with
 * transducer pods → downstream spool, pressure / temperature transmitters, a
 * flow-computer cabinet under a sunshade, and a fenced pad. The pipe itself is
 * drawn by PipelineNetwork; this wraps it. Selectable → node 'ctm'.
 */
const X = 130;
const Z = -90;
const Y = 2.2;

export function CustodyTransferMeter() {
  const padMat = useMemo(() => concrete('#a6a297', 1800), []);
  const meterMat = useMemo(() => paintedMetal('#2f6f9f', 1801), []);
  const spoolMat = useMemo(() => steel({ color: '#8a9099', seed: 1802 }), []);
  const flangeMat = useMemo(() => steel({ color: '#6f767d', roughness: 0.5, seed: 1803 }), []);
  const podMat = useMemo(() => paintedMetal('#d9d4c5', 1804), []);
  const cabMat = useMemo(() => paintedMetal('#e4e1d8', 1805), []);
  const roofMat = useMemo(() => paintedMetal(BRAND.primary, 1806), []);
  const fenceMat = useMemo(() => steel({ color: '#8a9099', roughness: 0.6, metalness: 0.7, seed: 1807 }), []);
  const screenMat = useMemo(() => glass('#1d3b52', 0.4), []);

  return (
    <Selectable id="ctm" position={[X, 0, Z]} radius={4.2}>
      <group>
        {/* pad + low fence */}
        <mesh position={[0, 0.08, 0]} receiveShadow material={padMat}>
          <boxGeometry args={[10, 0.16, 5.6]} />
        </mesh>
        {[-5, -2.5, 0, 2.5, 5].flatMap((x) => [-2.8, 2.8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.75, z]} castShadow material={fenceMat}>
            <cylinderGeometry args={[0.04, 0.04, 1.3, 6]} />
          </mesh>
        )))}
        {[-2.8, 2.8].map((z) => (
          <mesh key={z} position={[0, 1.35, z]} material={fenceMat}>
            <boxGeometry args={[10, 0.04, 0.04]} />
          </mesh>
        ))}

        {/* meter run around the transmission pipe (local X = pipe axis) */}
        <group position={[0, Y, 0]}>
          {/* flow conditioner spool + ultrasonic body + downstream spool */}
          <mesh position={[-2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={spoolMat}>
            <cylinderGeometry args={[0.4, 0.4, 2.0, 20]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={meterMat}>
            <cylinderGeometry args={[0.52, 0.52, 1.5, 24]} />
          </mesh>
          <mesh position={[1.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={spoolMat}>
            <cylinderGeometry args={[0.4, 0.4, 1.6, 20]} />
          </mesh>
          {[-3.2, -1.2, -0.75, 0.75, 1.1, 2.7].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={flangeMat}>
              <cylinderGeometry args={[0.58, 0.58, 0.12, 20]} />
            </mesh>
          ))}
          {/* 4 transducer pods (two chordal paths, crossed) */}
          {[
            [-0.35, 0.45, 0.25], [0.35, 0.45, -0.25], [-0.35, -0.1, 0.5], [0.35, -0.1, -0.5],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow material={podMat}>
              <boxGeometry args={[0.18, 0.18, 0.18]} />
            </mesh>
          ))}
          {/* electronics head */}
          <mesh position={[0, 0.78, 0]} castShadow material={podMat}>
            <boxGeometry args={[0.5, 0.36, 0.34]} />
          </mesh>
          {/* PT / TT transmitters + gauge on the downstream spool */}
          <group position={[1.6, 0.62, 0]}><Sensor seed={1810} /></group>
          <group position={[2.2, 0.62, 0]}><Sensor color="#c9d6df" seed={1811} /></group>
          <group position={[-2.4, 0.62, 0]}><Gauge seed={1812} /></group>
        </group>

        {/* flow computer cabinet under a sunshade */}
        <group position={[0, 0, -2.0]}>
          <mesh position={[0, 0.95, 0]} castShadow receiveShadow material={cabMat}>
            <boxGeometry args={[1.3, 1.6, 0.6]} />
          </mesh>
          <mesh position={[0, 1.25, 0.31]} material={screenMat}>
            <boxGeometry args={[0.6, 0.35, 0.02]} />
          </mesh>
          {[-0.75, 0.75].map((x) => (
            <mesh key={x} position={[x, 1.25, 0.35]} castShadow material={fenceMat}>
              <cylinderGeometry args={[0.04, 0.04, 2.5, 6]} />
            </mesh>
          ))}
          <mesh position={[0, 2.5, 0.35]} castShadow material={roofMat}>
            <boxGeometry args={[1.9, 0.08, 1.2]} />
          </mesh>
          {/* conduit up to the meter head */}
          <mesh position={[0, 2.35, 1.0]} rotation={[Math.PI / 2, 0, 0]} material={flangeMat}>
            <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
          </mesh>
        </group>

        <SignPlane
          text="CUSTODY TRANSFER METER · CTM-01"
          width={4.2}
          position={[0, 1.0, 2.82]}
          options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, letterSpacing: 1 }}
          doubleSide
        />
      </group>
    </Selectable>
  );
}
