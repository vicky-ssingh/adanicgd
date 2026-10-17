import { create } from 'zustand';
import { LINE_VALVES, LINE_VALVE_BY_ID, type ServiceLine } from '@/config/lineValves';

/**
 * Line-valve operation state (2D reference parity). Each valve is OPEN or
 * CLOSED; `ind` animates the lever / actuator indicator (0 open → 1 closed).
 * Closing isolates the valve's downstream nodes — useSimStore subscribes and
 * feeds `isolatedNodes()` to the engine — and stops gas on its service lines.
 * ESD closes every isolation valve at once; RESET reopens them all.
 */
interface ValveRt { closed: boolean; ind: number }

interface ValveState {
  rt: Record<string, ValveRt>;
  hoverId: string | null;
  panelId: string | null;
  confirmId: string | null;
  openPanel: (id: string) => void;
  closePanel: () => void;
  setHover: (id: string | null) => void;
  requestClose: (id: string) => void;
  cancelConfirm: () => void;
  setClosed: (id: string, closed: boolean) => void;
  esdCloseAll: () => void;
  openAll: () => void;
  tick: (dt: number) => void;
}

const initRt = () => Object.fromEntries(LINE_VALVES.map((v) => [v.id, { closed: false, ind: 0 }])) as Record<string, ValveRt>;

export const useValveStore = create<ValveState>((set, get) => ({
  rt: initRt(),
  hoverId: null,
  panelId: null,
  confirmId: null,
  openPanel: (panelId) => set({ panelId, confirmId: null }),
  closePanel: () => set({ panelId: null, confirmId: null }),
  setHover: (hoverId) => set({ hoverId }),
  requestClose: (confirmId) => set({ confirmId }),
  cancelConfirm: () => set({ confirmId: null }),
  setClosed: (id, closed) => set((s) => ({ rt: { ...s.rt, [id]: { ...s.rt[id], closed } }, confirmId: null })),
  esdCloseAll: () =>
    set((s) => {
      const rt = { ...s.rt };
      for (const v of LINE_VALVES) if (v.esd) rt[v.id] = { ...rt[v.id], closed: true };
      return { rt, confirmId: null };
    }),
  openAll: () =>
    set((s) => {
      const rt = { ...s.rt };
      for (const v of LINE_VALVES) rt[v.id] = { ...rt[v.id], closed: false };
      return { rt, confirmId: null };
    }),
  tick: (dt) => {
    const s = get();
    let dirty = false;
    const rt = { ...s.rt };
    for (const v of LINE_VALVES) {
      const r = rt[v.id];
      const target = r.closed ? 1 : 0;
      if (Math.abs(r.ind - target) > 0.001) {
        // actuated valves stroke in ~4 s, manual quarter-turn in ~1.5 s
        const rate = dt / (v.kind === 'au' ? 4 : 1.5);
        rt[v.id] = { ...r, ind: r.ind + Math.sign(target - r.ind) * Math.min(Math.abs(target - r.ind), rate) };
        dirty = true;
      }
    }
    if (dirty) set({ rt });
  },
}));

/** Network nodes currently without supply because a valve upstream is shut. */
export function isolatedNodes(rt = useValveStore.getState().rt): Set<string> {
  const out = new Set<string>();
  for (const v of LINE_VALVES) if (rt[v.id]?.closed) v.isolates.forEach((n) => out.add(n));
  return out;
}

/** Consumer service lines currently without supply. */
export function isolatedLines(rt = useValveStore.getState().rt): Set<ServiceLine> {
  const out = new Set<ServiceLine>();
  for (const v of LINE_VALVES) if (rt[v.id]?.closed) v.lines.forEach((l) => out.add(l));
  return out;
}

/** Dashboard alert lines for shut valves. */
export function valveAlerts(): { text: string; crit: boolean }[] {
  const rt = useValveStore.getState().rt;
  return LINE_VALVES.filter((v) => rt[v.id].closed).map((v) => ({
    text: `⛔ ${v.id} ${LINE_VALVE_BY_ID[v.id].name.toUpperCase()} CLOSED — ${v.affected.toUpperCase()} ISOLATED`,
    crit: v.esd,
  }));
}
