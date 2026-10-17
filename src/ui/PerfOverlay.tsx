import { useEffect } from 'react';
import { usePerfStore } from '@/state/usePerfStore';
import { benchToMarkdown } from '@/components3d/PerfMonitor';
import { BRAND } from '@/theme/tokens';

/**
 * Section 17 §A.0 — in-app performance overlay. Toggle with Shift+P (or the
 * dashboard dev control). Shows live renderer stats and a CAPTURE BENCHMARK button
 * that flies through 5 fixed positions and writes a downloadable before/after
 * report. Debug aid; hidden by default.
 */
export function PerfOverlay() {
  const visible = usePerfStore((s) => s.visible);
  const toggle = usePerfStore((s) => s.toggle);
  const stats = usePerfStore((s) => s.stats);
  const benchmarking = usePerfStore((s) => s.benchmarking);
  const benchResult = usePerfStore((s) => s.benchResult);
  const startBenchmark = usePerfStore((s) => s.startBenchmark);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.shiftKey && (e.key === 'P' || e.key === 'p')) { e.preventDefault(); toggle(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  if (!visible) return null;
  const fpsColor = stats.fps >= 50 ? BRAND.tealCng : stats.fps >= 40 ? '#e0a23c' : BRAND.alert;

  const download = () => {
    if (!benchResult) return;
    const md = `# Benchmark — Adani CGD Digital Twin\n\n${benchToMarkdown(benchResult)}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'benchmark.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="adani-panel pointer-events-auto absolute bottom-4 right-4 z-40 w-56 p-3 font-mono text-[11px]">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide">PERFORMANCE</span>
        <button onClick={toggle} className="rounded px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <Row label="FPS" value={`${stats.fps}`} accent={fpsColor} bold />
      <Row label="Frame" value={`${stats.frameMs} ms`} />
      <Row label="Draw calls" value={stats.calls.toLocaleString()} />
      <Row label="Triangles" value={fmtM(stats.triangles)} />
      <Row label="Geometries" value={`${stats.geometries}`} />
      <Row label="Textures" value={`${stats.textures}`} />
      <Row label="Programs" value={`${stats.programs}`} />
      <Row label="JS memory" value={stats.memoryMB ? `${stats.memoryMB} MB` : 'n/a'} />

      <button
        onClick={startBenchmark}
        disabled={benchmarking}
        className="mt-2 w-full rounded-md px-2 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}
      >
        {benchmarking ? 'Capturing…' : '⏺ Capture Benchmark'}
      </button>

      {benchResult && (
        <div className="mt-2 rounded-md bg-white/[0.04] p-1.5">
          <div className="mb-1 flex items-center justify-between text-[10px] text-adani-muted">
            <span>Result (avg)</span>
            <button onClick={download} className="rounded bg-white/10 px-1.5 hover:bg-white/20">⤓ .md</button>
          </div>
          {benchResult.map((r) => (
            <div key={r.position} className="flex justify-between">
              <span className="truncate text-adani-muted">{r.position}</span>
              <span className="tabular-nums" style={{ color: r.fps >= 45 ? BRAND.tealCng : '#e0a23c' }}>{r.fps} / {r.calls}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtM(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} K`;
  return `${n}`;
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-adani-muted">{label}</span>
      <span className={`tabular-nums ${bold ? 'font-bold' : ''}`} style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}
