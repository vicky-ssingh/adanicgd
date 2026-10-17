import { create } from 'zustand';
import { computeTick, type Aggregates } from '@/simulation/engine';
import type { ScenarioId } from '@/config/scenarios';
import type { LiveValue } from '@/types/network';
import { useValveStore, isolatedNodes } from '@/state/useValveStore';

/**
 * Simulation store (spec §2.26 / §2.27). Holds play/pause/speed/scenario and the
 * latest live values + aggregates. The headless <SimulationRunner> advances it
 * from the render loop; UI and 3D read from it reactively.
 */
interface SimState {
  playing: boolean;
  speed: number;
  scenario: ScenarioId;
  elapsed: number;
  values: Record<string, LiveValue>;
  aggregates: Aggregates;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  reset: () => void;
  setSpeed: (s: number) => void;
  setScenario: (s: ScenarioId) => void;
  /** Advance the simulation by dt real seconds (called by the runner). */
  advance: (dt: number) => void;
}

const initial = computeTick(0, 'normal');

export const useSimStore = create<SimState>((set, get) => ({
  playing: true,
  speed: 1,
  scenario: 'normal',
  elapsed: 0,
  values: initial.values,
  aggregates: initial.aggregates,

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  reset: () => {
    const snap = computeTick(0, get().scenario, isolatedNodes());
    set({ elapsed: 0, values: snap.values, aggregates: snap.aggregates });
  },
  setSpeed: (speed) => set({ speed }),
  setScenario: (scenario) => {
    const snap = computeTick(get().elapsed, scenario, isolatedNodes());
    set({ scenario, values: snap.values, aggregates: snap.aggregates });
  },

  advance: (dt) => {
    const { playing, speed, elapsed, scenario } = get();
    if (!playing) return;
    const next = elapsed + dt * speed;
    const snap = computeTick(next, scenario, isolatedNodes());
    set({ elapsed: next, values: snap.values, aggregates: snap.aggregates });
  },
}));

// Re-evaluate immediately when a line valve opens / shuts (even while paused).
let lastIsolation = '';
useValveStore.subscribe((v) => {
  const key = [...isolatedNodes(v.rt)].sort().join(',');
  if (key === lastIsolation) return;
  lastIsolation = key;
  const s = useSimStore.getState();
  const snap = computeTick(s.elapsed, s.scenario, isolatedNodes(v.rt));
  useSimStore.setState({ values: snap.values, aggregates: snap.aggregates });
});
