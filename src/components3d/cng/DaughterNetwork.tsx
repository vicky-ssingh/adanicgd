import { useFrame } from '@react-three/fiber';
import { DaughterStation } from './DaughterStation';
import { BoosterStation } from './BoosterStation';
import { useSimStore } from '@/state/useSimStore';
import { useDaughterStore } from '@/state/useDaughterStore';

/** Advances both stations' cascade-depletion model, gated by the global sim. */
function DaughterRunner() {
  useFrame((_, delta) => {
    const sim = useSimStore.getState();
    if (!sim.playing) return;
    useDaughterStore.getState().tick(Math.min(delta, 0.05) * sim.speed);
  });
  return null;
}

/**
 * Section 04 placement. Two pipeline-free, cascade-fed stations on their own
 * aprons at opposite edges of the city: the Daughter Station (east, suburban —
 * declining fill) and the Daughter Booster Station (west, arterial — constant
 * 200 Bar). Both are DESTINATIONS of the Section-03 trailer cycle; they add no
 * pipeline node/edge (verifiably no pipeline reaches them).
 */
export function DaughterNetwork() {
  return (
    <group>
      <DaughterRunner />
      <DaughterStation position={[130, 0, 40]} rotation={0} />
      <BoosterStation position={[-150, 0, 20]} rotation={0} />
    </group>
  );
}
