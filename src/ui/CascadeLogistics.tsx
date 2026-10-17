import { useState } from 'react';
import { useTrailerStore, type TrailerStatus } from '@/state/useTrailerStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useViewStore } from '@/state/useViewStore';
import { useDaughterStore, daughterView, boosterView } from '@/state/useDaughterStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';

/**
 * Section 03 §7 / Section 16 §B.4 — Cascade Logistics dashboard panel. Now lists
 * the ONE moving trailer (CT-07) plus the TWO static parked trailers (CT-04 at the
 * Daughter Station, CT-11 at the Booster), whose live depleting fill comes from the
 * Section-04 daughter store. Each row focuses the camera on that trailer.
 */
const STATUS_COLOR: Record<TrailerStatus, string> = {
  EMPTY: '#9fb2c8',
  FILLING: BRAND.tealCng,
  FULL: BRAND.tealCng,
  IN_TRANSIT: BRAND.primarySoft,
  DISCHARGING: '#e0a23c',
  RETURNING: '#9fb2c8',
};

function locationFor(status: TrailerStatus): string {
  if (status === 'FILLING' || status === 'FULL') return 'Mother Stn';
  if (status === 'IN_TRANSIT') return '→ D.Booster';
  if (status === 'DISCHARGING' || status === 'EMPTY') return 'Daughter Stn';
  return '→ Mother Stn';
}

interface Row { id: string; status: string; color: string; location: string; fill: number; pos: [number, number, number]; rot: number }
const barToPct = (bar: number) => Math.max(0, Math.min(100, Math.round((bar / 250) * 100)));

export function CascadeLogistics() {
  const [open, setOpen] = useState(true);
  useTrailerStore((s) => s.elapsed); // live refresh
  useDaughterStore((s) => s.elapsed); // live refresh parked fills
  const deliveriesToday = useTrailerStore((s) => s.deliveriesToday);
  const gasTransported = useTrailerStore((s) => s.gasTransported);
  const openInfo = useTrailerInfoStore((s) => s.open);
  const focusOn = useViewStore((s) => s.focusOn);
  const snap = useTrailerStore.getState().snapshots()[0];
  const d = daughterView(useDaughterStore.getState().d);
  const b = boosterView(useDaughterStore.getState().b);

  const rows: Row[] = [
    { id: snap.id, status: snap.status.replace('_', ' '), color: STATUS_COLOR[snap.status], location: locationFor(snap.status), fill: snap.fillPercent, pos: snap.tractor.pos, rot: snap.tractor.rot },
    { id: 'CT-04', status: 'DISCHARGING', color: '#e0a23c', location: 'Daughter Stn', fill: barToPct(d.cascade), pos: [130, 0, 40], rot: 0 },
    { id: 'CT-11', status: 'CONNECTED', color: BRAND.tealCng, location: 'D.Booster', fill: barToPct(b.cascade), pos: [-150, 0, 20], rot: 0 },
  ];

  const onRow = (r: Row) => {
    if (r.id === snap.id) openInfo(r.id);
    focusOn([r.pos[0] - Math.sin(r.rot) * 18, 12, r.pos[2] - Math.cos(r.rot) * 18], [r.pos[0], 2, r.pos[2]]);
  };

  return (
    <div className="adani-panel pointer-events-auto w-56 p-3 sm:w-64">
      <button onClick={() => setOpen((o) => !o)} className="mb-2 flex w-full items-center gap-1.5" aria-expanded={open}>
        <span className="text-xs font-bold tracking-wide">CASCADE LOGISTICS</span>
        <span className="text-[10px] text-adani-muted">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <>
          <div className="flex flex-col gap-1">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => onRow(r)}
                className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2 py-1.5 text-left text-[11px] hover:bg-white/10"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="w-10 font-bold tabular-nums">{r.id}</span>
                <span className="flex-1 truncate text-adani-muted">{r.status}</span>
                <span className="w-16 truncate text-right text-adani-muted">{r.location}</span>
                <span className="w-9 text-right font-semibold tabular-nums">{fmt(r.fill, 0)}%</span>
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            <Stat label="Active" value="3" />
            <Stat label="Deliveries" value={fmt(deliveriesToday)} />
            <Stat label="Gas SCM" value={fmt(gasTransported)} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] px-1.5 py-1">
      <div className="text-[13px] font-bold tabular-nums">{value}</div>
      <div className="text-[8px] uppercase tracking-wide text-adani-muted">{label}</div>
    </div>
  );
}
