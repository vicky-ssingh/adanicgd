import { create } from 'zustand';

/**
 * Section 09 §8.2 — SCADA event / alarm log. A rolling list of network events,
 * colour-coded by severity, each optionally carrying a camera focus so clicking
 * a row flies to the relevant asset. Entries are appended live by EventLogRunner
 * as real simulation state transitions occur; a small seed makes the HMI read as
 * an operations tool from the first frame.
 */
export type Severity = 'info' | 'warn' | 'crit';

export interface LogEntry {
  key: number;
  time: string; // HH:MM:SS
  sev: Severity;
  text: string;
  focus?: { position: [number, number, number]; target: [number, number, number] };
}

const MAX = 60;
let seq = 1;

function clock(offsetSec = 0): string {
  const d = new Date(Date.now() - offsetSec * 1000);
  return d.toTimeString().slice(0, 8);
}

/** A realistic starting log (spec §8.2) so the panel is never empty. */
function seed(): LogEntry[] {
  const rows: { off: number; sev: Severity; text: string }[] = [
    { off: 24, sev: 'warn', text: 'RTU-09 comms degraded — signal 42%' },
    { off: 231, sev: 'info', text: 'Cascade CT-04 dispatched — 250 Bar' },
    { off: 593, sev: 'info', text: 'Priority panel PP-01 LOW → MEDIUM' },
    { off: 762, sev: 'warn', text: 'Daughter Stn cascade low — 118 Bar' },
    { off: 1015, sev: 'info', text: 'Compressor Unit 03 started — demand' },
    { off: 1388, sev: 'info', text: 'Odorant dosing 12.1 mg/SCM — normal' },
    { off: 1810, sev: 'info', text: 'Vehicle refuel complete — Lane 2' },
  ];
  return rows.map((r) => ({ key: seq++, time: clock(r.off), sev: r.sev, text: r.text }));
}

interface EventLogState {
  entries: LogEntry[];
  push: (sev: Severity, text: string, focus?: LogEntry['focus']) => void;
  clear: () => void;
}

export const useEventLogStore = create<EventLogState>((set) => ({
  entries: seed(),
  push: (sev, text, focus) =>
    set((s) => ({ entries: [{ key: seq++, time: clock(0), sev, text, focus }, ...s.entries].slice(0, MAX) })),
  clear: () => set({ entries: [] }),
}));

/** Convenience for runners outside React. */
export function logEvent(sev: Severity, text: string, focus?: LogEntry['focus']) {
  useEventLogStore.getState().push(sev, text, focus);
}
