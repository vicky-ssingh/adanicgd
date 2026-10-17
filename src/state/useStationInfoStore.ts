import { create } from 'zustand';

/**
 * Bespoke component-inspection state for the Online CNG Station (Section 01).
 * Each major station component (inlet skid, compressor, cascade, priority panel,
 * dispenser, a vehicle, or the station as a whole) opens its own rich info panel.
 * Kept separate from the generic network InfoPanel so nothing existing changes.
 */
export type StationPart =
  | 'station'
  | 'inlet'
  | 'compressor'
  | 'cascade'
  | 'priority'
  | 'dispenser'
  | 'vehicle-car'
  | 'vehicle-auto'
  | 'vehicle-tempo'
  | 'vehicle-bus';

interface StationInfoState {
  part: StationPart | null;
  open: (part: StationPart) => void;
  close: () => void;
}

export const useStationInfoStore = create<StationInfoState>((set) => ({
  part: null,
  open: (part) => set({ part }),
  close: () => set({ part: null }),
}));
