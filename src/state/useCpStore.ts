import { create } from 'zustand';

/** Section 08 §D.3 — CP survey layer toggle + selected CP component info. */
export interface CpInfo {
  kind: 'tr' | 'tp';
  id: string;
  label?: string;
  outputV?: string;
  outputA?: string;
  protectedKm?: number;
  chainageKm?: number;
  potential?: string;
  assessment?: string;
}

interface CpState {
  surveyOn: boolean;
  info: CpInfo | null;
  toggleSurvey: () => void;
  openInfo: (info: CpInfo) => void;
  closeInfo: () => void;
}

export const useCpStore = create<CpState>((set) => ({
  surveyOn: false,
  info: null,
  toggleSurvey: () => set((s) => ({ surveyOn: !s.surveyOn })),
  openInfo: (info) => set({ info }),
  closeInfo: () => set({ info: null }),
}));
