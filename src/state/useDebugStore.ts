import { create } from 'zustand';

/**
 * Section 16 §A.5 — developer debug flags. `showMask` renders the placement
 * exclusion mask (roads + trailer route corridor + stations) as a semi-transparent
 * overlay so prop-placement violations are immediately visible. Toggle with the
 * "M" key (see ExclusionMaskOverlay).
 */
interface DebugState {
  showMask: boolean;
  toggleMask: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  showMask: false,
  toggleMask: () => set((s) => ({ showMask: !s.showMask })),
}));
