import { useScadaStore, telemetryStats } from '@/state/useScadaStore';
import { useSvStore } from '@/state/useSvStore';
import { useEsdStore } from '@/state/useEsdStore';
import { useGasStore } from '@/state/useGasStore';
import { useViewStore } from '@/state/useViewStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { SV_STATIONS } from '@/config/svStations';
import { CONTROL_CENTRE } from '@/config/scadaLayout';
import { FacilityRemote } from '@/config/scadaRemote';
import { BRAND } from '@/theme/tokens';

/** Section 09 §7 + §9 — SCADA Control Centre info panel with remote operations. */
export function ControlCentrePanel() {
  const open = useScadaStore((s) => s.centreOpen);
  const close = useScadaStore((s) => s.closeCentre);
  const req = useScadaStore((s) => s.remoteReq);
  const requestRemote = useScadaStore((s) => s.requestRemote);
  const cancelRemote = useScadaStore((s) => s.cancelRemote);
  const confirmRemote = useScadaStore((s) => s.confirmRemote);
  const focusOn = useViewStore((s) => s.focusOn);
  const svRt = useSvStore((s) => s.rt);
  const esdFac = useEsdStore((s) => s.fac);
  const gasAuto = useGasStore((s) => s.autoTripped);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  if (!open || selectedId || routeActive) return null;

  const stats = telemetryStats();
  const svClosed = SV_STATIONS.filter((s) => svRt[s.id].closed).length;
  const esdTripped = FacilityRemote.filter((f) => esdFac[f.id].tripped).length;
  const activeAlarms = svClosed + esdTripped + (gasAuto ? 1 : 0);

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-7rem)] w-72 overflow-y-auto p-4 sm:w-80">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>⬡ SCADA Control Centre</div>
          <h3 className="text-base font-bold leading-tight">Shantigram CGD Network</h3>
          <div className="text-[11px] text-adani-muted">Adani Total Gas Limited</div>
        </div>
        <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[11px] leading-snug text-adani-muted">
        Central monitoring and control for the entire network. Operators watch pressure, flow and equipment status across all assets in real time — and can remotely operate valves and initiate shutdowns.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
        <Row label="RTUs Connected" value={`${stats.online} of ${stats.total}`} accent={BRAND.primarySoft} />
        <Row label="RTUs Degraded" value={`${stats.degraded} (RTU-09)`} accent={stats.degraded ? '#e0a23c' : undefined} />
        <Row label="Data Points" value={`${stats.totalDataPoints}`} />
        <Row label="Poll Cycle" value="3 s" />
        <Row label="Availability" value={`${stats.availability.toFixed(1)}%`} accent={BRAND.tealCng} />
        <Row label="Operators" value="3 on shift" />
      </div>

      <Section title="Network Assets Monitored" />
      <div className="flex flex-col gap-1 text-[11px]">
        <Asset name="City Gate Station" ok />
        <Asset name="PRS SKID" ok={esdTripped === 0} />
        <Asset name="DRS (3)" ok={svClosed === 0} note={svClosed ? 'SECTION ISOLATED' : 'ALL ONLINE'} />
        <Asset name="CNG Stations (4)" ok={esdTripped === 0} note={esdTripped ? `${esdTripped} SHUTDOWN` : 'ALL ONLINE'} />
        <Asset name="SV Stations (4)" ok={svClosed === 0} note={svClosed ? `${svClosed} CLOSED` : 'ALL OPEN'} />
        <Asset name="Odorization" ok />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
        <Row label="Alarms" value={`${activeAlarms}`} accent={activeAlarms ? BRAND.alert : BRAND.tealCng} />
        <Row label="Ack'd" value="1" />
        <Row label="Backup" value="● READY" accent={BRAND.tealCng} />
      </div>

      {/* §9 Remote operations */}
      <Section title="Remote Operations" />
      {req && (
        <div className="mb-2 rounded-md px-2.5 py-2" style={{ background: `${BRAND.alert}22` }}>
          <div className="text-[11px] font-semibold" style={{ color: '#f7b7c6' }}>
            Confirm remote {req.kind === 'sv-close' ? `close of ${req.id}` : `ESD trip — ${req.id}`}?
          </div>
          <div className="mt-1.5 flex gap-2">
            <button onClick={confirmRemote} className="flex-1 rounded-md px-2 py-1 text-[11px] font-bold text-white" style={{ background: BRAND.alert }}>CONFIRM</button>
            <button onClick={cancelRemote} className="flex-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-adani-muted hover:bg-white/20">CANCEL</button>
          </div>
        </div>
      )}

      <div className="mb-2 flex flex-col gap-1">
        {SV_STATIONS.map((s) => {
          const closed = svRt[s.id].closed;
          return (
            <div key={s.id} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2 py-1 text-[11px]">
              <span className="w-12 font-bold">{s.id}</span>
              <span className="font-semibold" style={{ color: closed ? BRAND.alert : BRAND.tealCng }}>{closed ? '● CLOSED' : '● OPEN'}</span>
              {closed ? (
                <button onClick={() => useSvStore.getState().openValve(s.id)} className="ml-auto rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold hover:bg-white/20">OPEN</button>
              ) : (
                <button onClick={() => requestRemote({ kind: 'sv-close', id: s.id })} className="ml-auto rounded px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: `${BRAND.alert}cc` }}>CLOSE</button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-1">
        {FacilityRemote.map((f) => {
          const tripped = esdFac[f.id].tripped;
          return (
            <div key={f.id} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2 py-1 text-[11px]">
              <span className="min-w-0 flex-1 truncate font-bold">{f.short}</span>
              <span className="font-semibold" style={{ color: tripped ? BRAND.alert : BRAND.tealCng }}>{tripped ? 'TRIP' : 'ARMED'}</span>
              {tripped ? (
                <button onClick={() => useEsdStore.getState().confirmReset(f.id)} className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold hover:bg-white/20">RESET</button>
              ) : (
                <button onClick={() => requestRemote({ kind: 'esd-trip', id: f.id })} className="rounded px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: `${BRAND.alert}cc` }}>ESD TRIP</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-md bg-white/[0.04] px-2.5 py-2">
        <span className="text-[12px] font-bold" style={{ color: BRAND.tealCng }}>● OPERATIONAL</span>
        <button
          onClick={() => focusOn(CONTROL_CENTRE.focus.position, CONTROL_CENTRE.focus.target)}
          className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-adani-muted hover:bg-white/20 hover:text-white"
        >
          Fly to centre
        </button>
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return <div className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-adani-muted">{title}</div>;
}
function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
function Asset({ name, ok, note }: { name: string; ok: boolean; note?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-white/[0.03] px-2 py-1">
      <span>{name}</span>
      <span className="font-semibold" style={{ color: ok ? BRAND.tealCng : BRAND.alert }}>● {note ?? (ok ? 'ONLINE' : 'ALARM')}</span>
    </div>
  );
}
