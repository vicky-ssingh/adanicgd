import { create } from 'zustand';

/**
 * Bespoke component-inspection state for the CNG Mother Station (Section 02).
 * Parallel to the Online Station's useStationInfoStore so the two facilities'
 * panels stay independent. Each part opens its own rich info panel.
 */
export type MotherPart =
  | 'station'
  | 'hp-filter'
  | 'metering'
  | 'compressor'
  | 'hp-cascade'
  | 'filling-panel'
  | 'dispenser'
  | 'trailer'
  | 'vehicle-car';

interface MotherInfoState {
  part: MotherPart | null;
  open: (part: MotherPart) => void;
  close: () => void;
}

export const useMotherInfoStore = create<MotherInfoState>((set) => ({
  part: null,
  open: (part) => set({ part }),
  close: () => set({ part: null }),
}));
