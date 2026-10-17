import { create } from 'zustand';
import * as THREE from 'three';

/**
 * Section 07 Part B — pig launcher/receiver + pigging-run animation. A pig travels
 * the main pipeline from the launcher (PL-01, City Gate) to the receiver (PR-01,
 * far end): doors open/close, the barrel pressurises, a glowing marker runs the
 * route, the pig signaller flag flips as it passes, and a dashboard log fires.
 */
const PIG_PATH = new THREE.CatmullRomCurve3(
  [
    [108, 0.5, -88], [90, 0.5, -90], [81, 0.6, -90], [45, 0.7, -63],
    [0, 0.7, -19], [-48, 0.7, 20], [-58, 0.5, 26],
  ].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  false,
  'catmullrom',
  0.15,
);

// Stage end-times (sim seconds).
const T = { open1: 2, load: 4, close1: 6, press: 8, travel: 28, open2: 30, done: 33 };

interface PigState {
  running: boolean;
  elapsed: number;
  logUntil: number; // performance.now ms while the completion log shows
  panelId: 'PL-01' | 'PR-01' | null;
  openPanel: (id: 'PL-01' | 'PR-01') => void;
  closePanel: () => void;
  start: () => void;
  tick: (dt: number) => void;
}

export const usePigStore = create<PigState>((set, get) => ({
  running: false,
  elapsed: 0,
  logUntil: 0,
  panelId: null,
  openPanel: (panelId) => set({ panelId }),
  closePanel: () => set({ panelId: null }),
  start: () => { if (!get().running) set({ running: true, elapsed: 0.01 }); },
  tick: (dt) => {
    const s = get();
    if (!s.running) return;
    const elapsed = s.elapsed + dt;
    if (elapsed >= T.done) { set({ running: false, elapsed: 0, logUntil: performance.now() + 6000 }); return; }
    set({ elapsed });
  },
}));

/** Derived view of the pigging run for the components. */
export function pigView() {
  const s = usePigStore.getState();
  const t = s.elapsed;
  const running = s.running;
  // launcher door: 1 locked … 0 open
  let launcherDoor = 1;
  if (running) {
    if (t < T.open1) launcherDoor = 1 - t / T.open1;
    else if (t < T.close1) launcherDoor = t < T.load ? 0 : (t - T.load) / (T.close1 - T.load);
    else launcherDoor = 1;
  }
  let receiverDoor = 1;
  if (running && t > T.travel) receiverDoor = 1 - Math.min(1, (t - T.travel) / (T.open2 - T.travel));
  const traveling = running && t >= T.press && t <= T.travel;
  const progress = traveling ? (t - T.press) / (T.travel - T.press) : t > T.travel ? 1 : 0;
  const pigPos = PIG_PATH.getPointAt(Math.max(0, Math.min(1, progress)));
  const signallerFlipped = traveling && progress > 0.12;
  const pressurised = running && t >= T.close1 && t <= T.travel;
  return { running, launcherDoor, receiverDoor, traveling, progress, pigPos, signallerFlipped, pressurised, logActive: performance.now() < s.logUntil };
}

export { PIG_PATH };
