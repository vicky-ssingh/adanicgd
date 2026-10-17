import { create } from 'zustand';
import { useSimStore } from '@/state/useSimStore';

/**
 * Section 06 — odorization unit (mercaptan dosing skid) live state. Tank level
 * slowly falls over sim time; dosing rate fluctuates around the target and
 * responds to scenarios; the pumps stop (and a critical "unodorized gas" alarm
 * fires) on Equipment Shutdown. Local to the City Gate odorization unit — does
 * not touch the shared CGD sim engine.
 */
const TANK_L = 1000; // litres capacity

export interface OdorAlert {
  kind: 'none' | 'low' | 'critical' | 'offline';
  text: string;
}

interface OdorState {
  tankPct: number; // 0..100
  dosingRate: number; // mg/SCM
  pumpsOn: boolean;
  status: 'ONLINE' | 'OFFLINE';
  panelOpen: boolean;
  open: () => void;
  close: () => void;
  tick: (dt: number) => void;
}

export const useOdorStore = create<OdorState>((set, get) => ({
  tankPct: 78,
  dosingRate: 12,
  pumpsOn: true,
  status: 'ONLINE',
  panelOpen: false,
  open: () => set({ panelOpen: true }),
  close: () => set({ panelOpen: false }),
  tick: (dt) => {
    const sim = useSimStore.getState();
    const scenario = sim.scenario;
    const offline = scenario === 'equipment-shutdown';
    const flowFactor = scenario === 'high-demand' || scenario === 'cng-demand-up' ? 1.35 : scenario === 'low-demand' ? 0.7 : scenario === 'pressure-drop' ? 0.9 : 1;

    const s = get();
    let tankPct = s.tankPct;
    if (sim.playing && !offline) {
      // consumption scales with flow; slow fall over sim time (swap at empty)
      tankPct = s.tankPct - dt * 0.05 * flowFactor;
      if (tankPct <= 4) tankPct = 100; // refill / tank swap
    }
    // dosing rate held in the 10–15 target band, nudged by demand + fluctuation
    const base = 12 + (flowFactor - 1) * 3;
    const dosingRate = offline ? 0 : Math.max(0, base + Math.sin(performance.now() / 700) * 0.3);
    set({ tankPct, dosingRate, pumpsOn: !offline, status: offline ? 'OFFLINE' : 'ONLINE' });
  },
}));

export function odorView() {
  const s = useOdorStore.getState();
  const remainingL = Math.round((s.tankPct / 100) * TANK_L);
  const gasFlow = Math.round(useSimStore.getState().aggregates.totalFlow * 0.3);
  const consumption = Math.round((s.dosingRate * gasFlow) / 1000); // g/hr (mg/SCM × SCMH / 1000)
  const daysToRefill = s.dosingRate > 0 ? Math.max(1, Math.round((remainingL / Math.max(1, consumption * 0.0012)) / 24)) : 0;
  return { ...s, remainingL, gasFlow, consumption, daysToRefill, capacityL: TANK_L };
}

export function odorAlert(): OdorAlert {
  const s = useOdorStore.getState();
  if (s.status === 'OFFLINE') return { kind: 'offline', text: '⚠ ODORIZATION OFFLINE — UNODORIZED GAS RISK' };
  if (s.tankPct < 10) return { kind: 'critical', text: `⛔ ODORANT TANK CRITICAL — ${Math.round(s.tankPct)}%` };
  if (s.tankPct < 20) return { kind: 'low', text: `⚠ ODORANT TANK LOW — ${Math.round(s.tankPct)}%` };
  return { kind: 'none', text: '' };
}

export const ODOR_TANK_L = TANK_L;
