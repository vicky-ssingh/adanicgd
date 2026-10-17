import { create } from 'zustand';
import * as THREE from 'three';
import { TRAILER_CURVE, TRAILER_CURVE_LEN } from '@/config/trailerRoute';

/**
 * Section 03 — mobile cascade-trailer fleet logistics. Runs 3 trailers on a
 * continuous, road-following loop (fill at Mother → transit → discharge at
 * Daughter → return), each offset so the city always shows one filling, one in
 * transit and one discharging. Produces a per-trailer render snapshot (articulated
 * tractor + trailer transforms, fill %, status, doors/legs/coupled, wheel spin).
 * Local to Section 03 — does not touch the shared CGD sim engine.
 */

export type TrailerStatus =
  | 'EMPTY'
  | 'FILLING'
  | 'FULL'
  | 'IN_TRANSIT'
  | 'DISCHARGING'
  | 'RETURNING';

// Phase timing (sim seconds).
const T_FILL = 12;
const T_TRANSIT = 40;
const T_DISCHARGE = 12;
const T_RETURN = 40;
const CYCLE = T_FILL + T_TRANSIT + T_DISCHARGE + T_RETURN; // 104

// Rig geometry along the path (world units) → arc-length fractions.
const TRACTOR_FRONT = 5.4; // pin → cab front
const TRAILER_LEN = 11.5; // kingpin → rear axles
const fF = TRACTOR_FRONT / TRAILER_CURVE_LEN;
const fT = TRAILER_LEN / TRAILER_CURVE_LEN;

export interface Transform {
  pos: [number, number, number];
  rot: number;
}
export interface TrailerSnapshot {
  id: string;
  status: TrailerStatus;
  fillPercent: number;
  bank: Record<'A' | 'B' | 'C' | 'D', number>;
  tractor: Transform;
  trailer: Transform;
  tractorDetached: boolean;
  coupled: boolean;
  legsDown: boolean;
  doorsOpen: boolean;
  wheelSpin: number;
  moving: boolean;
  etaSec: number;
  distanceRemaining: number; // km
  origin: string;
  destination: string;
}

interface FleetTrailer {
  id: string;
  offset: number;
  origin: string;
  destination: string;
}

// Section 16 §B.3 — ONE moving trailer. CT-04 / CT-11 remain as STATIC parked
// assets at the Daughter / Booster stations (rendered by Section 04); the logistics
// panel lists them from the daughter store. A single validated rig cannot get stuck.
const FLEET: FleetTrailer[] = [
  { id: 'CT-07', offset: 0, origin: 'CNG Mother Station', destination: 'Daughter Booster Station' },
];

/** Ease-in-out so the rig ramps speed at start/stop instead of snapping (§B.5). */
const smooth = (k: number) => k * k * (3 - 2 * k);

const v = new THREE.Vector3();
const v2 = new THREE.Vector3();
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const yaw = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z);

/** Articulated rig transforms for a coupling-pin arc position s∈[0,1]. */
function rigAt(s: number): { tractor: Transform; trailer: Transform } {
  const pin = TRAILER_CURVE.getPointAt(clamp01(s), v).clone();
  const front = TRAILER_CURVE.getPointAt(clamp01(s + fF), v2).clone();
  const rear = TRAILER_CURVE.getPointAt(clamp01(s - fT), v2).clone();
  return {
    tractor: { pos: [pin.x, 0, pin.z], rot: yaw(pin, front) },
    trailer: { pos: [pin.x, 0, pin.z], rot: yaw(rear, pin) },
  };
}

/** Per-bank pressures from the current fill level (banks fill/drain D→A order). */
function banksFor(fillPercent: number): TrailerSnapshot['bank'] {
  const order = ['D', 'C', 'B', 'A'] as const; // fill order
  const p = fillPercent / 100;
  const out: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };
  order.forEach((b, i) => {
    // each bank spans a quarter of the fill; earlier banks fill first
    const lit = clamp01(p * 4 - i);
    out[b] = Math.round(lit * (b === 'A' ? 248 : b === 'B' ? 248 : b === 'C' ? 247 : 246));
  });
  return out;
}

