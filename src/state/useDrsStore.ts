import { create } from 'zustand';
import { DRS_UNITS } from '@/config/drsUnits';
import { logEvent } from '@/state/useEventLogStore';

/**
 * Section 15 §D.4 — DRS duty/standby stream state. Each DRS runs one regulator
 * stream on duty and holds the other in reserve; the panel can switch them, which
 * reroutes the internal flow and logs the change. Purely a visual/operational
 * demonstration — DRS pressures, flows and network connections are unchanged.
 */
interface DrsState {
  duty: Record<string, 1 | 2>;
  switchDuty: (id: string) => void;
}

const initDuty = Object.fromEntries(
  Object.entries(DRS_UNITS).map(([id, d]) => [id, d.dutyDefault]),
) as Record<string, 1 | 2>;

export const useDrsStore = create<DrsState>((set, get) => ({
  duty: { ...initDuty },
  switchDuty: (id) => {
    const cur = get().duty[id] ?? 1;
    const next = (cur === 1 ? 2 : 1) as 1 | 2;
    set((s) => ({ duty: { ...s.duty, [id]: next } }));
    const no = DRS_UNITS[id]?.no ?? id.toUpperCase();
    logEvent('info', `${no} duty stream changed ${cur} → ${next}`);
  },
}));
