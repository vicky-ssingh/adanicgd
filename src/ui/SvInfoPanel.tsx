import { useSvStore } from '@/state/useSvStore';
import { SV_BY_ID } from '@/config/svStations';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useOdorStore } from '@/state/useOdorStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/**
 * Section 07 §A.3 — SV station info panel with the operate control. CLOSE VALVE
 * opens a confirmation dialog; confirming runs the closure animation, isolates
 * the downstream section and triggers the Pipeline Isolation scenario. BLOWDOWN
 * vents residual pressure; OPEN VALVE restores supply.
 */
export function SvInfoPanel() {
  const panelId = useSvStore((s) => s.panelId);
  const confirmId = useSvStore((s) => s.confirmId);
  const rtAll = useSvStore((s) => s.rt);
  const closePanel = useSvStore((s) => s.closePanel);
  const requestClose = useSvStore((s) => s.requestClose);
  const cancelConfirm = useSvStore((s) => s.cancelConfirm);
  const confirmClose = useSvStore((s) => s.confirmClose);
  const openValve = useSvStore((s) => s.openValve);
  const blowdown = useSvStore((s) => s.blowdown);
  const setHover = useSvStore((s) => s.setHover);

  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const stationPart = useStationInfoStore((s) => s.part);
  const motherPart = useMotherInfoStore((s) => s.part);
  const daughterPart = useDaughterInfoStore((s) => s.part);
  const trailerId = useTrailerInfoStore((s) => s.id);
  const odorOpen = useOdorStore((s) => s.panelOpen);

  if (!panelId || selectedId || routeActive || stationPart || motherPart || daughterPart || trailerId || odorOpen) return null;
  const def = SV_BY_ID[panelId];
  const rt = rtAll[panelId];
  const closed = rt.ind > 0.5;
  const usPress = 18.4;
  const dsPress = 18.2 - rt.ind * 17.6; // falls to ~0.6 when closed

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72" onMouseEnter={() => setHover(panelId)} onMouseLeave={() => setHover(null)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>Common · Sectionalizing Valve</div>
          <h3 className="text-base font-bold leading-tight">SV Station — {def.id}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/85 px-1 py-0.5" style={{ lineHeight: 0 }}>
            <img src="/assets/branding/adani_logo.png" alt="Adani" style={{ width: 40, height: 'auto', display: 'block', opacity: 0.9 }} draggable={false} />
          </span>
          <button onClick={closePanel} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        Isolates a section of the distribution pipeline for maintenance or emergency response, limiting the area affected by an incident.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Valve Type" value="Ball · DN300" />
        <Row label="Chainage" value={`${fmt(def.chainageKm, 1)} km`} />
        <Row label="Upstream" value={`${fmt(usPress, 1)} Bar`} />
        <Row label="Downstream" value={`${fmt(Math.max(0, dsPress), 1)} Bar`} accent={closed ? BRAND.alert : undefined} />
        <Row label="Position" value={closed ? '● CLOSED' : '● OPEN'} accent={closed ? BRAND.alert : BRAND.tealCng} />
        <Row label="Mode" value="MANUAL / REMOTE" />
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-adani-muted">Section Controlled</div>
        <div className="rounded-md bg-white/[0.04] px-2 py-1.5 text-[11px] text-adani-muted">
          {def.section.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>

      {/* Controls */}
      {confirmId === panelId ? (
        <div className="mt-3 rounded-lg p-2.5" style={{ background: `${BRAND.alert}1f`, border: `1px solid ${BRAND.alert}55` }}>
          <div className="text-[11px] font-semibold text-white">Closing {def.id} will isolate {def.affected}. Continue?</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => confirmClose(panelId)} className="flex-1 rounded-md px-2 py-1.5 text-xs font-bold text-white" style={{ background: BRAND.alert }}>Confirm</button>
            <button onClick={cancelConfirm} className="flex-1 rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Cancel</button>
          </div>
        </div>
      ) : !closed ? (
        <button onClick={() => requestClose(panelId)} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: BRAND.alert }}>⊗ Close Valve</button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <button onClick={() => openValve(panelId)} className="w-full rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}>⊙ Open Valve</button>
          <button onClick={() => blowdown(panelId)} className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20">⊗ Blowdown Section</button>
        </div>
      )}
      {closed && (
        <div className="mt-2 rounded-md px-2 py-1.5 text-[11px] font-semibold" style={{ background: `${BRAND.alert}26`, color: '#f7b7c6' }}>
          ⛔ {def.id} CLOSED — SECTION ISOLATED
        </div>
      )}
      <ScadaTag tag={`ZSC-51${def.id.slice(3)}0`} rtu={`RTU-${10 + Number(def.id.slice(3))}`} />
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
