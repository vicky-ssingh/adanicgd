import { Pad, SkidBase, Handrail, ControlCabinet } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Valve, Gauge, Sensor } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Pressure Regulating Station / PRS SKID (spec §2.12): high-pressure inlet →
 * regulator + monitor stream → lower-pressure outlet, with slam-shut safety
 * valve, relief, gauges and instrumentation. Twin-stream (run + standby).
 * Inlet -X (HP), outlet +X (LP).
 */
export function PrsSkid(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;
  const regMat = steel({ color: '#9aa1a8', roughness: 0.4, metalness: 0.9, seed: 50 });
  const domeMat = paintedMetal(BRAND.accent, 52);

  const stream = (z: number, key: number) => (
    <group key={key} position={[0, 0, z]}>
      {/* HP inlet spool + isolation */}
      <Pipe from={[-3.2, 1.1, 0]} to={[-1.9, 1.1, 0]} radius={0.15} flanges seed={53 + key} />
      <group position={[-2.5, 1.1, 0]}>
        <Valve size={0.26} color={BRAND.alert} seed={5 + key} />
      </group>

      {/* Slam-shut / regulator body with spring dome on top */}
      <group position={[-1.2, 1.1, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={regMat}>
          <cylinderGeometry args={[0.34, 0.34, 0.9, 20]} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow material={domeMat}>
          <sphereGeometry args={[0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow material={regMat}>
          <cylinderGeometry args={[0.06, 0.06, 0.25, 8]} />
        </mesh>
      </group>

      {/* Active regulator */}
      <group position={[0.2, 1.1, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={regMat}>
          <cylinderGeometry args={[0.32, 0.32, 0.8, 20]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow material={domeMat}>
          <sphereGeometry args={[0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      <Pipe from={[-1.9, 1.1, 0]} to={[1.9, 1.1, 0]} radius={0.15} seed={55 + key} />

      {/* LP outlet + control valve */}
      <group position={[2.4, 1.1, 0]}>
        <Valve size={0.24} color="#2f6f8f" handwheel={false} seed={8 + key} />
      </group>
      <Pipe from={[1.9, 1.1, 0]} to={[3.2, 1.1, 0]} radius={0.16} flanges seed={57 + key} />

      {/* Gauges */}
      <group position={[-2.0, 1.55, 0]}>
        <Gauge radius={0.13} seed={60 + key} />
      </group>
      <group position={[1.6, 1.55, 0]}>
        <Gauge radius={0.13} seed={62 + key} />
      </group>
    </group>
  );

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Pad size={[6.5, 4.5]} />
      <SkidBase width={5.6} depth={3.6} y={0.45} />

      {stream(-1.0, 0)}
      {stream(1.0, 1)}

      {/* Relief riser (vents up) */}
      <Pipe from={[0.6, 1.3, 1.6]} to={[0.6, 3.4, 1.6]} radius={0.1} seed={70} />
      <Pipe from={[0.6, 3.4, 1.6]} to={[1.1, 3.4, 1.6]} radius={0.1} seed={71} />

      {/* Instrument transmitter */}
      <group position={[-0.6, 1.9, 1.7]}>
        <Sensor seed={72} />
      </group>

      {/* Station control cabinet */}
      <group position={[2.7, 0.6, -1.9]}>
        <ControlCabinet color={BRAND.primary} statusColor={BRAND.tealCng} seed={24} />
      </group>

      <group position={[0, 0.6, 0]}>
        <Handrail width={5.8} depth={3.8} height={1.05} seed={17} />
      </group>
    </group>
  );
}
