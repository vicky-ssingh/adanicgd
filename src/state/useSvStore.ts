import { create } from 'zustand';
import { useSimStore } from '@/state/useSimStore';
import { SV_STATIONS, SV_BY_ID, type SvId } from '@/config/svStations';

/**
 * Section 07 Part A — SV station operation state. Each valve can be OPEN or
 * CLOSED; closing runs a handwheel/indicator animation, isolates the downstream
 * section and TRIGGERS the existing "Pipeline Isolation" scenario (it does not
 * replace it). Opening restores supply and — when no valve remains closed —
 * returns the scenario to normal. Blowdown vents residual downstream pressure.
 */
interface SvRuntime {
  closed: boolean; // logical target
  ind: number; // 0 = OPEN … 1 = CLOSED (animated)
  wheel: number; // handwheel rotation accumulator
  blowdown: number; // vent-plume timer (s)
}

interface SvState {
  rt: Record<SvId, SvRuntime>;
  hoverId: SvId | null;
  panelId: SvId | null;
  confirmId: SvId | null; // confirmation dialog target
  openPanel: (id: SvId) => void;
  closePanel: () => void;
  setHover: (id: SvId | null) => void;
  requestClose: (id: SvId) => void;
  cancelConfirm: () => void;
  confirmClose: (id: SvId) => void;
  openValve: (id: SvId) => void;
  blowdown: (id: SvId) => void;
  tick: (dt: number) => void;
}

const initRt = () => Object.fromEntries(SV_STATIONS.map((s) => [s.id, { closed: false, ind: 0, wheel: 0, blowdown: 0 }])) as Record<SvId, SvRuntime>;

function syncScenario(rt: Record<SvId, SvRuntime>) {
  const any = SV_STATIONS.some((s) => rt[s.id].closed);
  const sim = useSimStore.getState();
  if (any && sim.scenario !== 'pipeline-isolation') sim.setScenario('pipeline-isolation');
  if (!any && sim.scenario === 'pipeline-isolation') sim.setScenario('normal');
}

export const useSvStore = create<SvState>((set, get) => ({
  rt: initRt(),
  hoverId: null,
  panelId: null,
  confirmId: null,
  openPanel: (panelId) => set({ panelId }),
  closePanel: () => set({ panelId: null, confirmId: null }),
  setHover: (hoverId) => set({ hoverId }),
  requestClose: (confirmId) => set({ confirmId }),
  cancelConfirm: () => set({ confirmId: null }),
  confirmClose: (id) => {
    const rt = { ...get().rt, [id]: { ...get().rt[id], closed: true } };
    set({ rt, confirmId: null });
    syncScenario(rt);
  },
  openValve: (id) => {
    const rt = { ...get().rt, [id]: { ...get().rt[id], closed: false, blowdown: 0 } };
    set({ rt });
    syncScenario(rt);
  },
  blowdown: (id) => set((s) => ({ rt: { ...s.rt, [id]: { ...s.rt[id], blowdown: 2.5 } } })),
  tick: (dt) => {
    const s = get();
    let dirty = false;
    const rt = { ...s.rt };
    for (const st of SV_STATIONS) {
      const r = rt[st.id];
      const target = r.closed ? 1 : 0;
      if (Math.abs(r.ind - target) > 0.001 || r.blowdown > 0) {
        const ind = r.ind + Math.sign(target - r.ind) * Math.min(Math.abs(target - r.ind), dt / 3); // ~3s travel
        const wheel = Math.abs(r.ind - target) > 0.001 ? r.wheel + dt * 12 * (r.closed ? 1 : -1) : r.wheel;
        const blowdown = r.blowdown > 0 ? Math.max(0, r.blowdown - dt) : 0;
        rt[st.id] = { ...r, ind, wheel, blowdown };
        dirty = true;
      }
    }
    if (dirty) set({ rt });
  },
}));

/** Dashboard alert lines for any closed SV (Section 07 §A.3 step 4). */
export function svAlerts(): { text: string; crit: boolean }[] {
  const rt = useSvStore.getState().rt;
  const out: { text: string; crit: boolean }[] = [];
  for (const st of SV_STATIONS) {
    if (rt[st.id].closed) {
      out.push({ text: `⛔ ${st.id} CLOSED — SECTION ISOLATED`, crit: true });
      out.push({ text: `⚠ ${st.affected.toUpperCase()} AFFECTED`, crit: false });
    }
  }
  return out;
}

/** Edge polylines controlled by the currently hovered / open SV (for highlight). */
export function svHighlightEdges(): string[] {
  const s = useSvStore.getState();
  const id = s.hoverId ?? s.panelId;
  return id ? SV_BY_ID[id].controls : [];
}
