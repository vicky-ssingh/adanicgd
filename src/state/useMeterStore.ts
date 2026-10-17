import { create } from 'zustand';

/** PNG meter-box inspection panel state (wall-pipework fix). */
export interface MeterInfo {
  connectionType: string; // e.g. "Residential PNG"
  meterType: string; // e.g. "Domestic Gas Meter"
  flow: number; // SCMH
  label: string; // meter box top label
}

interface MeterState {
  active: boolean;
  info: MeterInfo | null;
  open: (info: MeterInfo) => void;
  close: () => void;
}

export const useMeterStore = create<MeterState>((set) => ({
  active: false,
  info: null,
  open: (info) => set({ active: true, info }),
  close: () => set({ active: false, info: null }),
}));
