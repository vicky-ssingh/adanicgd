import { create } from 'zustand';
import { useSimStore } from '@/state/useSimStore';
import { useRouteStore } from '@/state/useRouteStore';
import { BUILDING_ROUTES } from '@/config/routes';
import { CONSUMER_BY_TYPE, demandAt, hourOfDay, type ConsumerType } from '@/config/pngConsumers';

/**
 * Section 10 — PNG consumer state. Tracks the ignite state of the residential
 * stove, live per-type demand (driven by the 24-hour profiles), animated meter
 * readings, and which consumer info panel is open. The ConsumerRunner ticks it
 * from the frame loop (gated by the sim). Additive — reads the existing sim clock,
 * changes nothing upstream.
 */
interface PngConsumerState {
  panel: ConsumerType | null;
  burnersOn: boolean; // residential stove ignite
  flow: Record<ConsumerType, number>; // live SCMH
  reading: Record<ConsumerType, number>; // meter total SCM
  openPanel: (t: ConsumerType) => void;
  closePanel: () => void;
  toggleBurners: () => void;
  tick: (dt: number) => void;
}

const initReading: Record<ConsumerType, number> = { residential: 1284.6, commercial: 51840, industrial: 3348200 };

export const usePngConsumerStore = create<PngConsumerState>((set, get) => ({
  panel: null,
  burnersOn: false,
  flow: { residential: 0, commercial: 18.5, industrial: 620 },
  reading: { ...initReading },
  openPanel: (panel) => {
    // Highlight the consumer's gas-supply route (integrates with the existing
    // click-to-highlight behaviour), then open the panel.
    const def = BUILDING_ROUTES[panel];
    useRouteStore.getState().setRoute({ edges: new Set(def.edges), chain: def.chain, title: def.title, flow: def.flow });
    set({ panel });
  },
  closePanel: () => { useRouteStore.getState().clear(); set({ panel: null }); },
  toggleBurners: () => set((s) => ({ burnersOn: !s.burnersOn })),
  tick: (dt) => {
    const s = get();
    const hour = hourOfDay(useSimStore.getState().elapsed);
    const flow = { ...s.flow };
    const reading = { ...s.reading };
    (['residential', 'commercial', 'industrial'] as ConsumerType[]).forEach((t) => {
      let f = demandAt(t, hour);
      // Residential draw only when a burner is alight; profile is the ceiling.
      if (t === 'residential') f = s.burnersOn ? Math.max(0.9, f) : 0;
      // ease toward target so the number moves smoothly
      flow[t] = flow[t] + (f - flow[t]) * Math.min(1, dt * 0.8);
      reading[t] = reading[t] + (flow[t] / 3600) * dt; // SCM accrued
    });
    set({ flow, reading });
  },
}));

/** Aggregate PNG consumer demand (SCMH) across the three modelled types. */
export function pngConsumerAggregate(): number {
  const f = usePngConsumerStore.getState().flow;
  return f.residential + f.commercial + f.industrial;
}

/**
 * Section 17 §B.1 — network-wide PNG demand built up from the MODELLED consumers:
 * each tier's live per-connection demand × its representative connection count,
 * scaled by the active scenario's PNG split (so "PNG Demand Increase" raises it and
 * igniting the residential burner produces a small visible rise). Industrial
 * dominates. Additive — the sim engine is untouched.
 */
const RES_CONNECTIONS = 1240;
const COMM_CONNECTIONS = 42;
const IND_CONNECTIONS = 3;
export function pngNetworkDemand(scenarioPngSplit = 0.62): number {
  const f = usePngConsumerStore.getState().flow;
  const base = f.residential * RES_CONNECTIONS + f.commercial * COMM_CONNECTIONS + f.industrial * IND_CONNECTIONS;
  return base * (scenarioPngSplit / 0.62);
}

export function consumerView(t: ConsumerType) {
  const s = usePngConsumerStore.getState();
  const def = CONSUMER_BY_TYPE[t];
  return { def, flow: s.flow[t], reading: s.reading[t], burnersOn: s.burnersOn };
}
