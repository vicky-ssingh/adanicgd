import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { usePerfStore, type BenchRow } from '@/state/usePerfStore';
import { useViewStore } from '@/state/useViewStore';
import { useSelectionStore } from '@/state/useSelectionStore';

/**
 * Section 17 §A.0 — reads the live WebGL renderer stats each frame and publishes
 * them to usePerfStore (~5 Hz) so the overlay can show them and they can be read
 * programmatically. Also runs the CAPTURE BENCHMARK: flies the camera through 5
 * fixed positions, holds 3 s at each, averages the stats, and writes a report.
 */
interface BenchPos { name: string; position: [number, number, number]; target: [number, number, number]; select?: string | null }
const BENCH: BenchPos[] = [
  { name: 'City overview', position: [92, 58, 116], target: [0, 6, 0], select: null },
  { name: 'Street level', position: [28, 3.2, -40], target: [8, 2, -54], select: null },
  { name: 'Inside CNG station', position: [80, 6, 84], target: [90, 3, 90], select: null },
  { name: 'DRS interior', position: [-46, 2.6, 26], target: [-48.5, 1.5, 20.5], select: 'drs3' },
  { name: 'Kitchen interior', position: [-63, 3.2, 133], target: [-57, 1.4, 127], select: null },
];
const HOLD = 3; // seconds per position
const SETTLE = 1.2; // seconds to let the camera arrive before sampling

export function PerfMonitor() {
  const gl = useThree((s) => s.gl);
  const setStats = usePerfStore((s) => s.setStats);
  const finishBenchmark = usePerfStore((s) => s.finishBenchmark);

  // rolling FPS
  const frames = useRef<number[]>([]);
  const acc = useRef(0);

  // benchmark state machine
  const bench = useRef<{ active: boolean; step: number; t: number; sampleT: number; fpsSum: number; frameSum: number; callSum: number; triSum: number; n: number; rows: BenchRow[] }>(
    { active: false, step: -1, t: 0, sampleT: 0, fpsSum: 0, frameSum: 0, callSum: 0, triSum: 0, n: 0, rows: [] },
  );

  const memMB = () => {
    const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    return m ? Math.round(m.usedJSHeapSize / 1048576) : 0;
  };

  useFrame((_, dt) => {
    const info = gl.info;
    const ms = dt * 1000;
    const fps = ms > 0 ? 1000 / ms : 0;
    frames.current.push(fps);
    if (frames.current.length > 60) frames.current.shift();

    // publish stats ~5 Hz
    acc.current += dt;
    const avgFps = frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
    if (acc.current >= 0.2) {
      acc.current = 0;
      setStats({
        fps: Math.round(avgFps),
        frameMs: +(1000 / Math.max(1, avgFps)).toFixed(1),
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
        memoryMB: memMB(),
      });
    }

    // ---- benchmark ----
    const st = usePerfStore.getState();
    const b = bench.current;
    if (st.benchmarking && !b.active) {
      // begin
      b.active = true; b.step = 0; b.t = 0; b.sampleT = 0; b.fpsSum = 0; b.frameSum = 0; b.callSum = 0; b.triSum = 0; b.n = 0; b.rows = [];
      const p = BENCH[0];
      useViewStore.getState().focusOn(p.position, p.target);
      useSelectionStore.getState().select(p.select ?? null);
    }
    if (b.active) {
      b.t += dt;
      // sample only after the camera has settled
      if (b.t > SETTLE) {
        b.fpsSum += fps; b.frameSum += ms; b.callSum += info.render.calls; b.triSum += info.render.triangles; b.n += 1;
      }
      if (b.t >= HOLD) {
        const p = BENCH[b.step];
        b.rows.push({
          position: p.name,
          fps: Math.round(b.fpsSum / Math.max(1, b.n)),
          frameMs: +(b.frameSum / Math.max(1, b.n)).toFixed(1),
          calls: Math.round(b.callSum / Math.max(1, b.n)),
          triangles: Math.round(b.triSum / Math.max(1, b.n)),
        });
        b.step += 1;
        b.t = 0; b.fpsSum = 0; b.frameSum = 0; b.callSum = 0; b.triSum = 0; b.n = 0;
        if (b.step >= BENCH.length) {
          // done
          b.active = false;
          useSelectionStore.getState().select(null);
          const rows = b.rows;
          finishBenchmark(rows);
          // eslint-disable-next-line no-console
          console.table(rows);
          console.log('[benchmark]\n' + benchToMarkdown(rows));
        } else {
          const np = BENCH[b.step];
          useViewStore.getState().focusOn(np.position, np.target);
          useSelectionStore.getState().select(np.select ?? null);
        }
      }
    }
  });

  return null;
}

export function benchToMarkdown(rows: BenchRow[]): string {
  const head = '| Position | FPS | Frame ms | Draw calls | Triangles |\n|---|---|---|---|---|';
  const body = rows.map((r) => `| ${r.position} | ${r.fps} | ${r.frameMs} | ${r.calls.toLocaleString()} | ${r.triangles.toLocaleString()} |`).join('\n');
  return `${head}\n${body}`;
}
