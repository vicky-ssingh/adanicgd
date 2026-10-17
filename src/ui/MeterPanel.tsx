import { useEffect, useRef, useState } from 'react';
import { useMeterStore } from '@/state/useMeterStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useSimStore } from '@/state/useSimStore';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/**
 * PNG meter-box service panel (wall-pipework fix). Shown when a meter box is
 * clicked; the supply route is highlighted in 3D at the same time. Meter reading
 * animates while the sim runs. Clears on close / empty click / Escape.
 */
export function MeterPanel() {
  const active = useMeterStore((s) => s.active);
  const info = useMeterStore((s) => s.info);
  const close = useMeterStore((s) => s.close);
  const clearRoute = useRouteStore((s) => s.clear);
  const clearSelection = useSelectionStore((s) => s.clear);

  const reading = useRef(4821.6);
  const [display, setDisplay] = useState('4821.60');

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = useSimStore.getState();
      if (active && s.playing && info) {
        reading.current += (info.flow / 3600) * 0.5 * s.speed; // m³ accrued
        setDisplay(reading.current.toFixed(2));
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [active, info]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        clearRoute();
        clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, clearRoute, clearSelection]);

  if (!active || !info) return null;

  return (
    <div className="adani-panel pointer-events-auto absolute right-4 top-20 w-72 overflow-hidden p-0">
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold leading-tight text-white">PNG SERVICE CONNECTION</h3>
          <div className="text-[11px]" style={{ color: BRAND.primarySoft }}>
            Adani Total Gas Limited
          </div>
        </div>
        <button
          onClick={() => {
            close();
            clearRoute();
          }}
          className="rounded px-1.5 text-adani-muted hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 border-t border-[color:var(--panel-border)] px-4 py-3 text-[12px]">
        <Row label="Connection Type" value={info.connectionType} />
        <Row label="Meter Type" value={info.meterType} />
        <Row label="Service Pressure" value="21 mbar" />
        <Row label="Flow Rate" value={`${info.flow} SCMH`} />
        <Row
          label="Status"
          value={
            <span className="inline-flex items-center gap-1 font-bold" style={{ color: BRAND.primarySoft }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND.primarySoft, boxShadow: `0 0 6px ${BRAND.primarySoft}` }} />
              ACTIVE
            </span>
          }
        />
        <Row label="Meter Reading" value={<span className="tabular-nums">{display} m³</span>} />
      </div>

      <div className="border-t border-[color:var(--panel-border)] px-4 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-adani-muted">Supply Route</div>
        <div className="mt-1 text-[12px] font-medium text-[color:var(--hud-text)]">
          DRS → MDPE → Service Line → This Unit
        </div>
        <ScadaTag tag="FT-7003" rtu="RTU-05" scan="60 s" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-adani-muted">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
