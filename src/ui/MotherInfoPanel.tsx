import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import {
  useMotherStore,
  fillPressure,
  fillProgress,
  MOTHER_TARGET_BAR,
  type MotherBank,
} from '@/state/useMotherStore';
import { useSimStore } from '@/state/useSimStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { fmt, fmtFlow } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/**
 * Section 02 §3–§11 — bespoke inspection panel for the CNG Mother Station.
 * Shows the spec's per-component readout with live values, and the trailer-fill
 * Start / Pause / Reset controls on the station and filling-panel views. Sits in
 * the right-hand slot and yields to a generic node selection or active route.
 */
const STAGE_LABEL: Record<string, string> = {
  idle: 'IDLE — NO TRAILER',
  arrival: 'TRAILER ARRIVING',
  securing: 'SECURING · EARTHING',
  connection: 'CONNECTING HOSES',
  filling: 'FILLING',
  completion: 'FILL COMPLETE',
  departure: 'TRAILER DEPARTING',
};

export function MotherInfoPanel() {
  const part = useMotherInfoStore((s) => s.part);
  const close = useMotherInfoStore((s) => s.close);
  const m = useMotherStore();
  const flow = useSimStore((s) => s.values['mother-station']?.flow ?? 0);
  const playing = useSimStore((s) => s.playing);
  const feedAlive = useSimStore((s) => (s.values['prs']?.status ?? 'online') !== 'offline');
  const highDemand = useSimStore((s) => s.scenario === 'high-demand');
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const running = playing && feedAlive;

  if (!part || selectedId || routeActive) return null;

  const bankPress = (pct: number) => Math.round((pct / 100) * 250);
  const pct = Math.round(fillProgress(m.elapsed, m.stage) * 100);
  const cur = fillPressure(m.elapsed, m.stage);

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.tealCng }}>
            CNG · Mother Station
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

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        {part === 'station' && (
          <>
            <Row label="Station Type" value="MOTHER" />
            <Row label="Gas Source" value="PRS-01 (HP)" />
            <Row label="Compressors" value={highDemand ? '3 running' : '2 run · 1 stby'} />
            <Row label="HP Cascade" value="24 cyl / 4 bank" />
            <Row label="Filling Bays" value="1 (3-line)" />
            <Row label="Dispensers" value="2" />
            <Row label="Inlet Pressure" value="24.0 Bar" />
            <Row label="Discharge" value="250 Bar" />
            <Row label="Current Flow" value={`${fmtFlow(flow)} SCMH`} accent={BRAND.tealCng} />
            <Row label="Trailers Today" value={fmt(m.trailersFilledToday)} />
            <Row label="Vehicles Today" value={fmt(m.vehiclesToday)} />
            <Row label="Trailer Bay" value={m.active ? m.trailerId : 'IDLE'} accent={m.active ? BRAND.tealCng : undefined} />
          </>
        )}
        {part === 'hp-filter' && (
          <>
            <Row label="Inlet Pressure" value="24.0 Bar" />
            <Row label="Outlet Pressure" value="23.6 Bar" />
            <Row label="Filter A" value="DUTY · DP 0.14" accent={BRAND.tealCng} />
            <Row label="Filter B" value="STANDBY" />
            <Row label="Flow Rate" value="3200 SCMH" />
            <Row label="Status" value="ONLINE" />
          </>
        )}
        {part === 'metering' && (
          <>
            <Row label="Flow Rate" value="3200 SCMH" accent={BRAND.tealCng} />
            <Row label="Pressure" value="23.6 Bar" />
            <Row label="Temperature" value="29 °C" />
            <Row label="Meter Type" value="Turbine DN150" />
            <Row label="Totalised" value={`${fmt(4.82e6 + m.elapsed * 53, 0)}`} />
            <Row label="Calib. Due" value="08 Mar" />
          </>
        )}
        {part === 'compressor' && (
          <>
            <Row label="Type" value="Recip · 4-stage" />
            <Row label="Suction" value="23.6 Bar" />
            <Row label="Discharge" value="250 Bar" />
            <Row label="Capacity" value="1500 SCMH" />
            <Row label="Motor" value="400 kW" />
            <Row label="Disch. Temp" value="45 °C" />
            <Row label="Duty" value={highDemand ? '3 running' : 'U3 standby'} accent={BRAND.tealCng} />
            <Row label="Status" value="ONLINE" />
          </>
        )}
        {part === 'hp-cascade' && (
          <>
            <Row label="Cylinders" value="24 (4 rows)" />
            <Row label="Capacity" value="6000 L" />
            <Row label="Max Pressure" value="250 Bar" />
            <Row label="Reserve" value={`${Math.round(m.banks.RESERVE)}%`} accent={BRAND.primary} />
          </>
        )}
        {part === 'filling-panel' && (
          <>
            <Row label="Trailer" value={m.active ? m.trailerId : '—'} />
            <Row label="Stage" value={STAGE_LABEL[m.stage].split(' ')[0]} accent={BRAND.tealCng} />
            <Row label="Earthed" value={m.stage === 'securing' || m.stage === 'connection' || m.stage === 'filling' || m.stage === 'completion' ? 'YES' : 'NO'} />
            <Row label="Target" value={`${MOTHER_TARGET_BAR} Bar`} />
            <Row label="Current" value={`${cur} Bar`} accent={BRAND.tealCng} />
            <Row label="Fill Rate" value="1800 SCMH" />
          </>
        )}
        {part === 'trailer' && (
          <>
            <Row label="Trailer ID" value={m.trailerId} />
            <Row label="Cylinders" value="18 (HP)" />
            <Row label="Fill Level" value={`${pct}%`} accent={BRAND.tealCng} />
            <Row label="Destination" value="Daughter Booster" />
          </>
        )}
        {part === 'dispenser' && (
          <>
            <Row label="Price" value="₹ 89.50 /kg" />
            <Row label="Dispensing" value="200 Bar" />
            <Row label="Lanes" value="2" />
            <Row label="Status" value="ONLINE" />
          </>
        )}
      </div>

      {/* HP cascade bank bars */}
      {(part === 'hp-cascade' || part === 'station') && (
        <div className="mt-3 space-y-1.5">
          {(['HIGH', 'MEDIUM', 'LOW', 'RESERVE'] as MotherBank[]).map((b) => (
            <div key={b}>
              <div className="flex justify-between text-[10px] text-adani-muted">
                <span>{b === 'RESERVE' ? 'TRAILER RESERVE' : `${b} BANK`}</span>
                <span className="tabular-nums">{bankPress(m.banks[b])} Bar · {Math.round(m.banks[b])}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${m.banks[b]}%`, background: b === 'RESERVE' ? BRAND.primary : BRAND.tealCng }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trailer fill progress */}
      {(part === 'filling-panel' || part === 'trailer' || part === 'station') && m.active && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-adani-muted">
            <span>{STAGE_LABEL[m.stage]}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.tealCng})` }} />
          </div>
        </div>
      )}

      {/* Status line */}
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="h-2 w-2 rounded-full" style={{ background: running ? BRAND.tealCng : BRAND.alert }} />
        <span className="font-semibold">{running ? 'ONLINE' : 'FLOW HALTED'}</span>
        {part === 'station' && <span className="ml-auto text-adani-muted">ESD ● ARMED</span>}
      </div>

      {/* Trailer fill controls */}
      {(part === 'station' || part === 'filling-panel') && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => m.start()}
            disabled={!running}
            className="flex-1 rounded-lg px-2 py-2 text-xs font-bold text-white disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}
          >
            {m.active && !m.paused ? '● Filling' : m.paused ? '▶ Resume' : '▶ Start Fill'}
          </button>
          <button
            onClick={() => m.pause()}
            disabled={!m.active}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
            title="Pause"
          >
            ⏸
          </button>
          <button
            onClick={() => m.reset()}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
            title="Reset"
          >
            ↻
          </button>
        </div>
      )}
      {(part === 'station' || part === 'filling-panel') && !running && (
        <p className="mt-1.5 text-[10px] text-adani-muted">Feed offline or simulation paused — filling unavailable.</p>
      )}
      <ScadaTag tag="PT-1201" rtu="RTU-08" />
    </div>
  );
}

