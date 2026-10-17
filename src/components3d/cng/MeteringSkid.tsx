import { useMemo } from 'react';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Flange, Valve, Gauge, Sensor } from '@/components3d/primitives/Fittings';
import { steel, concrete, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane } from '@/components3d/branding/Branding';

/**
 * Section 02 §4 — Metering Skid. Custody-transfer turbine meter inline with long
 * straight pipe runs (≥10 D upstream / 5 D downstream), a flow-conditioner plate
 * at the upstream flange, index head, a flow-computer cabinet with a lit display,
 * pressure + temperature transmitters, and a bypass line with isolation valves.
 * Local origin at plinth centre; flow runs −X → +X.
 */
export function MeteringSkid() {
  const plinthMat = useMemo(() => concrete('#c8c4bc', 440), []);
  const frameMat = useMemo(() => steel({ color: '#9ba3ab', roughness: 0.5, metalness: 0.85, seed: 441 }), []);
  const meterMat = useMemo(() => steel({ color: '#b7bcc2', roughness: 0.4, metalness: 0.9, seed: 442 }), []);
  const cabMat = useMemo(() => steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 443 }), []);
  const screenMat = useMemo(() => emissive(BRAND.tealCng, 1.0), []);

  const PY = 0.9;
  const skidTop = 0.3;

  return (
    <group>
      {/* plinth */}
      <mesh position={[0, skidTop / 2, 0]} castShadow receiveShadow material={plinthMat}>
        <boxGeometry args={[4.0, skidTop, 1.8]} />
      </mesh>
      {/* frame + cross bracing */}
      {([-0.8, 0.8] as const).map((z) => (
        <mesh key={z} position={[0, skidTop + 0.05, z]} castShadow material={frameMat}>
          <boxGeometry args={[3.8, 0.1, 0.1]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.9, skidTop + 0.05, 0]} rotation={[0, s * 0.5, 0]} material={frameMat}>
          <boxGeometry args={[0.08, 0.08, 2.0]} />
        </mesh>
      ))}

      {/* long straight upstream run (−X) with flow conditioner plate */}
      <Pipe from={[-2.0, PY, 0]} to={[-0.35, PY, 0]} radius={0.13} color="#8a9099" seed={444} />
      <group position={[-0.4, PY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Flange radius={0.2} thickness={0.05} bolts={10} seed={445} />
      </group>

      {/* turbine flow meter with index head + transmitter */}
      <group position={[0, PY, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={meterMat}>
          <cylinderGeometry args={[0.175, 0.175, 0.6, 20]} />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow material={meterMat}>
          <cylinderGeometry args={[0.1, 0.12, 0.16, 12]} />
        </mesh>
        <mesh position={[0, 0.02, 0.18]} material={steel({ color: '#10161d', roughness: 0.3, seed: 446 })}>
          <boxGeometry args={[0.16, 0.1, 0.02]} />
        </mesh>
      </group>
      <group position={[0.4, PY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Flange radius={0.2} thickness={0.05} bolts={10} seed={447} />
      </group>

      {/* long straight downstream run (+X) */}
      <Pipe from={[0.35, PY, 0]} to={[1.9, PY, 0]} radius={0.13} color="#8a9099" seed={448} />

      {/* pressure + temperature transmitters */}
      <group position={[0.7, PY + 0.25, 0.12]} scale={0.8}>
        <Sensor color="#e8e2d2" seed={449} />
      </group>
      <group position={[1.1, PY + 0.22, -0.12]} rotation={[Math.PI / 2, 0, 0]} scale={0.5}>
        <Gauge radius={0.12} seed={450} />
      </group>

      {/* flow-computer cabinet with lit display + keypad */}
      <group position={[-1.4, skidTop, 0.7]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow material={cabMat}>
          <boxGeometry args={[0.8, 1.2, 0.3]} />
        </mesh>
        <mesh position={[0, 0.85, 0.16]} material={screenMat}>
          <boxGeometry args={[0.5, 0.3, 0.02]} />
        </mesh>
        <SignPlane text="FLOW COMPUTER" width={0.5} position={[0, 0.85, 0.172]} options={{ fg: '#8ef3d6', fontWeight: 800, letterSpacing: 1 }} />
        <mesh position={[0, 0.5, 0.16]} material={steel({ color: '#2a2f35', seed: 451 })}>
          <boxGeometry args={[0.4, 0.24, 0.02]} />
        </mesh>
      </group>

      {/* bypass line with isolation valves around the meter */}
      <Pipe from={[-0.8, PY - 0.55, 0]} to={[0.8, PY - 0.55, 0]} radius={0.08} color="#b0b6bd" seed={452} />
      <Pipe from={[-0.8, PY, 0]} to={[-0.8, PY - 0.55, 0]} radius={0.07} color="#b0b6bd" seed={453} />
      <Pipe from={[0.8, PY, 0]} to={[0.8, PY - 0.55, 0]} radius={0.07} color="#b0b6bd" seed={454} />
      {([-0.8, 0.8] as const).map((x, i) => (
        <group key={i} position={[x, PY - 0.55, 0]} scale={0.4}>
          <Valve size={0.3} color={BRAND.primary} handwheel seed={455 + i} />
        </group>
      ))}

      <SignPlane text="METERING SKID — DN150" width={1.0} position={[0, skidTop + 0.5, 0.91]} options={{ fg: '#16202b', bg: '#d6dade', fontWeight: 800, letterSpacing: 1 }} />
    </group>
  );
}
