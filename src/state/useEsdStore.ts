import { create } from 'zustand';
import { useSimStore } from '@/state/useSimStore';
import { useStationStore } from '@/state/useStationStore';
import { useMotherStore } from '@/state/useMotherStore';
import { FACILITIES, type FacilityId } from '@/config/safetyLayout';

/**
 * Section 08 Part A — Emergency Shutdown state, shared across facilities. Tripping
 * a facility's ESD isolates + depressurises it, strobes its beacon and closes its
 * ESD valve, and TRIGGERS the existing "Equipment Shutdown" scenario (it does not
 * replace it). RESET restores everything progressively (~15 s). `phase` drives the
 * per-facility trip animation (0 armed → 1 fully tripped/depressurised).
 */
interface FacRt { tripped: boolean; phase: number }

interface EsdState {
  fac: Record<FacilityId, FacRt>;
  panelId: FacilityId | null;
  confirmId: FacilityId | null; // trip confirmation dialog
  resetConfirmId: FacilityId | null; // reset confirmation dialog
  openPanel: (id: FacilityId) => void;
  closePanel: () => void;
  requestTrip: (id: FacilityId) => void;
  cancelConfirm: () => void;
  confirmTrip: (id: FacilityId) => void;
  requestReset: (id: FacilityId) => void;
  confirmReset: (id: FacilityId) => void;
  tick: (dt: number) => void;
}

const initFac = () => Object.fromEntries(FACILITIES.map((f) => [f.id, { tripped: false, phase: 0 }])) as Record<FacilityId, FacRt>;

function syncScenario(fac: Record<FacilityId, FacRt>) {
  const any = FACILITIES.some((f) => fac[f.id].tripped);
  const sim = useSimStore.getState();
  if (any && sim.scenario !== 'equipment-shutdown') sim.setScenario('equipment-shutdown');
  if (!any && sim.scenario === 'equipment-shutdown') sim.setScenario('normal');
}

export const useEsdStore = create<EsdState>((set, get) => ({
  fac: initFac(),
  panelId: null,
  confirmId: null,
  resetConfirmId: null,
  openPanel: (panelId) => set({ panelId }),
  closePanel: () => set({ panelId: null, confirmId: null, resetConfirmId: null }),
  requestTrip: (confirmId) => set({ confirmId }),
  cancelConfirm: () => set({ confirmId: null, resetConfirmId: null }),
  confirmTrip: (id) => {
    const fac = { ...get().fac, [id]: { ...get().fac[id], tripped: true } };
    set({ fac, confirmId: null });
    // abort any in-progress refuel / trailer fill
    useStationStore.getState().stopRefuel();
    useMotherStore.getState().reset();
    syncScenario(fac);
  },
  requestReset: (resetConfirmId) => set({ resetConfirmId }),
  confirmReset: (id) => {
    const fac = { ...get().fac, [id]: { ...get().fac[id], tripped: false } };
    set({ fac, resetConfirmId: null });
    syncScenario(fac);
  },
  tick: (dt) => {
    const s = get();
    let dirty = false;
    const fac = { ...s.fac };
    for (const f of FACILITIES) {
      const r = fac[f.id];
      const target = r.tripped ? 1 : 0;
      if (Math.abs(r.phase - target) > 0.001) {
        // trip in ~6 s, restore in ~15 s (restart is not instant)
        const rate = r.tripped ? dt / 6 : dt / 15;
        const phase = r.phase + Math.sign(target - r.phase) * Math.min(Math.abs(target - r.phase), rate);
        fac[f.id] = { ...r, phase };
        dirty = true;
      }
    }
    if (dirty) set({ fac });
  },
}));

export function anyEsdTripped(): boolean {
  const fac = useEsdStore.getState().fac;
  return FACILITIES.some((f) => fac[f.id].tripped);
}

export function esdAlerts(): { text: string; crit: boolean }[] {
  const fac = useEsdStore.getState().fac;
  const out: { text: string; crit: boolean }[] = [];
  for (const f of FACILITIES) {
    if (fac[f.id].tripped) {
      out.push({ text: `⛔ EMERGENCY SHUTDOWN — ${f.label.toUpperCase()}`, crit: true });
      out.push({ text: `⚠ ${f.label.toUpperCase()} ISOLATED — DISPENSERS OFFLINE`, crit: false });
    }
  }
  return out;
}
