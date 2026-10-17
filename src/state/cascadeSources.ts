import { useStationStore } from '@/state/useStationStore';
import { useMotherStore } from '@/state/useMotherStore';
import { useDaughterStore, daughterView, boosterView } from '@/state/useDaughterStore';

/**
 * Section 05 — the cascade-bank abstraction. Every fixed cascade in the scene is
 * three banks (LOW / MEDIUM / HIGH) filled and emptied in sequence. A CascadeSource
 * exposes a station's live bank pressures + active/refill bank so the shared
 * Priority Panel, cascade info panel and dashboard summary all read one shape.
 * Adapters derive it from each station's existing store WITHOUT changing them.
 */
export type Bank3 = 'LOW' | 'MEDIUM' | 'HIGH';
export const BANK3: Bank3[] = ['LOW', 'MEDIUM', 'HIGH'];
export const BANK_RANGE: Record<Bank3, [number, number]> = { LOW: [80, 120], MEDIUM: [120, 180], HIGH: [180, 250] };
export const BANK_COLOR3: Record<Bank3, string> = { LOW: '#0a5f5a', MEDIUM: '#0e8b82', HIGH: '#14b8a6' };

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
/** Percent-fill (0..100) → Bar within that bank's operating range. */
export function pctToBar(b: Bank3, pct: number): number {
  const [mn, mx] = BANK_RANGE[b];
  return mn + clamp(pct, 0, 100) / 100 * (mx - mn);
}
/** Bar → 0..1 fraction within the bank range (for gauges + glow). */
export function barFrac(b: Bank3, bar: number): number {
  const [mn, mx] = BANK_RANGE[b];
  return clamp((bar - mn) / (mx - mn), 0, 1);
}

export interface CascadeSource {
  banks: () => Record<Bank3, number>; // Bar
  active: () => Bank3 | null;
  refill: () => Bank3 | null;
  outlet: () => number; // Bar
  compressor: () => string; // 'IDLE' | 'RUNNING'
}

/** A gentle LOW→MEDIUM→HIGH active-bank cycle for stations without a live vehicle
 *  refuel loop, so their panels read as operational. */
function cycler(period = 4): Bank3 {
  const i = Math.floor(performance.now() / 1000 / period) % 3;
  return BANK3[i];
}

/** Online CNG Station — real refuel loop drives the active bank. */
export function onlineSource(): CascadeSource {
  return {
    banks: () => {
      const s = useStationStore.getState();
      return { LOW: pctToBar('LOW', s.banks.LOW), MEDIUM: pctToBar('MEDIUM', s.banks.MEDIUM), HIGH: pctToBar('HIGH', s.banks.HIGH) };
    },
    active: () => {
      const s = useStationStore.getState();
      return s.refueling && s.stage === 'filling' ? s.activeBank : null;
    },
    refill: () => useStationStore.getState().refillBank,
    outlet: () => {
      const s = useStationStore.getState();
      const b = s.refueling && s.stage === 'filling' ? s.activeBank : 'HIGH';
      return pctToBar(b, s.banks[b]);
    },
    compressor: () => (useStationStore.getState().refillBank ? 'RUNNING' : 'IDLE'),
  };
}

/** Mother Station — big HP cascade; cycles banks while dispensing. */
export function motherSource(): CascadeSource {
  const banks = () => {
    const b = useMotherStore.getState().banks;
    return { LOW: pctToBar('LOW', b.LOW), MEDIUM: pctToBar('MEDIUM', b.MEDIUM), HIGH: pctToBar('HIGH', b.HIGH) };
  };
  return {
    banks,
    active: cycler,
    refill: () => {
      const b = useMotherStore.getState().banks;
      if (b.HIGH < 97) return 'HIGH';
      if (b.MEDIUM < 78) return 'MEDIUM';
      if (b.LOW < 53) return 'LOW';
      return null;
    },
    outlet: () => banks()[cycler()],
    compressor: () => 'RUNNING',
  };
}

/** Daughter / Booster — trailer-fed; 3 banks derived from the cascade level. */
function trailerFedSource(get: () => number, active: () => Bank3 | null): CascadeSource {
  const banks = () => {
    const c = get();
    return {
      HIGH: clamp(c + 12, 180, 250),
      MEDIUM: clamp(c, 120, 180),
      LOW: clamp(c - 18, 80, 120),
    };
  };
  return { banks, active, refill: () => null, outlet: () => { const a = active(); return a ? banks()[a] : banks().HIGH; }, compressor: () => 'N/A' };
}
export function daughterSource(): CascadeSource {
  return trailerFedSource(
    () => useDaughterStore.getState().d.cascade,
    () => (daughterView(useDaughterStore.getState().d).status === 'OFFLINE' ? null : cycler(5)),
  );
}
export function boosterSource(): CascadeSource {
  return trailerFedSource(
    () => useDaughterStore.getState().b.cascade,
    () => (boosterView(useDaughterStore.getState().b).status === 'OFFLINE' ? null : cycler(5)),
  );
}
