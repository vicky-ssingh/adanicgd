import { useSelectionStore } from '@/state/useSelectionStore';
import { useSimStore } from '@/state/useSimStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useDrsStore } from '@/state/useDrsStore';
import { NODES_BY_ID } from '@/config/network';
import { DRS_UNITS } from '@/config/drsUnits';
import { ScadaTag } from './ScadaTag';
import { fmt, fmtFlow, fmtPressure } from '@/utils/format';
import { BRAND } from '@/theme/tokens';

/**
 * Section 15 §D.3/§D.4 — bespoke DRS info panel. Keeps the existing live inlet /
 * outlet pressure and flow, and adds duty/standby stream status, protection
 * status, SCADA tag, and a SWITCH DUTY STREAM control that reroutes the internal
 * flow. Replaces the generic node panel for DRS nodes only.
 */
const RTU_BY_DRS: Record<string, string> = { drs1: 'RTU-03', drs2: 'RTU-04', drs3: 'RTU-05' };
const TAG_BY_DRS: Record<string, string> = { drs1: 'PT-2031', drs2: 'PT-2032', drs3: 'PT-2031' };

export function DrsInfoPanel() {
  const selectedId = useSelectionStore((s) => s.selectedId);
  const clear = useSelectionStore((s) => s.clear);
  const values = useSimStore((s) => s.values);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const duty = useDrsStore((s) => (selectedId ? s.duty[selectedId] : undefined));
  const switchDuty = useDrsStore((s) => s.switchDuty);

  if (routeActive || !selectedId) return null;
  const node = NODES_BY_ID[selectedId];
  if (!node || node.type !== 'drs') return null;
  const unit = DRS_UNITS[selectedId];
  const v = values[selectedId];
  const d = duty ?? unit?.dutyDefault ?? 1;
  const inEdge = 8.0; // secondary inlet (nominal, unchanged)

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-7rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>Distribution · DRS</div>
          <h3 className="text-base font-bold leading-tight">District Regulating Station — {unit?.no ?? node.label}</h3>
          <div className="text-[11px] text-adani-muted">Adani Total Gas Limited</div>
        </div>
        <button onClick={clear} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        Reduces pressure from the secondary distribution network to local level, and protects downstream consumers against overpressure.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Inlet Pressure" value={`${fmt(inEdge, 1)} Bar`} />
        <Row label="Outlet Pressure" value={v ? fmtPressure(v.pressure) : '4.0 Bar'} accent={BRAND.tealCng} />
        <Row label="Flow Rate" value={`${v ? fmtFlow(v.flow) : '2,100'} SCMH`} />
        <Row label="Capacity" value="3,000 SCMH" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Stream 1" value={d === 1 ? '● DUTY' : '○ STANDBY'} accent={d === 1 ? BRAND.tealCng : undefined} />
        <Row label="Stream 2" value={d === 2 ? '● DUTY' : '○ STANDBY'} accent={d === 2 ? BRAND.tealCng : undefined} />
        <Row label="Slam-Shut" value="● SET" accent={BRAND.tealCng} />
        <Row label="Creep Relief" value="● NORMAL" accent={BRAND.tealCng} />
        <Row label="Filter DP" value="0.08 Bar" />
        <Row label="Kiosk" value="● SECURE" accent={BRAND.tealCng} />
      </div>

      <button
        onClick={() => switchDuty(selectedId)}
        className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}
      >
        ⇄ Switch Duty Stream
      </button>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Gas Detector" value="● NORMAL" accent={BRAND.tealCng} />
        <Row label="Downstream" value="142 PNG · 1 CNG" />
        <Row label="Status" value="● ONLINE" accent={BRAND.tealCng} />
        <Row label="Last Insp." value="12 Sep" />
      </div>

      <ScadaTag tag={TAG_BY_DRS[selectedId] ?? 'PT-2031'} rtu={RTU_BY_DRS[selectedId] ?? 'RTU-05'} />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
