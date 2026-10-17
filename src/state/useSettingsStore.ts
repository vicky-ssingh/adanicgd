import { create } from 'zustand';

export type Quality = 'low' | 'medium' | 'high';

export interface QualityPreset {
  msaa: number;
  ssao: boolean;
  ssaoSamples: number;
  shadowMap: number;
  contactRes: number;
  dpr: [number, number];
  bloom: boolean;
}

/** Rendering presets so the twin scales from phones to high-end desktops. */
export const QUALITY: Record<Quality, QualityPreset> = {
  low: { msaa: 0, ssao: false, ssaoSamples: 8, shadowMap: 1024, contactRes: 512, dpr: [1, 1], bloom: true },
  medium: { msaa: 2, ssao: true, ssaoSamples: 16, shadowMap: 2048, contactRes: 1024, dpr: [1, 1.5], bloom: true },
  high: { msaa: 4, ssao: true, ssaoSamples: 31, shadowMap: 4096, contactRes: 2048, dpr: [1, 2], bloom: true },
};

function initialQuality(): Quality {
  try {
    const saved = localStorage.getItem('adani-quality') as Quality | null;
    if (saved && saved in QUALITY) return saved;
  } catch {
    /* ignore */
  }
  // Auto-pick from device: coarse pointer / low core count → medium.
  if (typeof navigator !== 'undefined') {
    const cores = navigator.hardwareConcurrency ?? 8;
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    if (coarse || cores <= 4) return 'medium';
  }
  return 'high';
}

interface SettingsState {
  quality: Quality;
  setQuality: (q: Quality) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  quality: initialQuality(),
  setQuality: (quality) => {
    try {
      localStorage.setItem('adani-quality', quality);
    } catch {
      /* ignore */
    }
    set({ quality });
  },
}));
