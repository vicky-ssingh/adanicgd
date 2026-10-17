import { create } from 'zustand';

/** Hover tooltip for gas-connection dots (Fix Problem 2C). */
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  show: (x: number, y: number, text: string) => void;
  hide: () => void;
}

export const useTooltipStore = create<TooltipState>((set) => ({
  visible: false,
  x: 0,
  y: 0,
  text: '',
  show: (x, y, text) => set({ visible: true, x, y, text }),
  hide: () => set({ visible: false }),
}));
