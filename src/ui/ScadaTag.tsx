import { BRAND } from '@/theme/tokens';

/**
 * Section 09 §10 — instrument-level SCADA telemetry tag. A small three-line block
 * (tag / reporting RTU / scan rate) appended to every existing instrument info
 * panel so an engineer recognises the twin as modelled on a real, tagged system.
 */
export function ScadaTag({ tag, rtu, scan = '3 s' }: { tag: string; rtu: string; scan?: string }) {
  return (
    <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>
        <span aria-hidden>⬡</span> SCADA Telemetry
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Cell label="Tag" value={tag} mono />
        <Cell label="Reporting to" value={rtu} />
        <Cell label="Scan Rate" value={scan} />
      </div>
    </div>
  );
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className={`font-semibold ${mono ? 'tabular-nums' : ''}`}>{value}</div>
    </div>
  );
}
