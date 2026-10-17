import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useDaughterStore, daughterView, boosterView } from '@/state/useDaughterStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/**
 * Section 04 §A.6 / §B.x — bespoke inspection panels for the Daughter + Booster
 * stations, including the live cascade-pressure trend graph that is the core
 * demonstration (declining fill at the Daughter vs constant 200 Bar at the
 * Booster). Yields to a generic node selection or an active route highlight.
 */
const STATUS_COLOR: Record<string, string> = { OPTIMAL: BRAND.tealCng, DEGRADED: '#e0a23c', OFFLINE: BRAND.alert };

/** Cascade trend graph (0–250 Bar) with the 200 target + cutoff reference lines. */
function Trend({ history, showDispensing, cutoff }: { history: number[]; showDispensing: boolean; cutoff: number }) {
  const W = 232, H = 78;
  const yOf = (bar: number) => H - 4 - (bar / 250) * (H - 8);
  const data = history.length >= 2 ? history : [250, 250];
  const step = W / (data.length - 1);
  const line = data.map((v, i) => `${(i * step).toFixed(1)},${yOf(v).toFixed(1)}`).join(' L');
  return (
    <svg width={W} height={H} className="block">
      {/* reference lines */}
      <line x1={0} x2={W} y1={yOf(200)} y2={yOf(200)} stroke={showDispensing ? BRAND.tealCng : '#3a4656'} strokeWidth={showDispensing ? 1.5 : 1} strokeDasharray={showDispensing ? '' : '3 3'} />
      <line x1={0} x2={W} y1={yOf(cutoff)} y2={yOf(cutoff)} stroke={BRAND.alert} strokeWidth={1} strokeDasharray="3 3" />
      {/* cascade */}
      <path d={`M${line}`} fill="none" stroke="#8fb8d8" strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={(data.length - 1) * step} cy={yOf(data[data.length - 1])} r={2.2} fill="#8fb8d8" />
      <text x={2} y={yOf(200) - 3} fontSize={8} fill={showDispensing ? BRAND.tealCng : '#7a8698'}>{showDispensing ? 'dispensing 200 ✓' : '200 target'}</text>
      <text x={2} y={yOf(cutoff) - 3} fontSize={8} fill={BRAND.alert}>{cutoff} cutoff</text>
    </svg>
  );
}

