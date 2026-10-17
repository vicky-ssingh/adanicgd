import { useOdorStore, odorView, odorAlert } from '@/state/useOdorStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { fmt, fmtFlow } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/**
 * Section 06 §9 — odorization unit info panel. Live dosing rate, target-band
 * check, gas flow, odorant consumption, tank level, pump duty/standby, and status
 * (with a critical alarm if odorization goes offline). Yields to any other open
 * panel (network selection, route, or the CNG station bespoke panels).
 */
export function OdorInfoPanel() {
  const panelOpen = useOdorStore((s) => s.panelOpen);
  const close = useOdorStore((s) => s.close);
  useOdorStore((s) => s.tankPct); // live refresh
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const stationPart = useStationInfoStore((s) => s.part);
  const motherPart = useMotherInfoStore((s) => s.part);
  const daughterPart = useDaughterInfoStore((s) => s.part);
  const trailerId = useTrailerInfoStore((s) => s.id);

  if (!panelOpen || selectedId || routeActive || stationPart || motherPart || daughterPart || trailerId) return null;
  const v = odorView();
  const al = odorAlert();
  const inRange = v.dosingRate >= 10 && v.dosingRate <= 15;

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.tealCng }}>Common · City Gate Station</div>
          <h3 className="text-base font-bold leading-tight">Odorization Unit</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/85 px-1 py-0.5" style={{ lineHeight: 0 }}>
            <img src="/assets/branding/adani_logo.png" alt="Adani" style={{ width: 40, height: 'auto', display: 'block', opacity: 0.9 }} draggable={false} />
          </span>
          <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        Injects mercaptan odorant into odourless natural gas so leaks can be detected by smell. Mandatory under PNGRB.
      </p>

      {al.kind === 'offline' && (
        <div className="mt-3 rounded-md px-2 py-1.5 text-[11px] font-bold" style={{ background: `${BRAND.alert}2a`, color: '#f7b7c6' }}>{al.text}</div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Dosing Rate" value={`${fmt(v.dosingRate, 1)} mg/SCM`} accent={inRange ? BRAND.tealCng : '#e0a23c'} />
        <Row label="Target" value={`10–15 ${inRange ? '✓' : '⚠'}`} accent={inRange ? BRAND.tealCng : '#e0a23c'} />
        <Row label="Gas Flow" value={`${fmtFlow(v.gasFlow)} SCMH`} />
        <Row label="Consumption" value={`${fmt(v.consumption)} g/hr`} />
        <Row label="Capacity" value={`${fmt(v.capacityL)} L`} />
        <Row label="Remaining" value={`${fmt(v.remainingL)} L`} />
      </div>

      {/* Tank level */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-adani-muted">
        <span>TANK LEVEL</span><span className="tabular-nums">{Math.round(v.tankPct)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${v.tankPct}%`, background: v.tankPct < 20 ? BRAND.alert : v.tankPct < 40 ? '#e0a23c' : BRAND.tealCng }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Days to Refill" value={fmt(v.daysToRefill)} />
        <Row label="Pump A" value={v.pumpsOn ? '● RUNNING' : '○ STOPPED'} accent={v.pumpsOn ? BRAND.tealCng : BRAND.alert} />
        <Row label="Pump B" value="○ STANDBY" />
        <Row label="Injection Pt" value={v.pumpsOn ? '● OPEN' : '○ CLOSED'} accent={v.pumpsOn ? BRAND.tealCng : undefined} />
        <Row label="Gas Detect" value="● NORMAL" accent={BRAND.tealCng} />
        <Row label="Last Refill" value="09 Sep" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="h-2 w-2 rounded-full" style={{ background: v.status === 'ONLINE' ? BRAND.tealCng : BRAND.alert }} />
        <span className="font-semibold">{v.status}</span>
        {al.kind === 'low' && <span className="ml-auto text-[10px]" style={{ color: '#e0a23c' }}>{al.text}</span>}
        {al.kind === 'critical' && <span className="ml-auto text-[10px]" style={{ color: BRAND.alert }}>{al.text}</span>}
      </div>
      <ScadaTag tag="AT-6001" rtu="RTU-15" />
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
