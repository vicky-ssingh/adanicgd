import { useFrame } from '@react-three/fiber';
import { MotherSiteworks } from './MotherSiteworks';
import { CompressorHall } from './CompressorHall';
import { HpCascade } from './HpCascade';
import { HpFiltrationSkid } from './HpFiltrationSkid';
import { MeteringSkid } from './MeteringSkid';
import { FillingBay } from './FillingBay';
import { PriorityPanel } from './PriorityPanel';
import { motherSource } from '@/state/cascadeSources';
import { Canopy } from './Canopy';
import { Dispenser } from './Dispenser';
import { MotherFlow } from './MotherFlow';
import { MotherPartPicker } from './MotherPartPicker';
import { useSimStore } from '@/state/useSimStore';
import { useMotherStore } from '@/state/useMotherStore';
import { MotherFillLine } from './MassFlowMeter';

/**
 * Section 02 — CNG MOTHER STATION (assembly). A large, industrial pipeline-fed
 * station whose defining feature is the cascade-trailer filling bay. Three zones
 * separated by barriers: trailer filling (left), process (compressors + HP
 * cascade + skids, back/centre) and public retail (canopy + dispensers, right).
 * Each major component is clickable; the trailer fill + compressor duty/standby
 * animate from the live sim. Local origin at plot centre; the outer <Selectable>
 * (in MotherNetwork) places it in the world.
 */

/** Advances the trailer-fill sequence, gated by the live sim. */
function MotherRunner() {
  useFrame((_, delta) => {
    const sim = useSimStore.getState();
    const feedAlive = (sim.values['prs']?.status ?? 'online') !== 'offline';
    if (!sim.playing || !feedAlive) return;
    useMotherStore.getState().tick(Math.min(delta, 0.05) * sim.speed);
  });
  return null;
}

export function MotherStation(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <MotherSiteworks width={90} depth={72} />

      {/* Process zone */}
      <MotherPartPicker part="hp-filter">
        <group position={[-30, 0, -12]}>
          <HpFiltrationSkid />
        </group>
      </MotherPartPicker>
      <MotherPartPicker part="metering">
        <group position={[-18, 0, -16]}>
          <MeteringSkid />
        </group>
      </MotherPartPicker>
      <group position={[-2, 0, -8]}>
        <CompressorHall />
      </group>
      <MotherPartPicker part="hp-cascade">
        <group position={[22, 0, -6]}>
          <HpCascade />
        </group>
      </MotherPartPicker>
      <MotherPartPicker part="filling-panel">
        <group position={[6, 0, -16]}>
          <PriorityPanel source={motherSource()} />
        </group>
      </MotherPartPicker>

      {/* Trailer filling zone (the defining feature) */}
      <group position={[-14, 0, 12]}>
        <FillingBay />
      </group>

      {/* Public retail zone */}
      <MotherPartPicker part="station">
        <group position={[26, 0, 20]}>
          <Canopy width={10} depth={7} height={5.2} />
        </group>
      </MotherPartPicker>
      <MotherPartPicker part="dispenser">
        <group>
          <Dispenser position={[24, 0, 20]} rotation={Math.PI / 2} />
          <Dispenser position={[28, 0, 20]} rotation={Math.PI / 2} />
        </group>
      </MotherPartPicker>

      {/* HP fill line with Coriolis mass-flow meter (2D reference) */}
      <MotherFillLine />

      <MotherFlow />
      <MotherRunner />
    </group>
  );
}
