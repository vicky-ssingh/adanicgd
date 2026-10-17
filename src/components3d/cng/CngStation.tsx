import { useFrame } from '@react-three/fiber';
import { Forecourt } from './Forecourt';
import { Canopy } from './Canopy';
import { Dispenser } from './Dispenser';
import { InletSkid } from './InletSkid';
import { Compressor } from './Compressor';
import { Cascade } from './Cascade';
import { PriorityPanel } from './PriorityPanel';
import { StationVehicles } from './StationVehicles';
import { StationFlow } from './StationFlow';
import { PartPicker } from './PartPicker';
import { useSimStore } from '@/state/useSimStore';
import { useStationStore } from '@/state/useStationStore';

/**
 * Section 01 — ONLINE CNG STATION (assembly). A pipeline-connected station: an
 * inlet skid receives CGD gas, a main compressor raises it to 250 Bar, a 3-bank
 * cascade buffers it, a priority panel sequences withdrawal and four dispensers
 * fuel vehicles under a lit canopy — all inside a walled forecourt split by a
 * safety barrier into a public vehicle area (−X) and a process area (+X). Each
 * major component is clickable for its own info panel and the refuel sequence,
 * compressor and cascade all animate from the live sim. Local origin at the plot
 * centre; the outer <Selectable> (in CngNetwork) places it in the world.
 */

/** Advances the station's local refuel/bank animation, gated by the live sim. */
function StationRunner() {
  useFrame((_, delta) => {
    const sim = useSimStore.getState();
    const feedAlive = (sim.values['prs']?.status ?? 'online') !== 'offline';
    if (!sim.playing || !feedAlive) return;
    useStationStore.getState().tick(Math.min(delta, 0.05) * sim.speed);
  });
  return null;
}

export function CngStation(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;
  const playing = useSimStore((s) => s.playing);
  const feedAlive = useSimStore((s) => (s.values['prs']?.status ?? 'online') !== 'offline');
  const running = playing && feedAlive;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Forecourt width={34} depth={26} />

      {/* Canopy (click = station overview panel) */}
      <PartPicker part="station">
        <group position={[-9, 0, 0]}>
          <Canopy width={14} depth={8} height={5.2} />
        </group>
      </PartPicker>

      {/* Four dispensers under the canopy (D1 is the active refuel unit) */}
      <PartPicker part="dispenser">
        <group>
          <Dispenser position={[-9, 0, -3.4]} rotation={Math.PI / 2} active />
          <Dispenser position={[-6.5, 0, -3.4]} rotation={Math.PI / 2} />
          <Dispenser position={[-9, 0, 3.4]} rotation={Math.PI / 2} />
          <Dispenser position={[-6.5, 0, 3.4]} rotation={Math.PI / 2} />
        </group>
      </PartPicker>

      {/* Process equipment (+X), behind the safety barrier */}
      <PartPicker part="inlet">
        <group position={[13, 0, -4.5]}>
          <InletSkid />
        </group>
      </PartPicker>
      <PartPicker part="compressor">
        <group position={[6.5, 0, -4.5]}>
          <Compressor running={running} />
        </group>
      </PartPicker>
      <PartPicker part="cascade">
        <group position={[11, 0, 4]}>
          <Cascade />
        </group>
      </PartPicker>
      <PartPicker part="priority">
        <group position={[6.5, 0, 4]}>
          <PriorityPanel />
        </group>
      </PartPicker>

      <StationVehicles />
      <StationFlow />
      <StationRunner />
    </group>
  );
}
