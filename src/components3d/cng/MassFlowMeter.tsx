import { useMemo } from 'react';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Selectable } from '@/components3d/Selectable';
import { SignPlane } from '@/components3d/branding/Branding';
import { concrete, steel, paintedMetal, glass } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Coriolis mass-flow meter (2D reference: "Mass Flow Meter — Cascade Filling").
 * Flow runs along local X: inlet / outlet flanges, a splitter manifold, twin
 * bent measuring tubes inside a stainless case below the line, and a
 * transmitter head with a display on top. Sits on two pipe supports. Origin at
 * ground below the meter centre; `lineY` is the pipe centreline height.
 */
export function MassFlowMeter({ lineY = 0.9 }: { lineY?: number }) {
  const caseMat = useMemo(() => steel({ color: '#c3c8cd', roughness: 0.3, metalness: 0.9, seed: 1880 }), []);
  const flangeMat = useMemo(() => steel({ color: '#7d848b', roughness: 0.5, seed: 1881 }), []);
  const headMat = useMemo(() => paintedMetal('#2f6f9f', 1882), []);
  const padMat = useMemo(() => concrete('#a8a49a', 1883), []);
  const lcdMat = useMemo(() => glass('#1d3b52', 0.4), []);

  return (
    <group>
      {/* pipe supports */}
      {[-0.75, 0.75].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.1, 0]} receiveShadow material={padMat}>
            <boxGeometry args={[0.36, 0.2, 0.36]} />
          </mesh>
          <mesh position={[0, (lineY - 0.1) / 2 + 0.1, 0]} material={flangeMat}>
            <boxGeometry args={[0.08, lineY - 0.2, 0.08]} />
          </mesh>
        </group>
      ))}
      <group position={[0, lineY, 0]}>
        {/* process flanges + splitter manifold */}
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={flangeMat}>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 16]} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={caseMat}>
          <cylinderGeometry args={[0.07, 0.07, 1.0, 12]} />
        </mesh>
        {/* twin bent measuring tubes inside a case hanging below the line */}
        <mesh position={[0, -0.32, 0]} castShadow material={caseMat}>
          <boxGeometry args={[0.7, 0.5, 0.22]} />
        </mesh>
        {[-0.05, 0.05].map((z) => (
          <mesh key={z} position={[0, -0.05, z]} rotation={[0, 0, Math.PI]} material={caseMat}>
            <torusGeometry args={[0.3, 0.025, 8, 20, Math.PI]} />
          </mesh>
        ))}
        {/* transmitter head + display */}
        <mesh position={[0, 0.2, 0]} material={flangeMat}>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow material={headMat}>
          <cylinderGeometry args={[0.14, 0.14, 0.18, 18]} />
        </mesh>
        <mesh position={[0, 0.38, 0.141]} rotation={[0, 0, 0]} material={lcdMat}>
          <boxGeometry args={[0.14, 0.09, 0.01]} />
        </mesh>
      </group>
      <SignPlane text="CORIOLIS MFM · FILL LINE" width={0.9} position={[0, lineY - 0.72, 0.12]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800 }} />
    </group>
  );
}

/**
 * HP trailer-fill line for the Mother Station (station-local coords): buried
 * riser from the cascade → Coriolis meter → into the back of the cascade
 * filling panel.
 */
export function MotherFillLine() {
  const Y = 0.9;
  return (
    <group>
      <Pipe from={[-0.4, 0.02, 12]} to={[-0.4, Y, 12]} radius={0.05} color="#c98f6b" seed={1885} />
      <Pipe from={[-0.4, Y, 12]} to={[-1.95, Y, 12]} radius={0.05} color="#c98f6b" seed={1886} />
      <Pipe from={[-3.05, Y, 12]} to={[-4.1, Y, 12]} radius={0.05} color="#c98f6b" seed={1887} />
      <Pipe from={[-4.1, Y, 12]} to={[-4.1, 1.4, 12]} radius={0.05} color="#c98f6b" seed={1888} />
      <Pipe from={[-4.1, 1.4, 12]} to={[-4.55, 1.4, 12]} radius={0.05} color="#c98f6b" seed={1889} />
      <Selectable id="mfm-mother" position={[-2.5, 0, 12]} radius={1.2}>
        <MassFlowMeter lineY={Y} />
      </Selectable>
    </group>
  );
}
