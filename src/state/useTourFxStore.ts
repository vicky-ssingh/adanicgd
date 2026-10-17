import { create } from 'zustand';

/**
 * Section 14 — tour framing effects. Lets a stop temporarily fade obstructing
 * props (trees, streetlights) that sit in the camera-to-subject corridor so the
 * subject is visible (§D.4). Always reverts to 1 on stop exit / tour end — props
 * are never deleted, only faded for the duration of a stop.
 */
interface TourFxState {
  propOpacity: number; // 1 = normal, <1 = faded for the active stop
  cutaway: boolean; // §17 B.3 — ground trench cutaway for the buried-pipeline stop
  setPropOpacity: (v: number) => void;
  setCutaway: (v: boolean) => void;
}

export const useTourFxStore = create<TourFxState>((set) => ({
  propOpacity: 1,
  cutaway: false,
  setPropOpacity: (propOpacity) => set({ propOpacity }),
  setCutaway: (cutaway) => set({ cutaway }),
}));
