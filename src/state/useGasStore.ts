import { create } from 'zustand';
import { useEsdStore } from '@/state/useEsdStore';
import type { FacilityId } from '@/config/safetyLayout';

/**
 * Section 08 Part B — gas-leak detection sequence. A detector reading rises; at
 * 20% LEL a warning fires, at 40% LEL an automatic ESD trips the facility (the
 * Part A sequence). After isolation the reading falls back to zero. Driven by the
 * "Gas Leak Detection" scenario or the SIMULATE LEAK control.
 */
interface GasState {
  active: boolean;
  reading: number; // % LEL
  facilityId: FacilityId;
  detectorId: string;
  autoTripped: boolean;
  panelId: string | null; // clicked detector id for the info panel
  start: (fac?: FacilityId) => void;
  stop: () => void;
  openPanel: (id: string) => void;
  closePanel: () => void;
  tick: (dt: number) => void;
}

export const useGasStore = create<GasState>((set, get) => ({
  active: false,
  reading: 0,
  facilityId: 'online-cng',
  detectorId: 'GD-04',
  autoTripped: false,
  panelId: null,
  start: (fac = 'online-cng') => { if (!get().active) set({ active: true, reading: 0, facilityId: fac, detectorId: 'GD-04', autoTripped: false }); },
  stop: () => set({ active: false, reading: 0, autoTripped: false }),
  openPanel: (panelId) => set({ panelId }),
  closePanel: () => set({ panelId: null }),
  tick: (dt) => {
    const s = get();
    if (!s.active) return;
    if (!s.autoTripped) {
      const reading = s.reading + dt * 5;
      if (reading >= 40) {
        set({ reading: 40, autoTripped: true });
        useEsdStore.getState().confirmTrip(s.facilityId); // AUTO-ESD
      } else {
        set({ reading });
      }
    } else {
      // isolated → concentration falls back to zero
      const reading = Math.max(0, s.reading - dt * 6);
      set({ reading, active: reading > 0 });
    }
  },
}));

export function gasLevel(reading: number): 'normal' | 'low' | 'high' {
  return reading >= 40 ? 'high' : reading >= 20 ? 'low' : 'normal';
}