const TITLES: Record<string, string> = {
  station: 'CNG Mother Station',
  'hp-filter': 'HP Filtration Skid',
  metering: 'Metering Skid',
  compressor: 'Compressor Unit',
  'hp-cascade': 'HP Cascade Storage',
  'filling-panel': 'Cascade Filling Panel',
  dispenser: 'CNG Dispenser',
  trailer: 'Cascade Trailer',
  'vehicle-car': 'CNG Vehicle',
};

const PURPOSE: Record<string, string> = {
  station: 'Pipeline + trailer-filling station: 3 compressors feed HP cascade storage that fills mobile cascade trailers and on-site vehicles.',
  'hp-filter': 'Removes dust, liquids and particulates from HP pipeline gas before compression (twin duty/standby vessels).',
  metering: 'Custody-transfer measurement of gas volume with pressure & temperature compensation.',
  compressor: 'One of three large reciprocating compressors raising pipeline gas to 250 Bar.',
  'hp-cascade': 'Bulk HP storage feeding both the trailer filling panel and the on-site dispensers.',
  'filling-panel': 'Fills mobile cascade trailers to 250 Bar for transport to Daughter / Daughter-Booster stations.',
  dispenser: 'Delivers CNG to on-site vehicles at ~200 Bar.',
  trailer: 'Mobile cascade trailer being filled for dispatch to a station with no pipeline connection.',
  'vehicle-car': 'Passenger CNG vehicle refuelling on-site.',
};

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
