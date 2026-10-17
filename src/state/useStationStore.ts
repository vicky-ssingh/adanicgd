import { create } from 'zustand';
import { useSimStore } from '@/state/useSimStore';

/**
 * Online CNG Station live state (Section 01). Drives the vehicle refuelling
 * sequence, the priority-panel active-bank switching, cascade fill levels, the
 * dispenser display counters and the station's running totals. This is local to
 * the CNG station facility and does NOT touch the shared CGD simulation engine.
 */

export type BankId = 'HIGH' | 'MEDIUM' | 'LOW';
export type RefuelStage = 'idle' | 'filling' | 'done';

/** Nominal per-bank fill (spec §5 info panel) the banks recover toward. */
const BANK_NOMINAL: Record<BankId, number> = { HIGH: 93, MEDIUM: 71, LOW: 45 };
const PRICE_PER_KG = 89.5; // ₹/kg (matches dispenser display)
const TANK_CAPACITY = 14; // kg — a typical car CNG tank
const FILL_RATE = 1.6; // kg/s of sim time

interface StationState {
  /** Refuel sequence */
  refueling: boolean;
  stage: RefuelStage;
  dispensedKg: number;
  amount: number; // ₹
  fillPercent: number; // active vehicle tank 0..100
  activeBank: BankId;
  lastSwitch: string; // e.g. "MEDIUM → HIGH"
  switchAgo: number; // seconds since last bank switch

  /** Cascade buffer fill % per bank */
  banks: Record<BankId, number>;
  /** Cascade bank logic (Section 05) */
  refillBank: BankId | null; // bank the compressor is currently topping up
  switchesToday: number;

  /** Running totals (animated counters) */
  runningHours: number;
  vehiclesToday: number;
  gasDispensedToday: number; // kg

  startRefuel: () => void;
  stopRefuel: () => void;
  /** Advance local station animation by dt sim-seconds (called by a runner). */
  tick: (dt: number) => void;
}

function bankForProgress(kg: number): BankId {
  // Priority sequencing during a fill: Low first, then Medium, then High.
  if (kg < TANK_CAPACITY * 0.34) return 'LOW';
  if (kg < TANK_CAPACITY * 0.68) return 'MEDIUM';
  return 'HIGH';
}

export const useStationStore = create<StationState>((set, get) => ({
  refueling: false,
  stage: 'idle',
  dispensedKg: 0,
  amount: 0,
  fillPercent: 22,
  activeBank: 'LOW',
  lastSwitch: 'HIGH → LOW',
  switchAgo: 0,

  banks: { ...BANK_NOMINAL },
  refillBank: null,
  switchesToday: 63,

  runningHours: 4820,
  vehiclesToday: 187,
  gasDispensedToday: 2140,

  startRefuel: () =>
    set({
      refueling: true,
      stage: 'filling',
      dispensedKg: 0,
      amount: 0,
      fillPercent: 22,
      activeBank: 'LOW',
      lastSwitch: 'HIGH → LOW',
      switchAgo: 0,
    }),

  stopRefuel: () => set({ refueling: false, stage: 'idle' }),

  tick: (dt) => {
    const s = get();
    const scenario = useSimStore.getState().scenario;
    // Scenario response (Section 05 §11): demand → depletion, refill throughput.
    const depleteMul = scenario === 'high-demand' || scenario === 'cng-demand-up' ? 1.8 : scenario === 'low-demand' ? 0.6 : 1;
    const refillRate = (scenario === 'pressure-drop' ? 0.6 : scenario === 'low-demand' ? 1.8 : 1.2);
    const noRefill = scenario === 'equipment-shutdown';

    const banks = { ...s.banks };
    // Compressor refills banks SEQUENTIALLY in reverse priority: HIGH → MEDIUM →
    // LOW (HIGH is needed first for the next vehicle's top-up).
    let refillBank: BankId | null = null;
    if (!noRefill) {
      for (const b of ['HIGH', 'MEDIUM', 'LOW'] as BankId[]) {
        if (banks[b] < BANK_NOMINAL[b] - 0.3) {
          banks[b] = Math.min(BANK_NOMINAL[b], banks[b] + dt * refillRate);
          refillBank = b;
          break;
        }
      }
    }

    const patch: Partial<StationState> = {
      runningHours: s.runningHours + dt / 3600,
      switchAgo: s.switchAgo + dt,
      banks,
      refillBank,
    };

    if (s.refueling && s.stage === 'filling') {
      const kg = Math.min(TANK_CAPACITY, s.dispensedKg + FILL_RATE * dt);
      const nextBank = bankForProgress(kg);
      if (nextBank !== s.activeBank) {
        patch.activeBank = nextBank;
        patch.lastSwitch = `${s.activeBank} → ${nextBank}`;
        patch.switchAgo = 0;
        patch.switchesToday = s.switchesToday + 1;
      }
      // Draw the active bank down as it feeds the vehicle (faster on high demand).
      banks[nextBank] = Math.max(20, banks[nextBank] - dt * 6 * depleteMul);
      patch.dispensedKg = kg;
      patch.amount = kg * PRICE_PER_KG;
      patch.fillPercent = 22 + (kg / TANK_CAPACITY) * 76;
      if (kg >= TANK_CAPACITY) {
        patch.stage = 'done';
        patch.vehiclesToday = s.vehiclesToday + 1;
        patch.gasDispensedToday = s.gasDispensedToday + kg;
      }
    } else if (s.stage === 'done') {
      // brief pause on the completed reading, then reset to idle
      patch.switchAgo = s.switchAgo + dt;
      if (s.switchAgo > 2.5) {
        patch.refueling = false;
        patch.stage = 'idle';
      }
    }

    set(patch);
  },
}));

export const STATION_PRICE_PER_KG = PRICE_PER_KG;
export const STATION_TANK_CAPACITY = TANK_CAPACITY;
