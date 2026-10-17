import { useEsdStore } from '@/state/useEsdStore';
import { FACILITY_BY_ID } from '@/config/safetyLayout';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

const ESD_RTU: Record<string, string> = { 'online-cng': 'RTU-07', mother: 'RTU-08', daughter: 'RTU-09', booster: 'RTU-10', citygate: 'RTU-01' };

/**
 * Section 08 §A.5 — facility ESD panel. CONFIRM ESD runs the trip sequence and
 * triggers the Equipment Shutdown scenario; RESET restores everything (~15 s).
 */
export function EsdPanel() {
  const panelId = useEsdStore((s) => s.panelId);
  const confirmId = useEsdStore((s) => s.confirmId);
  const resetConfirmId = useEsdStore((s) => s.resetConfirmId);
  const fac = useEsdStore((s) => s.fac);
  const closePanel = useEsdStore((s) => s.closePanel);
  const requestTrip = useEsdStore((s) => s.requestTrip);
  const cancelConfirm = useEsdStore((s) => s.cancelConfirm);
  const confirmTrip = useEsdStore((s) => s.confirmTrip);
  const requestReset = useEsdStore((s) => s.requestReset);
  const confirmReset = useEsdStore((s) => s.confirmReset);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);

  if (!panelId || selectedId || routeActive) return null;
  const def = FACILITY_BY_ID[panelId];
  const rt = fac[panelId];
  const tripped = rt.tripped;
  const phasePct = Math.round(rt.phase * 100);

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.alert }}>Safety · Emergency Shutdown</div>
          <h3 className="text-base font-bold leading-tight">ESD — {def.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/85 px-1 py-0.5" style={{ lineHeight: 0 }}>
            <img src="/assets/branding/adani_logo.png" alt="Adani" style={{ width: 40, height: 'auto', display: 'block', opacity: 0.9 }} draggable={false} />
          </span>
          <button onClick={closePanel} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        Emergency shutdown immediately isolates and depressurises the facility. The ESD valve is spring-return (fail-closed) — it shuts on loss of signal or air.
      </p>

      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tripped ? BRAND.alert : BRAND.tealCng }} />
        <span className="font-semibold">{tripped ? '⛔ EMERGENCY SHUTDOWN' : '● ARMED'}</span>
      </div>

      {tripped && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[10px] text-adani-muted"><span>{rt.phase < 0.35 ? 'ALARM · ISOLATING' : rt.phase < 0.95 ? 'DEPRESSURISING' : 'ISOLATED'}</span><span className="tabular-nums">{phasePct}%</span></div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${phasePct}%`, background: BRAND.alert }} /></div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="ESD Valve" value={rt.phase > 0.3 ? '● CLOSED' : '● OPEN'} accent={rt.phase > 0.3 ? BRAND.alert : BRAND.tealCng} />
        <Row label="Vent" value={rt.phase > 0.3 && rt.phase < 0.95 ? 'VENTING' : 'CLOSED'} />
        <Row label="Compressor" value={tripped ? 'STOPPED' : 'RUNNING'} accent={tripped ? BRAND.alert : undefined} />
        <Row label="Dispensers" value={tripped ? 'OFFLINE' : 'ONLINE'} accent={tripped ? BRAND.alert : undefined} />
      </div>

      {/* Trip / reset controls */}
      {confirmId === panelId ? (
        <div className="mt-3 rounded-lg p-2.5" style={{ background: `${BRAND.alert}1f`, border: `1px solid ${BRAND.alert}55` }}>
          <div className="text-[11px] font-semibold text-white">⚠ This will immediately isolate and depressurise {def.label}. Continue?</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => confirmTrip(panelId)} className="flex-1 rounded-md px-2 py-1.5 text-xs font-bold text-white" style={{ background: BRAND.alert }}>Confirm ESD</button>
            <button onClick={cancelConfirm} className="flex-1 rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Cancel</button>
          </div>
        </div>
      ) : resetConfirmId === panelId ? (
        <div className="mt-3 rounded-lg p-2.5" style={{ background: '#0b743322', border: '1px solid #0b743355' }}>
          <div className="text-[11px] font-semibold text-white">Reset ESD and restart {def.label}? Restart takes ~15 s.</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => confirmReset(panelId)} className="flex-1 rounded-md px-2 py-1.5 text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}>Reset ESD</button>
            <button onClick={cancelConfirm} className="flex-1 rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Cancel</button>
          </div>
        </div>
      ) : !tripped ? (
        <button onClick={() => requestTrip(panelId)} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: BRAND.alert }}>⚠ Trigger Emergency Shutdown</button>
      ) : (
        <button onClick={() => requestReset(panelId)} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}>↻ Reset ESD</button>
      )}
      <ScadaTag tag="XV-1007" rtu={ESD_RTU[panelId] ?? 'RTU-07'} />
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