export function DaughterInfoPanel() {
  const part = useDaughterInfoStore((s) => s.part);
  const close = useDaughterInfoStore((s) => s.close);
  useDaughterStore((s) => s.elapsed); // live refresh
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  if (!part || selectedId || routeActive) return null;

  const d = daughterView(useDaughterStore.getState().d);
  const b = boosterView(useDaughterStore.getState().b);
  const isBooster = part.startsWith('booster');

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.tealCng }}>
            CNG · {isBooster ? 'Daughter Booster' : 'Daughter Station'}
          </div>
          <h3 className="text-base font-bold leading-tight">{TITLES[part]}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/85 px-1 py-0.5" style={{ lineHeight: 0 }}>
            <img src="/assets/branding/adani_logo.png" alt="Adani" style={{ width: 40, height: 'auto', display: 'block', opacity: 0.9 }} draggable={false} />
          </span>
          <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">{PURPOSE[part]}</p>

      {/* ---------- DAUGHTER STATION ---------- */}
      {part === 'daughter-station' && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <Row label="Type" value="DAUGHTER" />
            <Row label="Pipeline" value="✗ NONE" accent={BRAND.alert} />
            <Row label="Compressor" value="✗ NONE" accent={BRAND.alert} />
            <Row label="Gas Source" value="Trailer CT-11" />
            <Row label="Cascade" value={`${Math.round(d.cascade)} Bar`} accent="#8fb8d8" />
            <Row label="Dispensing" value={`${Math.round(d.dispensing)} Bar`} accent={d.quality === 'NORMAL' ? BRAND.tealCng : '#e0a23c'} />
          </div>
          <div className="mt-2 rounded-lg bg-white/[0.04] px-2 py-1.5">
            <div className="mb-1 text-[9px] uppercase tracking-wide text-adani-muted">Cascade Pressure Trend</div>
            <Trend history={d.history} showDispensing={false} cutoff={80} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <Row label="Vehicles Served" value={fmt(d.vehicles)} />
            <Row label="Est. Remaining" value={fmt(d.estVehiclesLeft)} />
            <Row label="Stranded Gas" value={`${fmt(d.stranded)} SCM`} accent={BRAND.alert} />
            <Row label="Fill Quality" value={d.quality} accent={d.quality === 'NORMAL' ? BRAND.tealCng : '#e0a23c'} />
          </div>
          <StatusLine status={d.status} note={`Utilisation ~45%`} />
          <p className="mt-2 rounded-md bg-white/[0.04] px-2 py-1.5 text-[10px] leading-snug text-adani-muted">
            ℹ A booster compressor would extract gas down to ~40 Bar, raising utilisation from 45% to 85%.
          </p>
        </>
      )}
      {part === 'daughter-discharge' && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <Row label="Trailer" value="CT-11" />
          <Row label="Earthed" value="● YES" accent={BRAND.tealCng} />
          <Row label="Lines" value="3 of 3" />
          <Row label="Cascade" value={`${Math.round(d.cascade)} Bar`} accent="#8fb8d8" />
          <Row label="Remaining" value={`${Math.round((d.cascade / 250) * 100)}%`} />
          <Row label="Est. Vehicles" value={fmt(d.estVehiclesLeft)} />
          <Row label="Status" value={d.status} accent={STATUS_COLOR[d.status]} />
          <div className="col-span-2 mt-1 rounded-md bg-white/[0.04] px-2 py-1.5 text-[10px] text-adani-muted">
            ⚠ Dispensing pressure follows cascade pressure — fill quality reduces as it depletes.
          </div>
        </div>
      )}
      {part === 'daughter-priority' && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <Row label="Active Bank" value={`BANK ${d.activeBank}`} accent={BRAND.tealCng} />
          <Row label="Bank A" value={`${d.banks.A} Bar`} />
          <Row label="Bank B" value={`${d.banks.B} Bar`} />
          <Row label="Bank C" value={`${d.banks.C} Bar`} />
          <Row label="Bank D" value={`${d.banks.D} Bar`} />
          <Row label="Outlet" value={`${Math.round(d.dispensing)} Bar`} accent={d.dispensing < 200 ? '#e0a23c' : BRAND.tealCng} />
          <div className="col-span-2 mt-1 rounded-md bg-white/[0.04] px-2 py-1.5 text-[10px] text-adani-muted">
            ⚠ Without a booster, outlet pressure cannot exceed the current cascade bank pressure.
          </div>
        </div>
      )}

      {/* ---------- BOOSTER STATION ---------- */}
      {part === 'booster-station' && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <Row label="Type" value="BOOSTER" />
            <Row label="Pipeline" value="✗ NONE" accent={BRAND.alert} />
            <Row label="Booster" value="✓ 1 × 75 kW" accent={BRAND.tealCng} />
            <Row label="Gas Source" value="Trailer CT-07" />
            <Row label="Cascade" value={`${Math.round(b.cascade)} Bar`} accent="#8fb8d8" />
            <Row label="Dispensing" value="200 Bar ✓" accent={BRAND.tealCng} />
          </div>
          <div className="mt-2 rounded-lg bg-white/[0.04] px-2 py-1.5">
            <div className="mb-1 text-[9px] uppercase tracking-wide text-adani-muted">Pressure Comparison</div>
            <Trend history={b.history} showDispensing cutoff={40} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <Row label="Vehicles Served" value={fmt(b.vehicles)} />
            <Row label="Cascade Util." value="85%" accent={BRAND.tealCng} />
            <Row label="Gas Recovered" value={`${fmt(b.gasRecovered)} SCM`} accent={BRAND.tealCng} />
            <Row label="Booster Load" value={`${b.load}%`} accent={b.load > 80 ? '#e0a23c' : BRAND.tealCng} />
          </div>
          <StatusLine status={b.status} note="Fill quality ✓ CONSISTENT" />
        </>
      )}
      {part === 'booster-discharge' && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <Row label="Trailer" value="CT-07" />
          <Row label="Earthed" value="● YES" accent={BRAND.tealCng} />
          <Row label="Cascade" value={`${Math.round(b.cascade)} Bar`} accent="#8fb8d8" />
          <Row label="To Booster" value={`${Math.round(b.suction)} Bar`} />
          <Row label="Routes To" value="Booster Suction" />
          <Row label="Status" value={b.status} accent={STATUS_COLOR[b.status]} />
        </div>
      )}
      {part === 'booster-compressor' && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <Row label="Type" value="Recip · 2-stage" />
            <Row label="Suction" value={`${Math.round(b.suction)} Bar`} accent="#8fb8d8" />
            <Row label="Discharge" value="200 Bar ✓" accent={BRAND.tealCng} />
            <Row label="Capacity" value="400 SCMH" />
            <Row label="Motor" value="75 kW" />
            <Row label="Comp. Ratio" value={b.ratio} accent="#e0a23c" />
            <Row label="Load" value={`${b.load}%`} accent={b.load > 80 ? '#e0a23c' : BRAND.tealCng} />
            <Row label="Disch. Temp" value="41 °C" />
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${b.load}%`, background: b.load > 80 ? '#e0a23c' : BRAND.tealCng }} />
          </div>
          <StatusLine status={b.status} note={`Recovers gas otherwise stranded`} />
          <p className="mt-2 rounded-md bg-white/[0.04] px-2 py-1.5 text-[10px] leading-snug text-adani-muted">
            ✓ Cascade utilisation 85% (vs 45% without booster). As suction falls the booster works harder to hold 200 Bar.
          </p>
        </>
      )}
      {part === 'booster-buffer' && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <Row label="Cylinders" value="6 (2×3)" />
          <Row label="Capacity" value="1500 L" />
          <Row label="High Bank" value="208 Bar" accent={BRAND.tealCng} />
          <Row label="Low Bank" value="196 Bar" accent={BRAND.tealCng} />
          <Row label="Status" value="ONLINE" accent={BRAND.tealCng} />
        </div>
      )}
      <ScadaTag tag={isBooster ? 'PT-1301' : 'PT-1302'} rtu={isBooster ? 'RTU-10' : 'RTU-09'} />
    </div>
  );
}

function StatusLine({ status, note }: { status: string; note: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-[11px]">
      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[status] }} />
      <span className="font-semibold">{status}</span>
      <span className="ml-auto text-adani-muted">{note}</span>
    </div>
  );
}

const TITLES: Record<string, string> = {
  'daughter-station': 'CNG Daughter Station',
  'daughter-discharge': 'Cascade Discharge Panel',
  'daughter-priority': 'Priority Panel',
  'booster-station': 'Daughter Booster Station',
  'booster-discharge': 'Cascade Discharge Panel',
  'booster-compressor': 'Booster Compressor — Unit 01',
  'booster-buffer': 'Buffer Storage',
};
const PURPOSE: Record<string, string> = {
  'daughter-station': 'Cascade-fed station with NO compressor — dispensing pressure follows the depleting cascade, so fill quality declines and ~45% of the load is stranded.',
  'daughter-discharge': 'Transfers gas from the parked trailer to the dispensers by pressure differential. No compressor.',
  'daughter-priority': 'Sequences the trailer banks A→B→C→D as they deplete; outlet pressure is limited to the active bank.',
  'booster-station': 'Cascade-fed + booster: a small compressor holds a constant 200 Bar fill and extracts down to ~40 Bar (85% utilisation).',
  'booster-discharge': 'Feeds the depleting cascade to the booster suction rather than straight to the dispensers.',
  'booster-compressor': 'Boosts the depleting cascade so vehicles always get a consistent 200 Bar fill and gas is recovered instead of stranded.',
  'booster-buffer': 'Stores boosted gas at 200+ Bar so vehicles fill fast without waiting for the booster.',
};

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
