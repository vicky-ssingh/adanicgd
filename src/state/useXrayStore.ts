import { create } from 'zustand';

/**
 * Section 12 §A.3.2 — "Show Internal Flow" engineering-inspection mode. When on,
 * the opaque steel pipelines become semi-transparent so the gas particles inside
 * the bore are visible. Off by default (pipes read as real opaque steel).
 */
interface XrayState {
  on: boolean;
  toggle: () => void;
  set: (on: boolean) => void;
}

export const useXrayStore = create<XrayState>((set) => ({
  on: false,
  toggle: () => set((s) => ({ on: !s.on })),
  set: (on) => set({ on }),
}));