function snapshot(t: FleetTrailer, elapsed: number, wheelSpin: number): TrailerSnapshot {
  const p = ((elapsed + t.offset) % CYCLE + CYCLE) % CYCLE;
  let status: TrailerStatus;
  let fillPercent: number;
  let rig: { tractor: Transform; trailer: Transform };
  let coupled = false;
  let legsDown = false;
  let doorsOpen = false;
  let tractorDetached = false;
  let moving = false;
  let etaSec = 0;
  let distanceRemaining = 0;

  if (p < T_FILL) {
    // FILLING at Mother (dwell at s≈0)
    fillPercent = (p / T_FILL) * 100;
    status = fillPercent > 96 ? 'FULL' : 'FILLING';
    rig = rigAt(0.002);
    legsDown = true;
    doorsOpen = true;
    tractorDetached = true;
  } else if (p < T_FILL + T_TRANSIT) {
    // IN TRANSIT Mother → Daughter (eased speed ramp)
    const k = smooth((p - T_FILL) / T_TRANSIT);
    fillPercent = 100;
    status = 'IN_TRANSIT';
    rig = rigAt(fT + k * (1 - fT));
    coupled = true;
    moving = true;
    etaSec = T_TRANSIT * (1 - k);
    distanceRemaining = 4.2 * (1 - k);
  } else if (p < T_FILL + T_TRANSIT + T_DISCHARGE) {
    // DISCHARGING at Daughter (dwell at s≈1)
    const k = (p - T_FILL - T_TRANSIT) / T_DISCHARGE;
    fillPercent = (1 - k) * 100;
    status = fillPercent < 4 ? 'EMPTY' : 'DISCHARGING';
    rig = rigAt(0.998);
    legsDown = true;
    doorsOpen = true;
    tractorDetached = true;
  } else {
    // RETURNING Daughter → Mother (reverse, eased)
    const k = smooth((p - T_FILL - T_TRANSIT - T_DISCHARGE) / T_RETURN);
    fillPercent = 0;
    status = 'RETURNING';
    rig = rigAt(fT + (1 - k) * (1 - fT));
    coupled = true;
    moving = true;
    etaSec = T_RETURN * (1 - k);
    distanceRemaining = 4.2 * (1 - k);
  }

  // Detach the tractor a little ahead while parked (uncoupled look).
  let tractor = rig.tractor;
  if (tractorDetached) {
    tractor = {
      pos: [tractor.pos[0] + Math.sin(tractor.rot) * 3.2, 0, tractor.pos[2] + Math.cos(tractor.rot) * 3.2],
      rot: tractor.rot,
    };
  }

  return {
    id: t.id,
    status,
    fillPercent,
    bank: banksFor(fillPercent),
    tractor,
    trailer: rig.trailer,
    tractorDetached,
    coupled,
    legsDown,
    doorsOpen,
    wheelSpin,
    moving,
    etaSec,
    distanceRemaining,
    origin: t.origin,
    destination: t.destination,
  };
}

interface TrailerState {
  elapsed: number;
  wheelSpin: number[]; // per trailer
  deliveriesToday: number;
  gasTransported: number; // SCM
  followId: string | null;
  tick: (dt: number) => void;
  setFollow: (id: string | null) => void;
  snapshots: () => TrailerSnapshot[];
  fleet: FleetTrailer[];
}

export const useTrailerStore = create<TrailerState>((set, get) => ({
  elapsed: 0,
  wheelSpin: [0],
  deliveriesToday: 7,
  gasTransported: 42000,
  followId: null,
  fleet: FLEET,

  tick: (dt) => {
    const s = get();
    const elapsed = s.elapsed + dt;
    const wheelSpin = s.wheelSpin.slice();
    FLEET.forEach((t, i) => {
      const snap = snapshot(t, elapsed, 0);
      if (snap.moving) wheelSpin[i] += dt * 9; // rad/s ≈ travel velocity
    });
    set({ elapsed, wheelSpin });
  },
  setFollow: (followId) => set({ followId }),
  snapshots: () => {
    const s = get();
    return FLEET.map((t, i) => snapshot(t, s.elapsed, s.wheelSpin[i]));
  },
}));
