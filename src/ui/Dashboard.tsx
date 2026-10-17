import { useEffect, useRef, useState } from 'react';
import { useSimStore } from '@/state/useSimStore';
import { useOdorStore, odorAlert } from '@/state/useOdorStore';
import { useSvStore, svAlerts } from '@/state/useSvStore';
import { useValveStore, valveAlerts, isolatedNodes } from '@/state/useValveStore';
import { useEsdStore, esdAlerts } from '@/state/useEsdStore';
import { useGasStore } from '@/state/useGasStore';
import { useCpStore } from '@/state/useCpStore';
import { usePngConsumerStore, pngNetworkDemand } from '@/state/usePngConsumerStore';
import { SCENARIOS } from '@/config/scenarios';
import { fmt, fmtFlow, fmtPressure } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { Sparkline } from './components/Sparkline';
import { exportReport } from '@/utils/report';

const HISTORY = 40; // samples (~40s)

/**
 * Live digital-twin dashboard (spec §2.27). Compact KPI overlay reading the sim
 * aggregates each tick — total flow, network pressure, CNG/PNG demand, active
 * stations/consumers, PRS/DRS, system health and alerts.
 */
function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2.5 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums" style={{ color: accent ?? 'var(--hud-text)' }}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-adani-muted">{unit}</span>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const a = useSimStore((s) => s.aggregates);
  useOdorStore((s) => s.tankPct); // live-refresh odorization alerts
  useOdorStore((s) => s.status);
  useSvStore((s) => s.rt); // live-refresh SV isolation alerts
  const valveRt = useValveStore((s) => s.rt); // live-refresh line-valve alerts
  useEsdStore((s) => s.fac); // live-refresh ESD alerts
  const gasActive = useGasStore((s) => s.active);
  const gasReading = useGasStore((s) => s.reading);
  const gasAuto = useGasStore((s) => s.autoTripped);
  const cpSurvey = useCpStore((s) => s.surveyOn);
  // §B.1 — PNG Demand now reflects the modelled consumer aggregate (live).
  usePngConsumerStore((s) => s.flow);
  const scenarioId = useSimStore((s) => s.scenario);
  const pngDemandLive = isolatedNodes(valveRt).has('png-zone') ? 0 : pngNetworkDemand(SCENARIOS[scenarioId].pngSplit);
  const odor = odorAlert();
  const svs = [...svAlerts(), ...valveAlerts()];
  const esds = esdAlerts();
  const gasAlert = gasActive && gasReading >= 20
    ? { text: gasAuto ? '⛔ AUTO-ESD — HIGH GAS CONCENTRATION — GD-04' : `⚠ GAS DETECTED — GD-04 — ${Math.round(gasReading)}% LEL`, crit: gasAuto }
    : null;
  const cpNote = cpSurvey ? '⚠ CP survey: marginal protection at chainage 5.2–5.8 km — investigation scheduled' : null;
  const anyExtra = odor.kind !== 'none' || svs.length > 0 || esds.length > 0 || !!gasAlert || !!cpNote;
  const [open, setOpen] = useState(true);
  const [flowHist, setFlowHist] = useState<number[]>([]);
  const [presHist, setPresHist] = useState<number[]>([]);
  const healthColor =
    a.systemHealth >= 90 ? BRAND.primarySoft : a.systemHealth >= 60 ? '#e0a23c' : BRAND.alert;

  // Sample the live aggregates once a second for the trend sparklines.
  const push = useRef((v: number, set: React.Dispatch<React.SetStateAction<number[]>>) => {
    set((arr) => [...arr, v].slice(-HISTORY));
  });
  useEffect(() => {
    const id = window.setInterval(() => {
      const ag = useSimStore.getState().aggregates;
      push.current(ag.totalFlow, setFlowHist);
      push.current(ag.networkPressure, setPresHist);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-13rem)] w-56 overflow-y-auto p-3 sm:w-64">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5" aria-expanded={open}>
          <span className="text-xs font-bold tracking-wide">NETWORK OVERVIEW</span>
          <span className="text-[10px] text-adani-muted">{open ? '▾' : '▸'}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={exportReport}
            className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-adani-muted hover:bg-white/20 hover:text-white"
            title="Export network report (PDF)"
          >
            ⤓ Report
          </button>
          <span className="text-[10px] text-adani-muted">live</span>
        </div>
      </div>

      {!open ? null : (
        <>
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="Total Flow" value={fmtFlow(a.totalFlow)} unit="SCMH" accent={BRAND.primarySoft} />
        <Stat label="Net Pressure" value={fmtPressure(a.networkPressure)} />
        <Stat label="CNG Demand" value={fmtFlow(a.cngDemand)} unit="SCMH" accent={BRAND.tealCng} />
        <Stat label="PNG Demand" value={fmtFlow(pngDemandLive)} unit="SCMH" accent={BRAND.violetPng} />
        <Stat label="CNG Stations" value={fmt(a.activeCngStations)} unit="active" />
        <Stat label="PNG Consumers" value={fmt(a.connectedPngConsumers)} />
        <Stat label="PRS / DRS" value={fmt(a.activePrsDrs)} unit="online" />
        <Stat label="Health" value={`${a.systemHealth}%`} accent={healthColor} />
      </div>

      {/* Health bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${a.systemHealth}%`, background: healthColor }}
        />
      </div>

      {/* Trend sparklines */}
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wide text-adani-muted">Flow trend</div>
          <Sparkline data={flowHist} color={BRAND.primarySoft} />
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wide text-adani-muted">Pressure trend</div>
          <Sparkline data={presHist} color={BRAND.tealCng} />
        </div>
      </div>

      {/* Alerts */}
      <div className="mt-2.5">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-adani-muted">
          Alerts
        </div>
        {a.alerts.length === 0 && !anyExtra ? (
          <div className="rounded-md bg-white/[0.04] px-2 py-1.5 text-[11px] text-adani-muted">
            All systems nominal
          </div>
        ) : (
          <div className="flex max-h-28 flex-col gap-1 overflow-y-auto pr-1">
            {esds.map((e, i) => (
              <div key={`esd${i}`} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: e.crit ? `${BRAND.alert}26` : '#e0a23c22', color: e.crit ? '#f7b7c6' : '#f2d199' }}>
                {e.text}
              </div>
            ))}
            {gasAlert && (
              <div className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: gasAlert.crit ? `${BRAND.alert}26` : '#e0a23c22', color: gasAlert.crit ? '#f7b7c6' : '#f2d199' }}>
                {gasAlert.text}
              </div>
            )}
            {cpNote && (
              <div className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: '#e0a23c22', color: '#f2d199' }}>{cpNote}</div>
            )}
            {svs.map((sv, i) => (
              <div key={`sv${i}`} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: sv.crit ? `${BRAND.alert}26` : '#e0a23c22', color: sv.crit ? '#f7b7c6' : '#f2d199' }}>
                {sv.text}
              </div>
            ))}
            {odor.kind !== 'none' && (
              <div
                className="rounded-md px-2 py-1 text-[11px] font-semibold"
                style={{
                  background: odor.kind === 'low' ? '#e0a23c22' : `${BRAND.alert}26`,
                  color: odor.kind === 'low' ? '#f2d199' : '#f7b7c6',
                }}
              >
                {odor.text}
              </div>
            )}
            {a.alerts.slice(0, 5).map((al, i) => (
              <div
                key={i}
                className="rounded-md px-2 py-1 text-[11px]"
                style={{ background: `${BRAND.alert}1c`, color: '#f0b8c6' }}
              >
                {al}
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
