import { Pad, SkidBase, Vessel, Handrail, ControlCabinet } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Valve, Gauge, Sensor } from '@/components3d/primitives/Fittings';
import { BRAND } from '@/theme/tokens';

/**
 * Filtration SKID (spec §2.10): filter vessels, interconnecting pipes, valves,
 * gauges, inlet/outlet, structural frame + handrail, instrumentation.
 * Local footprint ~6 x 4; inlet at -X, outlet at +X (world Y up).
 */
export function FiltrationSkid(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Pad size={[6, 4]} />
      <SkidBase width={5.2} depth={3.2} y={0.45} />

      {/* Two horizontal filter vessels */}
      {[-0.9, 0.9].map((z, i) => (
        <group key={i} position={[0, 1.5, z]}>
          <Vessel radius={0.62} length={3.8} color="#cdd2d6" seed={14 + i} />
          {/* top nozzle + flange */}
          <Pipe from={[0, 0.6, 0]} to={[0, 1.15, 0]} radius={0.12} flanges seed={20 + i} />
          <group position={[0, 1.2, 0]}>
            <Gauge radius={0.13} seed={30 + i} />
          </group>
        </group>
      ))}

      {/* Interconnecting header pipe between vessels */}
      <Pipe from={[1.9, 1.5, -0.9]} to={[1.9, 1.5, 0.9]} radius={0.14} seed={22} />

      {/* Inlet run (-X) with isolation valve */}
      <Pipe from={[-3.4, 1.0, -0.9]} to={[-1.9, 1.0, -0.9]} radius={0.16} flanges seed={24} />
      <group position={[-2.65, 1.0, -0.9]}>
        <Valve size={0.28} color={BRAND.alert} seed={5} />
      </group>
      <Pipe from={[-1.9, 1.0, -0.9]} to={[-1.9, 1.5, -0.9]} radius={0.14} seed={25} />

      {/* Outlet run (+X) with control valve */}
      <Pipe from={[1.9, 1.5, 0.9]} to={[1.9, 1.0, 0.9]} radius={0.14} seed={26} />
      <group position={[2.65, 1.0, 0.9]}>
        <Valve size={0.28} color="#2f6f8f" handwheel={false} seed={8} />
      </group>
      <Pipe from={[1.9, 1.0, 0.9]} to={[3.4, 1.0, 0.9]} radius={0.16} flanges seed={27} />

      {/* Instrumentation */}
      <group position={[-1.4, 1.9, 0.9]}>
        <Sensor seed={9} />
      </group>

      {/* Control cabinet + platform rail */}
      <group position={[2.4, 0.6, -1.4]}>
        <ControlCabinet color={BRAND.primary} statusColor={BRAND.tealCng} seed={20} />
      </group>
      <group position={[0, 0.6, 0]}>
        <Handrail width={5.4} depth={3.4} height={1.05} seed={18} />
      </group>
    </group>
  );
}
