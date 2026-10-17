import { create } from 'zustand';

/**
 * Section 17 §A.0 — in-app performance telemetry. PerfMonitor (inside the Canvas)
 * writes live renderer stats here every ~200 ms so the overlay can show them AND so
 * they can be read programmatically (renderer.info is otherwise unreachable from a
 * headless browser pane). Also drives the CAPTURE BENCHMARK fly-through.
 */
export interface PerfStats {
  fps: number;
  frameMs: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  memoryMB: number;
}

export interface BenchRow {
  position: string;
  fps: number;
  frameMs: number;
  calls: number;
  triangles: number;
}

interface PerfState {
  visible: boolean;
  stats: PerfStats;
  benchmarking: boolean;
  benchResult: BenchRow[] | null;
  toggle: () => void;
  setVisible: (v: boolean) => void;
  setStats: (s: PerfStats) => void;
  startBenchmark: () => void;
  finishBenchmark: (rows: BenchRow[]) => void;
}

const ZERO: PerfStats = { fps: 0, frameMs: 0, calls: 0, triangles: 0, geometries: 0, textures: 0, programs: 0, memoryMB: 0 };

export const usePerfStore = create<PerfState>((set) => ({
  visible: false,
  stats: ZERO,
  benchmarking: false,
  benchResult: null,
  toggle: () => set((s) => ({ visible: !s.visible })),
  setVisible: (visible) => set({ visible }),
  setStats: (stats) => set({ stats }),
  startBenchmark: () => set({ benchmarking: true, benchResult: null, visible: true }),
  finishBenchmark: (benchResult) => set({ benchmarking: false, benchResult }),
}));
