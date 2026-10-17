import { create } from 'zustand';

/** CNG | PNG | BOTH network focus (spec §2.28) */
export type NetworkMode = 'CNG' | 'PNG' | 'BOTH';
/** Day / Night rendering (spec §2.32) */
export type TimeOfDay = 'day' | 'night';

/** A requested smooth camera move (spec §2.29). Consumed by CameraRig. */
export interface CameraFocus {
  position: [number, number, number];
  target: [number, number, number];
  /** monotonically increasing so repeat requests to the same spot still fire */
  nonce: number;
}

interface ViewState {
  mode: NetworkMode;
  timeOfDay: TimeOfDay;
  /** id of the active camera preset (spec §2.29) */
  cameraPreset: string;
  focus: CameraFocus | null;
  /** Section 11 §D.5 — projector-friendly presentation mode. */
  presentation: boolean;
  setMode: (mode: NetworkMode) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  toggleTimeOfDay: () => void;
  setCameraPreset: (id: string) => void;
  focusOn: (position: [number, number, number], target: [number, number, number]) => void;
  togglePresentation: () => void;
}

let focusNonce = 0;

export const useViewStore = create<ViewState>((set) => ({
  mode: 'BOTH',
  timeOfDay: 'day',
  cameraPreset: 'city-overview',
  focus: null,
  presentation: false,
  setMode: (mode) => set({ mode }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  toggleTimeOfDay: () =>
    set((s) => ({ timeOfDay: s.timeOfDay === 'day' ? 'night' : 'day' })),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  focusOn: (position, target) =>
    set({ focus: { position, target, nonce: ++focusNonce } }),
  togglePresentation: () => set((s) => ({ presentation: !s.presentation })),
}));
