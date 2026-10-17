import { create } from 'zustand';

/**
 * Section 04 — bespoke inspection state for the Daughter + Booster stations.
 * `part` encodes both which station and which component so one panel component
 * can render all of them. Kept separate from the other info stores.
 */
export type DaughterPart =
  | 'daughter-station'
  | 'daughter-discharge'
  | 'daughter-priority'
  | 'booster-station'
  | 'booster-discharge'
  | 'booster-compressor'
  | 'booster-buffer';

interface DaughterInfoState {
  part: DaughterPart | null;
  open: (part: DaughterPart) => void;
  close: () => void;
}

export const useDaughterInfoStore = create<DaughterInfoState>((set) => ({
  part: null,
  open: (part) => set({ part }),
  close: () => set({ part: null }),
}));
