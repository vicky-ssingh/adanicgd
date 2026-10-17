import { useEffect, useRef, useState } from 'react';
import { useScadaStore, telemetryStats } from '@/state/useScadaStore';
import { DEGRADED_RTU, RTU_BY_ID } from '@/config/scadaLayout';
import { BRAND } from '@/theme/tokens';

/**
 * Section 09 §8.1 — dashboard telemetry status widget + the SHOW SCADA LAYER
 * toggle. An ADDITION beside the existing dashboard (it does not alter it).
 */
export function TelemetryWidget() {
  const [open, setOpen] = useState(true);
  const layerOn = useScadaStore((s) => s.layerOn);
  const toggleLayer = useScadaStore((s) => s.toggleLayer);
  const [, force] = useState(0);
  const raf = useRef(0);

  // Light refresh so the packet counter ticks up.
  useEffect(() => {
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 250) { last = t; force((n) => n + 1); }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const s = telemetryStats();
  const packets = useScadaStore.getState().packetsToday;
  const deg = RTU_BY_ID[DEGRADED_RTU];

  return (
    <div className="adani-panel pointer-events-auto w-56 p-3 sm:w-64">
      <button onClick={() => setOpen((o) => !o)} className="mb-2 flex w-full items-center gap-1.5" aria-expanded={open}>
        <span className="text-xs font-bold tracking-wide">⬡ SCADA TELEMETRY</span>
        <span className="ml-auto text-[10px] text-adani-muted">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <Cell label="RTUs Online" value={`${s.online} / ${s.total}`} accent={BRAND.primarySoft} />
            <Cell label="Availability" value={`${s.availability.toFixed(1)}%`} accent={s.availability >= 99 ? BRAND.tealCng : '#e0a23c'} />
            <Cell label="Poll Cycle" value="3 s" />
            <Cell label="Data Points" value={`${s.totalDataPoints}`} />
          </div>
          <div className="mt-1.5 rounded-md bg-white/[0.04] px-2 py-1">
            <div className="text-[9px] uppercase tracking-wide text-adani-muted">Packets Today</div>
            <div className="font-bold tabular-nums" style={{ color: BRAND.primarySoft }}>{packets.toLocaleString()}</div>
          </div>
          {s.degraded > 0 && (
            <div className="mt-1.5 rounded-md px-2 py-1 text-[10px] font-semibold" style={{ background: '#e0a23c22', color: '#f2d199' }}>
              ⚠ {deg.id} degraded — signal {deg.signalPct}%
            </div>
          )}
          <button
            onClick={toggleLayer}
            className="mt-2 w-full rounded-md px-3 py-2 text-[11px] font-bold transition-colors"
            style={{
              background: layerOn ? `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` : 'rgba(255,255,255,0.08)',
              color: layerOn ? '#fff' : 'var(--hud-text)',
            }}
            aria-pressed={layerOn}
          >
            ⬡ {layerOn ? 'HIDE SCADA LAYER' : 'SHOW SCADA LAYER'}
          </button>
        </>
      )}
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
      <div className="text-[9px] font-medium uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="mt-0.5 font-bold tabular-nums" style={{ color: accent ?? 'var(--hud-text)' }}>{value}</div>
    </div>
  );
}
