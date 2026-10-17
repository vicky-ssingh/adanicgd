import { Pad, SkidBase, Handrail, ControlCabinet } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Valve, Gauge, Sensor } from '@/components3d/primitives/Fittings';
import { steel } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Metering SKID (spec §2.11): turbine/ultrasonic flow meter in-line with the
 * run, gas meter body, pressure/temperature instruments, valves, and a digital
 * measurement cabinet. Inlet -X, outlet +X.
 */
export function MeteringSkid(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;
  const meterMat = steel({ color: '#b9bec4', roughness: 0.38, metalness: 0.9, seed: 40 });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Pad size={[6, 3]} />
      <SkidBase width={5.2} depth={2.2} y={0.45} />

      {/* Main metering run along X at y=1.1 */}
      <Pipe from={[-3.2, 1.1, 0]} to={[-1.6, 1.1, 0]} radius={0.17} flanges seed={41} />
      <group position={[-2.4, 1.1, 0]}>
        <Valve size={0.3} color={BRAND.alert} seed={5} />
      </group>

      {/* Flow meter body (larger diameter spool) */}
      <group position={[-0.6, 1.1, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={meterMat}>
          <cylinderGeometry args={[0.3, 0.3, 1.4, 24]} />
        </mesh>
        {/* flow computer head on top */}
        <mesh position={[0, 0.5, 0]} castShadow material={meterMat}>
          <boxGeometry args={[0.34, 0.5, 0.3]} />
        </mesh>
        <mesh position={[0, 0.5, 0.16]}>
          <boxGeometry args={[0.24, 0.3, 0.02]} />
          <meshStandardMaterial
            color="#0a0f14"
            emissive={BRAND.tealCng}
            emissiveIntensity={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>
      <Pipe from={[0.1, 1.1, 0]} to={[1.6, 1.1, 0]} radius={0.17} seed={43} />

      {/* Pressure + temperature instruments */}
      <group position={[0.6, 1.55, 0]}>
        <Gauge radius={0.15} seed={44} />
      </group>
      <group position={[1.2, 1.5, 0]}>
        <Sensor color="#dfe3ea" seed={45} />
      </group>

      {/* Outlet + isolation */}
      <group position={[2.2, 1.1, 0]}>
        <Valve size={0.28} color="#2f6f8f" handwheel={false} seed={8} />
      </group>
      <Pipe from={[1.6, 1.1, 0]} to={[3.2, 1.1, 0]} radius={0.17} flanges seed={46} />

      {/* Digital metering cabinet */}
      <group position={[1.9, 0.6, -1.0]}>
        <ControlCabinet color={BRAND.primary} statusColor={BRAND.primary} seed={22} />
      </group>

      <group position={[0, 0.6, 0]}>
        <Handrail width={5.4} depth={2.4} height={1.05} seed={19} />
      </group>
    </group>
  );
}
