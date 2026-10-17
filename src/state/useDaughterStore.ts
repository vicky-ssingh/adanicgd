import { create } from 'zustand';

/**
 * Section 04 — cascade-depletion model shared by the Daughter Station and the
 * Daughter Booster Station. Both are fed only by a parked cascade trailer whose
 * pressure DECLINES as vehicles fill. The contrast is the whole point:
 *   • Daughter (no compressor): dispensing pressure FOLLOWS the cascade down;
 *     cut off at 80 Bar leaving ~45% of the load stranded.
 *   • Booster: a small compressor keeps dispensing CONSTANT at 200 Bar and works
 *     harder (load ↑) as the cascade falls, extracting down to ~40 Bar (~85%).
 * Local to Section 04 — does not touch the shared CGD sim or the Section-03 fleet.
 */

const FULL = 250;
const D_CUTOFF = 80;
const B_CUTOFF = 40;
const D_RATE = 2.0; // Bar/s depletion
const B_RATE = 2.4;
const SWAP_TIME = 8; // seconds to swap an empty trailer
const LOAD_LT = 8000; // trailer water-cap SCM basis

export type StationStatus = 'OPTIMAL' | 'DEGRADED' | 'OFFLINE';
export type FillQuality = 'NORMAL' | 'REDUCED' | 'LOW' | 'DEPLETED';

interface SideRaw {
  cascade: number;
  vehicles: number;
  swap: number; // >0 while swapping
  history: number[]; // cascade samples for the trend graph
}

interface DaughterState {
  d: SideRaw;
  b: SideRaw;
  compareOpen: boolean;
  lastSampleT: number;
  elapsed: number;
  setCompareOpen: (v: boolean) => void;
  tick: (dt: number) => void;
}

function step(s: SideRaw, dt: number, rate: number, cutoff: number, perVehBar: number) {
  if (s.swap > 0) {
    s.swap -= dt;
    if (s.swap <= 0) { s.swap = 0; s.cascade = FULL; }
    return;
  }
  s.cascade -= rate * dt;
  s.vehicles += (rate * dt) / perVehBar;
  if (s.cascade <= cutoff) { s.cascade = cutoff; s.swap = SWAP_TIME; }
}

export const useDaughterStore = create<DaughterState>((set, get) => ({
  d: { cascade: 226, vehicles: 34, swap: 0, history: [] },
  b: { cascade: 178, vehicles: 51, swap: 0, history: [] },
  compareOpen: false,
  lastSampleT: 0,
  elapsed: 0,
  setCompareOpen: (compareOpen) => set({ compareOpen }),
  tick: (dt) => {
    const s = get();
    const d = { ...s.d, history: s.d.history };
    const b = { ...s.b, history: s.b.history };
    step(d, dt, D_RATE, D_CUTOFF, 5);
    step(b, dt, B_RATE, B_CUTOFF, 6);
    const elapsed = s.elapsed + dt;
    let lastSampleT = s.lastSampleT;
    if (elapsed - lastSampleT >= 1) {
      lastSampleT = elapsed;
      d.history = [...d.history, d.cascade].slice(-48);
      b.history = [...b.history, b.cascade].slice(-48);
    }
    set({ d, b, elapsed, lastSampleT });
  },
}));

// ---- Derived (Daughter) ----
export function daughterView(d: SideRaw) {
  const swapping = d.swap > 0;
  const dispensing = Math.min(d.cascade, 200);
  const status: StationStatus = swapping || d.cascade < 80 ? 'OFFLINE' : d.cascade < 120 ? 'DEGRADED' : 'OPTIMAL';
  const quality: FillQuality =
    d.cascade < 80 ? 'DEPLETED' : d.cascade < 120 ? 'LOW' : d.cascade < 200 ? 'REDUCED' : 'NORMAL';
  const stranded = Math.round(LOAD_LT * 0.45 * (1 - Math.max(0, (d.cascade - 80) / (FULL - 80))));
  const estVehiclesLeft = Math.max(0, Math.round((d.cascade - 80) / 5));
  // active trailer bank A→B→C→D as cascade depletes (A first / highest use)
  const banks = trailerBanks(d.cascade);
  const activeBank = d.cascade > 214 ? 'A' : d.cascade > 168 ? 'B' : d.cascade > 120 ? 'C' : 'D';
  // fill time (min) grows as differential narrows
  const fillMin = 4 + Math.max(0, (200 - dispensing) / 200) * 8;
  const tankFill = Math.round(Math.min(100, (dispensing / 200) * 100));
  return { swapping, cascade: d.cascade, dispensing, status, quality, stranded, estVehiclesLeft, vehicles: Math.round(d.vehicles), banks, activeBank, fillMin, tankFill, history: d.history };
}

// ---- Derived (Booster) ----
export function boosterView(b: SideRaw) {
  const swapping = b.swap > 0;
  const exhausted = b.cascade <= B_CUTOFF + 0.5 || swapping;
  const dispensing = exhausted ? 0 : 200;
  const suction = b.cascade;
  const load = Math.min(100, Math.round(30 + ((FULL - b.cascade) / (FULL - B_CUTOFF)) * 70));
  const ratio = (200 / Math.max(1, b.cascade)).toFixed(1);
  const status: StationStatus = exhausted ? 'OFFLINE' : 'OPTIMAL';
  const gasRecovered = Math.round(LOAD_LT * 0.85 * ((FULL - b.cascade) / (FULL - B_CUTOFF)));
  const tankFill = exhausted ? 0 : 100;
  return { swapping, cascade: b.cascade, suction, dispensing, load, ratio, status, gasRecovered, vehicles: Math.round(b.vehicles), tankFill, history: b.history };
}

/** Per-bank trailer pressures from cascade level (A depletes first). */
export function trailerBanks(cascade: number): Record<'A' | 'B' | 'C' | 'D', number> {
  // A is drawn down first, D last — so at a given cascade, A ≤ B ≤ C ≤ D.
  const base = cascade;
  return {
    A: Math.round(Math.max(60, base - 100)),
    B: Math.round(Math.max(70, base - 60)),
    C: Math.round(Math.max(90, base - 20)),
    D: Math.round(Math.min(250, base + 10)),
  };
}

export const CASCADE_FULL = FULL;
export const D_CUTOFF_BAR = D_CUTOFF;
export const B_CUTOFF_BAR = B_CUTOFF;
