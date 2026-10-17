import { useMemo } from 'react';
import { Compressor } from './Compressor';
import { MotherPartPicker } from './MotherPartPicker';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Gauge, Valve } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane } from '@/components3d/branding/Branding';
import { useSimStore } from '@/state/useSimStore';

/**
 * Section 02 §5 — Compressor Hall. Three large compressor packages in a row
 * (Units 01/02 running, Unit 03 on standby; Unit 03 starts up under the High
 * Demand scenario). A common discharge header runs along the back with tees,
 * isolation + check valves and gauges; an overhead maintenance crane rail spans
 * the row with a trolley hoist; an acoustic barrier wall faces the public side.
 * Local origin centred on the row; units spaced along X.
 */
export function CompressorHall() {
  const railMat = useMemo(() => steel({ color: '#5b6068', roughness: 0.55, metalness: 0.85, seed: 520 }), []);
  const acousticMat = useMemo(() => paintedMetal('#b9bcc0', 521), []);
  const headerColor = '#c98f6b';

  const playing = useSimStore((s) => s.playing);
  const feedAlive = useSimStore((s) => (s.values['prs']?.status ?? 'online') !== 'offline');
  const highDemand = useSimStore((s) => s.scenario === 'high-demand');
  const live = playing && feedAlive;

  const unitX = [-6, 0, 6];
  const S = 1.18; // scale-up vs the Online Station compressor
  const units = [
    { label: 'CNG COMPRESSOR — UNIT 01', running: live, standby: false },
    { label: 'CNG COMPRESSOR — UNIT 02', running: live, standby: false },
    { label: 'CNG COMPRESSOR — UNIT 03', running: live && highDemand, standby: !highDemand },
  ];

  return (
    <group>
      {units.map((u, i) => (
        <MotherPartPicker key={i} part="compressor">
          <group position={[unitX[i], 0, 0]} scale={S}>
            <Compressor running={u.running} standby={u.standby} label={u.label} />
          </group>
        </MotherPartPicker>
      ))}

      {/* common discharge header along the back (+Z) with tees/valves/gauges */}
      <Pipe from={[-8.2, 1.4, 2.2]} to={[8.2, 1.4, 2.2]} radius={0.12} color={headerColor} seed={522} />
      {unitX.map((x, i) => (
        <group key={i}>
          <Pipe from={[x + 2.8, 1.1, 1.6]} to={[x + 2.8, 1.4, 2.2]} radius={0.07} color={headerColor} seed={523 + i} />
          <group position={[x + 2.8, 1.7, 2.2]} rotation={[Math.PI / 2, 0, 0]} scale={0.5}>
            <Gauge radius={0.12} seed={526 + i} />
          </group>
          <group position={[x + 2.8, 1.4, 1.9]} scale={0.3}>
            <Valve size={0.3} color={BRAND.primary} handwheel seed={529 + i} />
          </group>
        </group>
      ))}

      {/* overhead maintenance crane rail + trolley hoist */}
      {([-8, 8] as const).map((x) =>
        ([-1.5, 3.2] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, 2.4, z]} castShadow material={railMat}>
            <boxGeometry args={[0.2, 4.8, 0.2]} />
          </mesh>
        )),
      )}
      {([-1.5, 3.2] as const).map((z, i) => (
        <mesh key={i} position={[0, 4.85, z]} castShadow material={railMat}>
          <boxGeometry args={[16.4, 0.24, 0.24]} />
        </mesh>
      ))}
      {/* runway beam + trolley hoist */}
      <mesh position={[0, 4.7, 0.85]} castShadow material={railMat}>
        <boxGeometry args={[16.4, 0.2, 0.2]} />
      </mesh>
      <group position={[-2, 4.4, 0.85]}>
        <mesh material={paintedMetal('#e6b422', 530)}>
          <boxGeometry args={[0.8, 0.5, 0.6]} />
        </mesh>
        <mesh position={[0, -0.6, 0]} material={railMat}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        </mesh>
        <mesh position={[0, -1.0, 0]} material={railMat}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
        </mesh>
      </group>

      {/* acoustic barrier wall on the public side (−Z) */}
      <group position={[0, 0, -2.6]}>
        <mesh position={[0, 1.75, 0]} castShadow receiveShadow material={acousticMat}>
          <boxGeometry args={[18, 3.5, 0.25]} />
        </mesh>
        {/* panel segmentation */}
        {Array.from({ length: 11 }).map((_, i) => (
          <mesh key={i} position={[-8.2 + i * 1.6, 1.75, -0.14]} material={steel({ color: '#8f959b', seed: 531 })}>
            <boxGeometry args={[0.05, 3.3, 0.03]} />
          </mesh>
        ))}
        <SignPlane text="ACOUSTIC BARRIER" width={2.4} position={[0, 3.1, 0.14]} options={{ fg: '#3a4048', fontWeight: 700, letterSpacing: 2 }} />
      </group>

      {/* run/standby status labels above each unit */}
      {units.map((u, i) => (
        <SignPlane
          key={i}
          text={u.running ? 'RUNNING' : 'STANDBY'}
          width={1.2}
          position={[unitX[i], 3.6, 1.6]}
          options={{ fg: '#ffffff', bg: u.running ? BRAND.tealCng : '#e0a23c', fontWeight: 800, radius: 6, paddingX: 22 }}
        />
      ))}
    </group>
  );
}
