import { create } from 'zustand';

/** Section 07 §C.5 — selected route marker for its info panel. */
export interface MarkerInfo {
  id: string;
  pipeline: string;
  material: string;
  depth: string;
  chainageKm: number;
  pressure: string;
  direction: string;
  nearestSv: string;
}

interface MarkerState {
  info: MarkerInfo | null;
  open: (info: MarkerInfo) => void;
  close: () => void;
}

export const useMarkerStore = create<MarkerState>((set) => ({
  info: null,
  open: (info) => set({ info }),
  close: () => set({ info: null }),
}));
