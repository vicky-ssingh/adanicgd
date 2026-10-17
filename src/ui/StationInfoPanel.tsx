import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useStationStore, STATION_TANK_CAPACITY } from '@/state/useStationStore';
import { useSimStore } from '@/state/useSimStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { fmt, fmtFlow } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

const PART_TAG: Record<string, string> = {
  station: 'UCP-1100', inlet: 'PT-1101', compressor: 'ST-1102', cascade: 'PT-1103',
  priority: 'ZC-1104', dispenser: 'FQI-1105', 'vehicle-car': 'FQI-1105',
};

/**
 * Section 01 §3–§12 — bespoke inspection panel for the Online CNG Station's
 * components. Opens when a station part is clicked (see PartPicker) and shows the
 * spec's per-component readout with live values, plus the Start/Stop refuel
 * control on the station and dispenser panels. Sits in the right-hand slot and
 * yields to nothing else (parts clear the other selections when clicked).
 */
export function StationInfoPanel() {
  const part = useStationInfoStore((s) => s.part);
  const close = useStationInfoStore((s) => s.close);
  const st = useStationStore();
  const flow = useSimStore((s) => s.values['cng-station']?.flow ?? 0);
  const playing = useSimStore((s) => s.playing);
  const feedAlive = useSimStore((s) => (s.values['prs']?.status ?? 'online') !== 'offline');
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const running = playing && feedAlive;

  // Yield to a generic node selection or an active route highlight.
  if (!part || selectedId || routeActive) return null;

  const bankPress = (pct: number) => Math.round((pct / 100) * 250);
  const cascadeAvg = Math.round((st.banks.HIGH + st.banks.MEDIUM + st.banks.LOW) / 3);

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.tealCng }}>
            CNG · Online Station
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
            <Row label="Station Type" value="ONLINE" />
            <Row label="Gas Source" value="DRS-03" />
            <Row label="Compressor" value="1 × 250 kW" />
            <Row label="Cascade" value="12 cyl / 3 bank" />
            <Row label="Dispensers" value="4" />
            <Row label="Inlet Pressure" value="19.0 Bar" />
            <Row label="Dispensing" value="200 Bar" />
            <Row label="Current Flow" value={`${fmtFlow(flow)} SCMH`} accent={BRAND.tealCng} />
            <Row label="Vehicles Today" value={fmt(st.vehiclesToday)} />
            <Row label="Gas Today" value={`${fmt(st.gasDispensedToday)} kg`} />
            <Row label="Cascade Avg" value={`${cascadeAvg}%`} />
            <Row label="Dispensers Active" value={st.refueling ? '2 of 4' : '1 of 4'} />
          </>
        )}
        {part === 'inlet' && (
          <>
            <Row label="Inlet Pressure" value="19.0 Bar" />
            <Row label="Outlet Pressure" value="18.2 Bar" />
            <Row label="Flow Rate" value="850 SCMH" accent={BRAND.tealCng} />
            <Row label="Filter DP" value="0.12 Bar" />
            <Row label="Gas Temp" value="28 °C" />
            <Row label="Upstream" value="DRS-03" />
          </>
        )}
        {part === 'compressor' && (
          <>
            <Row label="Type" value="Recip · 4-stage" />
            <Row label="Suction" value="18.2 Bar" />
            <Row label="Discharge" value="250 Bar" />
            <Row label="Capacity" value="1200 SCMH" />
            <Row label="Motor" value="250 kW" />
            <Row label="Run Hours" value={fmt(st.runningHours)} accent={BRAND.tealCng} />
            <Row label="Disch. Temp" value="42 °C" />
            <Row label="Next Service" value="12 Nov" />
          </>
        )}
        {part === 'cascade' && (
          <>
            <Row label="Capacity" value="3000 L" />
            <Row label="Cylinders" value="12 (3×4)" />
            <Row label="Max Pressure" value="250 Bar" />
            <Row label="Active Bank" value={st.activeBank} accent={BRAND.tealCng} />
          </>
        )}
        {part === 'priority' && (
          <>
            <Row label="Active Bank" value={st.activeBank} accent={BRAND.tealCng} />
            <Row label="Low Bank" value={`${bankPress(st.banks.LOW)} Bar`} />
            <Row label="Med Bank" value={`${bankPress(st.banks.MEDIUM)} Bar`} />
            <Row label="High Bank" value={`${bankPress(st.banks.HIGH)} Bar`} />
            <Row label="Mode" value="AUTO" />
            <Row label="Last Switch" value={`${Math.round(st.switchAgo)}s ago`} />
          </>
        )}
        {part === 'dispenser' && (
          <>
            <Row label="Price" value="₹ 89.50 /kg" />
            <Row label="Dispensed" value={`${fmt(st.dispensedKg, 2)} kg`} accent={BRAND.tealCng} />
            <Row label="Amount" value={`₹ ${fmt(st.amount, 1)}`} />
            <Row label="Nozzle" value={st.refueling ? 'CONNECTED' : 'HOLSTERED'} />
            <Row label="Dispensing" value="200 Bar" />
            <Row label="Lane" value="1" />
          </>
        )}
        {part.startsWith('vehicle') && (
          <>
            <Row label="Vehicle" value={VEHICLE_LABEL[part] ?? 'Vehicle'} />
            <Row label="Tank" value={`${VEHICLE_TANK[part] ?? STATION_TANK_CAPACITY} kg`} />
            <Row
              label="Fill Level"
              value={`${fmt(part === 'vehicle-car' && st.refueling ? st.fillPercent : (VEHICLE_FILL[part] ?? 60), 0)}%`}
              accent={BRAND.tealCng}
            />
            <Row label="Fill Rate" value={part === 'vehicle-car' && st.refueling ? '1.6 kg/s' : '—'} />
          </>
        )}
      </div>

      {/* Cascade bank bars */}
      {(part === 'cascade' || part === 'station') && (
        <div className="mt-3 space-y-1.5">
          {(['HIGH', 'MEDIUM', 'LOW'] as const).map((b) => (
            <div key={b}>
              <div className="flex justify-between text-[10px] text-adani-muted">
                <span>{b} BANK</span>
                <span className="tabular-nums">{bankPress(st.banks[b])} Bar · {Math.round(st.banks[b])}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${st.banks[b]}%`, background: st.activeBank === b ? BRAND.tealCng : BRAND.primarySoft }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status line */}
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: running ? BRAND.tealCng : BRAND.alert }}
        />
        <span className="font-semibold">
          {STATUS_WORD(part, running)}
        </span>
        {part === 'station' && <span className="ml-auto text-adani-muted">ESD ● ARMED</span>}
      </div>

      {/* Refuel control (station + dispenser) */}
      {(part === 'station' || part === 'dispenser') && (
        <button
          onClick={() => (st.refueling ? st.stopRefuel() : st.startRefuel())}
          disabled={!running}
          className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          style={{ background: st.refueling ? BRAND.alert : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}
        >
          {st.refueling ? '■ Stop Refuelling' : '⛽ Start Vehicle Refuel'}
        </button>
      )}
      {(part === 'station' || part === 'dispenser') && !running && (
        <p className="mt-1.5 text-[10px] text-adani-muted">Feed offline or simulation paused — refuel unavailable.</p>
      )}
      <ScadaTag tag={PART_TAG[part] ?? 'PT-1100'} rtu="RTU-07" />
    </div>
  );
}

function STATUS_WORD(part: string, running: boolean): string {
  if (part === 'compressor') return running ? 'RUNNING' : 'STOPPED';
  if (!running) return 'FLOW HALTED';
  return 'ONLINE';
}

const TITLES: Record<string, string> = {
  station: 'Online CNG Station',
  inlet: 'Inlet Skid — CNG-01',
  compressor: 'Main Compressor — Unit 01',
  cascade: 'Cascade Storage (Buffer)',
  priority: 'Priority Panel',
  dispenser: 'CNG Dispenser',
  'vehicle-car': 'CNG Car',
  'vehicle-auto': 'CNG Auto-Rickshaw',
  'vehicle-tempo': 'CNG Tempo (LCV)',
  'vehicle-bus': 'CNG City Bus',
};

const PURPOSE: Record<string, string> = {
  station: 'Pipeline-connected station: compresses CGD gas on-site to 250 Bar and dispenses CNG to vehicles.',
  inlet: 'Receives gas from the CGD pipeline, filters, meters and regulates it to compressor suction pressure.',
  compressor: 'Compresses pipeline gas to 250 Bar for cascade storage and dispensing.',
  cascade: 'Stores compressed gas at 250 Bar as a buffer for fast filling and demand smoothing.',
  priority: 'Sequences withdrawal from the banks (Low → Medium → High) to maximise gas transfer.',
  dispenser: 'Meters and delivers CNG to the vehicle at ~200 Bar via the fill nozzle.',
  'vehicle-car': 'Passenger CNG vehicle refuelling at the dispenser.',
  'vehicle-auto': 'Three-wheeler auto-rickshaw — the most common CNG vehicle in Gujarat.',
  'vehicle-tempo': 'Light commercial CNG vehicle for goods transport.',
  'vehicle-bus': 'CNG city bus filling at the larger dispenser bay.',
};

const VEHICLE_LABEL: Record<string, string> = {
  'vehicle-car': 'Sedan / SUV',
  'vehicle-auto': 'Auto-Rickshaw',
  'vehicle-tempo': 'Tempo (LCV)',
  'vehicle-bus': 'City Bus',
};
const VEHICLE_TANK: Record<string, number> = {
  'vehicle-car': 14,
  'vehicle-auto': 5,
  'vehicle-tempo': 22,
  'vehicle-bus': 90,
};
const VEHICLE_FILL: Record<string, number> = {
  'vehicle-auto': 48,
  'vehicle-tempo': 65,
  'vehicle-bus': 72,
};

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
