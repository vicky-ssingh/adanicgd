import { create } from 'zustand';
import { TOUR } from '@/config/tour';

/**
 * Guided-tour state. `active` drives cinematic mode (the normal HUD tucks away);
 * `playing` controls auto-advance; `voiceEnabled` toggles narration audio.
 */
interface TourState {
  active: boolean;
  index: number;
  playing: boolean;
  voiceEnabled: boolean;
  start: () => void;
  exit: () => void;
  next: () => void;
  prev: () => void;
  goto: (i: number) => void;
  setPlaying: (b: boolean) => void;
  togglePlay: () => void;
  toggleVoice: () => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  active: false,
  index: 0,
  playing: true,
  voiceEnabled: true,

  start: () => set({ active: true, index: 0, playing: true }),
  exit: () => set({ active: false, index: 0 }),
  next: () => {
    const { index } = get();
    if (index >= TOUR.length - 1) {
      set({ playing: false }); // hold on the final stop
    } else {
      set({ index: index + 1, playing: true });
    }
  },
  prev: () => set((s) => ({ index: Math.max(0, s.index - 1), playing: true })),
  goto: (index) => set({ index: Math.max(0, Math.min(TOUR.length - 1, index)), playing: true }),
  setPlaying: (playing) => set({ playing }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
}));
