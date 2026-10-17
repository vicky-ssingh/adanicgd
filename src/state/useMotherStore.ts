import { create } from 'zustand';

/**
 * CNG Mother Station live state (Section 02). Drives the 6-stage cascade-trailer
 * filling sequence (arrival → securing → connection → filling → completion →
 * departure), the HP cascade bank levels (incl. the dedicated trailer-fill
 * reserve), and the station's running totals. Local to the Mother Station; does
 * NOT touch the shared CGD simulation engine.
 */

export type FillStage =
  | 'idle'
  | 'arrival'
  | 'securing'
  | 'connection'
  | 'filling'
  | 'completion'
  | 'departure';

export type MotherBank = 'HIGH' | 'MEDIUM' | 'LOW' | 'RESERVE';

// Stage end-times (sim seconds) — see spec §7.3.
const T = { arrival: 8, securing: 14, connection: 22, filling: 60, completion: 70, departure: 80 };
const TRAILER_ID = 'CT-04';
const TARGET_BAR = 250;

const BANK_NOMINAL: Record<MotherBank, number> = { HIGH: 98, MEDIUM: 79, LOW: 54, RESERVE: 100 };

function stageFor(t: number): FillStage {
  if (t <= 0) return 'idle';
  if (t < T.arrival) return 'arrival';
  if (t < T.securing) return 'securing';
  if (t < T.connection) return 'connection';
  if (t < T.filling) return 'filling';
  if (t < T.completion) return 'completion';
  if (t < T.departure) return 'departure';
  return 'idle';
}

interface MotherState {
  active: boolean; // a fill cycle is in progress (not idle)
  paused: boolean;
  elapsed: number; // seconds into the sequence
  stage: FillStage;
  trailerId: string;
  trailersFilledToday: number;
  vehiclesToday: number;
  gasDispensedToday: number; // kg
  banks: Record<MotherBank, number>;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: (dt: number) => void;
}

export const useMotherStore = create<MotherState>((set, get) => ({
  active: false,
  paused: false,
  elapsed: 0,
  stage: 'idle',
  trailerId: TRAILER_ID,
  trailersFilledToday: 6,
  vehiclesToday: 92,
  gasDispensedToday: 1180,
  banks: { ...BANK_NOMINAL },

  start: () => {
    const s = get();
    if (s.active) {
      set({ paused: false }); // resume if paused
      return;
    }
    set({ active: true, paused: false, elapsed: 0.01, stage: 'arrival', banks: { ...BANK_NOMINAL } });
  },
  pause: () => set((s) => ({ paused: s.active ? !s.paused : s.paused })),
  reset: () => set({ active: false, paused: false, elapsed: 0, stage: 'idle', banks: { ...BANK_NOMINAL } }),

  tick: (dt) => {
    const s = get();
    // Banks recover toward nominal when not actively feeding a trailer.
    const banks = { ...s.banks };
    (Object.keys(banks) as MotherBank[]).forEach((b) => {
      if (banks[b] < BANK_NOMINAL[b]) banks[b] = Math.min(BANK_NOMINAL[b], banks[b] + dt * 1.5);
    });

    if (!s.active || s.paused) {
      set({ banks });
      return;
    }

    const elapsed = s.elapsed + dt;
    const stage = stageFor(elapsed);
    const patch: Partial<MotherState> = { elapsed, stage, banks };

    if (stage === 'filling') {
      // Draw the reserve bank down as the trailer fills.
      banks.RESERVE = Math.max(35, banks.RESERVE - dt * 4);
    }

    if (elapsed >= T.departure) {
      patch.active = false;
      patch.stage = 'idle';
      patch.elapsed = 0;
      patch.trailersFilledToday = s.trailersFilledToday + 1;
    }
    set(patch);
  },
}));

/** Fill progress 0..1 during the FILLING stage (0 before, 1 after). */
export function fillProgress(elapsed: number, stage: FillStage): number {
  if (stage === 'idle' || stage === 'arrival' || stage === 'securing' || stage === 'connection') return 0;
  if (stage === 'filling') return Math.min(1, (elapsed - T.connection) / (T.filling - T.connection));
  return 1; // completion / departure hold full
}

/** Current fill pressure (Bar). */
export function fillPressure(elapsed: number, stage: FillStage): number {
  return Math.round(fillProgress(elapsed, stage) * TARGET_BAR);
}

/** Whether the trailer earth clamp is engaged (green grounding lamp). */
export function isGrounded(stage: FillStage): boolean {
  return stage === 'securing' || stage === 'connection' || stage === 'filling' || stage === 'completion';
}

/** Whether the fill hoses are connected to the trailer. */
export function isConnected(stage: FillStage): boolean {
  return stage === 'connection' || stage === 'filling' || stage === 'completion';
}

/** Whether a trailer is physically present in the bay. */
export function trailerPresent(stage: FillStage): boolean {
  return stage !== 'idle';
}

/**
 * Trailer X offset (bay-local): drives in from −X during arrival, parks at 0,
 * drives out toward +X during departure.
 */
export function trailerOffsetX(elapsed: number, stage: FillStage): number {
  if (stage === 'idle') return -26;
  if (stage === 'arrival') {
    const k = Math.min(1, elapsed / T.arrival);
    return -26 + k * 26; // -26 → 0
  }
  if (stage === 'departure') {
    const k = Math.min(1, (elapsed - T.completion) / (T.departure - T.completion));
    return k * 30; // 0 → +30
  }
  return 0;
}

export const MOTHER_TARGET_BAR = TARGET_BAR;
export const MOTHER_STAGE_TIMES = T;
