import { create } from 'zustand';

/**
 * Section 03 — selected cascade trailer for the bespoke trailer info panel.
 * Holds the fleet id (e.g. "CT-07") or null. Kept separate from the station
 * info stores so nothing existing changes.
 */
interface TrailerInfoState {
  id: string | null;
  open: (id: string) => void;
  close: () => void;
}

export const useTrailerInfoStore = create<TrailerInfoState>((set) => ({
  id: null,
  open: (id) => set({ id }),
  close: () => set({ id: null }),
}));
