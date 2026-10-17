import { useSelectionStore } from '@/state/useSelectionStore';
import { useSimStore } from '@/state/useSimStore';
import { useRouteStore } from '@/state/useRouteStore';
import { NETWORK, NODES_BY_ID } from '@/config/network';
import { StatusBadge } from './components/StatusBadge';
import { fmt, fmtFlow, fmtPressure } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/** SCADA tag + reporting RTU per network node (Section 09 §10). */
const NODE_SCADA: Record<string, { tag: string; rtu: string }> = {
  source: { tag: 'PT-0001', rtu: 'RTU-01' },
  citygate: { tag: 'PT-1001', rtu: 'RTU-01' },
  filtration: { tag: 'PDT-1002', rtu: 'RTU-01' },
  metering: { tag: 'FT-1003', rtu: 'RTU-06' },
  prs: { tag: 'PT-2001', rtu: 'RTU-02' },
  drs1: { tag: 'PT-3001', rtu: 'RTU-03' },
  drs2: { tag: 'PT-3002', rtu: 'RTU-04' },
  drs3: { tag: 'PT-3003', rtu: 'RTU-05' },
  'cng-station': { tag: 'PT-1101', rtu: 'RTU-07' },
  'mother-station': { tag: 'PT-1201', rtu: 'RTU-08' },
  'png-zone': { tag: 'FT-7001', rtu: 'RTU-05' },
  ctm: { tag: 'FQ-0002', rtu: 'RTU-01' },
  gc: { tag: 'AI-1004', rtu: 'RTU-06' },
  'sr-dom': { tag: 'PT-7101', rtu: 'RTU-05' },
  'sr-com': { tag: 'PT-7201', rtu: 'RTU-05' },
  mrs: { tag: 'FQ-7301', rtu: 'RTU-16' },
  laboratory: { tag: 'FQ-7401', rtu: 'RTU-16' },
  'mfm-mother': { tag: 'FQI-1205', rtu: 'RTU-08' },
};

/**
 * Component inspection panel (spec §2.24 / §2.25). On selection shows the node's
 * name, purpose, live input/output pressure, flow, temperature, load, status and
 * connected pipelines.
 */
export function InfoPanel() {
  const selectedId = useSelectionStore((s) => s.selectedId);
  const clear = useSelectionStore((s) => s.clear);
  const values = useSimStore((s) => s.values);
  const routeActive = useRouteStore((s) => s.edges !== null);

  // The route panel takes the right slot when a supply route is highlighted.
  if (routeActive) return null;
  if (!selectedId) return null;
  const node = NODES_BY_ID[selectedId];
  if (!node) return null;
  // DRS nodes use the bespoke DrsInfoPanel (Section 15).
  if (node.type === 'drs') return null;
  const v = values[selectedId];

  const inEdge = NETWORK.edges.find((e) => e.to === selectedId && e.from !== selectedId);
  const inputPressure = inEdge ? values[inEdge.from]?.pressure : undefined;
  const connected = NETWORK.edges.filter((e) => e.from === selectedId || e.to === selectedId);

  const networkAccent =
    node.network === 'cng' ? BRAND.tealCng : node.network === 'png' ? BRAND.violetPng : BRAND.primary;

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: networkAccent }}>
            {node.network === 'common' ? 'Distribution' : node.network.toUpperCase()} · {node.type}
          </div>
          <h3 className="text-base font-bold leading-tight">{node.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/85 px-1 py-0.5" style={{ lineHeight: 0 }}>
            <img
              src="/assets/branding/adani_logo.png"
              alt="Adani"
              style={{ width: 40, height: 'auto', display: 'block', opacity: 0.9 }}
              draggable={false}
            />
          </span>
          <button
            onClick={clear}
            className="rounded-md px-1.5 text-adani-muted hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {v && (
        <div className="mt-2">
          <StatusBadge status={v.status} />
        </div>
      )}

      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">{node.purpose}</p>

      {v && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          {inputPressure !== undefined && (
            <Row label="Input Pressure" value={fmtPressure(inputPressure)} />
          )}
          <Row label="Output Pressure" value={fmtPressure(v.pressure)} />
          <Row label="Flow Rate" value={`${fmtFlow(v.flow)} SCMH`} />
          <Row label="Temperature" value={`${fmt(v.temperature, 1)} °C`} />
          <Row label="Load" value={`${fmt(v.load * 100, 0)} %`} />
          <Row label="Nominal" value={`${fmtFlow(node.nominal.flow)} SCMH`} />
        </div>
      )}

      {/* Load bar */}
      {v && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${Math.min(100, v.load * 100)}%`, background: networkAccent }}
          />
        </div>
      )}

      <div className="mt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-adani-muted">
          Connected Pipelines
        </div>
        <div className="flex flex-wrap gap-1">
          {connected.map((e) => (
            <span
              key={e.id}
              className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-adani-muted"
            >
              {e.tier}
            </span>
          ))}
        </div>
      </div>

      {NODE_SCADA[selectedId] && <ScadaTag tag={NODE_SCADA[selectedId].tag} rtu={NODE_SCADA[selectedId].rtu} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
