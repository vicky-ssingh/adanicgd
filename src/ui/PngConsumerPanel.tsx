import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { CONSUMER_BY_TYPE, demandProfile } from '@/config/pngConsumers';
import { Sparkline } from './components/Sparkline';
import { ScadaTag } from './ScadaTag';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';

/**
 * Section 10 — PNG consumer info panel (residential §A.8 / commercial §B.4 /
 * industrial §C.4). Shows the connection detail, live flow + meter reading, a
 * 24-hour demand-profile sparkline, appliance/safety status and the supply route.
 * The residential panel carries the IGNITE BURNER control.
 */
const HEADER: Record<string, { kicker: string; type: string }> = {
  residential: { kicker: 'PNG Residential Connection', type: 'Domestic' },
  commercial: { kicker: 'PNG Commercial Connection', type: 'Commercial — Restaurant' },
  industrial: { kicker: 'PNG Industrial Connection', type: 'Industrial' },
};

export function PngConsumerPanel() {
  const panel = usePngConsumerStore((s) => s.panel);
  const close = usePngConsumerStore((s) => s.closePanel);
  const flowMap = usePngConsumerStore((s) => s.flow);
  const readingMap = usePngConsumerStore((s) => s.reading);
  const burnersOn = usePngConsumerStore((s) => s.burnersOn);
  const toggleBurners = usePngConsumerStore((s) => s.toggleBurners);
  const selectedId = useSelectionStore((s) => s.selectedId);
  if (!panel || selectedId) return null;

  const def = CONSUMER_BY_TYPE[panel];
  const head = HEADER[panel];
  const flow = flowMap[panel];
  const reading = readingMap[panel];
  const profile = demandProfile(panel);
  const active = panel !== 'residential' || burnersOn;

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-7rem)] w-72 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: def.accent }}>{head.kicker}</div>
          <h3 className="text-base font-bold leading-tight">{def.label}</h3>
          <div className="text-[11px] text-adani-muted">Adani Total Gas — {def.sub}</div>
        </div>
        <button onClick={() => { close(); }} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Consumer Type" value={head.type} />
        <Row label="Service Pressure" value={def.pressure} />
        <Row label="Meter Type" value={def.meterType} />
        <Row label="Meter Reading" value={`${fmt(reading, panel === 'residential' ? 1 : 0)} SCM`} />
        <Row label="Current Flow" value={`${fmt(flow, flow < 10 ? 1 : 0)} SCMH`} accent={def.accent} />
        <Row label="Peak Demand" value={`${fmt(def.peak, def.peak < 10 ? 1 : 0)} SCMH`} />
        <Row label="Demand Band" value={`${def.min}–${def.max}`} />
        <Row label="Monthly Avg" value={def.monthly} />
      </div>

      {/* demand profile sparkline */}
      <div className="mt-3 rounded-lg bg-white/[0.04] px-2.5 py-2">
        <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wide text-adani-muted">
          <span>24-Hour Demand Profile</span>
          <span>{panel === 'residential' ? '2 cooking peaks' : panel === 'commercial' ? 'lunch + dinner' : 'flat · shift dip'}</span>
        </div>
        <Sparkline data={profile} color={def.accent} width={232} height={34} />
      </div>

      {/* appliances + safety status per type */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        {panel === 'residential' && (
          <>
            <Row label="Appliances" value="4-burner stove" />
            <Row label="+" value="Water heater" />
            <Row label="Entry Valve" value="● OPEN" accent={BRAND.tealCng} />
            <Row label="Appliance Cock" value={burnersOn ? '● OPEN' : '○ CLOSED'} accent={burnersOn ? BRAND.tealCng : undefined} />
          </>
        )}
        {panel === 'commercial' && (
          <>
            <Row label="Appliances" value="6-burner range ×2" />
            <Row label="+" value="Tandoor · Heater" />
            <Row label="Slam-Shut" value="● ARMED" accent={BRAND.tealCng} />
            <Row label="Emergency Valve" value="● OPEN" accent={BRAND.tealCng} />
            <Row label="Gas Detector" value="● NORMAL" accent={BRAND.tealCng} />
          </>
        )}
        {panel === 'industrial' && (
          <>
            <Row label="End Use" value="Steam boiler 2 TPH" />
            <Row label="+" value="Process heater" />
            <Row label="Contract Demand" value="700 SCMH" />
            <Row label="Slam-Shut" value="● ARMED" accent={BRAND.tealCng} />
            <Row label="Main Valve" value="● OPEN" accent={BRAND.tealCng} />
            <Row label="Gas Detector" value="● NORMAL" accent={BRAND.tealCng} />
            <Row label="ESD" value="● ARMED" accent={BRAND.tealCng} />
            <Row label="RTU" value="RTU-16 ● ONLINE" accent={BRAND.tealCng} />
          </>
        )}
        <Row label="Status" value={active ? '● ACTIVE' : '○ IDLE'} accent={active ? BRAND.tealCng : undefined} />
      </div>

      {panel === 'residential' && (
        <button
          onClick={toggleBurners}
          className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white"
          style={{ background: burnersOn ? BRAND.alert : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}
        >
          {burnersOn ? '■ Turn Off Burner' : '▶ Ignite Burner'}
        </button>
      )}

      {/* supply route */}
      <div className="mt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-adani-muted">Supply Route</div>
        <div className="rounded-md bg-white/[0.04] px-2 py-1.5 text-[11px] text-adani-muted">
          {panel === 'industrial'
            ? 'City Gate → PRS → Primary → DRS → Industrial Service Line → Unit 3'
            : `City Gate → PRS → DRS → MDPE → Service Line → Meter → ${panel === 'residential' ? 'Flat 704' : 'Food Court'}`}
        </div>
      </div>

      <ScadaTag tag={panel === 'industrial' ? 'FT-8003' : panel === 'commercial' ? 'FT-8002' : 'FT-8001'} rtu={panel === 'industrial' ? 'RTU-16' : 'RTU-05'} scan={panel === 'industrial' ? '3 s' : '60 s'} />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label === '+' ? '' : label}</div>
      <div className="font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
