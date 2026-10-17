import { create } from 'zustand';

/**
 * Selection + hover state (spec §2.24). Holds the currently selected/hovered
 * network node id; the InfoPanel and 3D highlight read from here.
 */
interface SelectionState {
  selectedId: string | null;
  hoveredId: string | null;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedId: null,
  hoveredId: null,
  select: (selectedId) => set({ selectedId }),
  hover: (hoveredId) => set({ hoveredId }),
  clear: () => set({ selectedId: null }),
}));
