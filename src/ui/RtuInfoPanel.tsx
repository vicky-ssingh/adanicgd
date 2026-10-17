import { useEffect, useRef, useState } from 'react';
import { useScadaStore } from '@/state/useScadaStore';
import { useViewStore } from '@/state/useViewStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { RTU_BY_ID, rtuFocus, type CommsStatus } from '@/config/scadaLayout';
import { BRAND } from '@/theme/tokens';

/** Section 09 §6 — Remote Terminal Unit info panel. */
const STATUS_LABEL: Record<CommsStatus, { text: string; color: string }> = {
  online: { text: '● ONLINE', color: BRAND.tealCng },
  degraded: { text: '● DEGRADED', color: '#e0a23c' },
  lost: { text: '● COMMS LOST', color: BRAND.alert },
};

function Bars({ pct }: { pct: number }) {
  const filled = Math.round((pct / 100) * 5);
  return <span className="tabular-nums">{'▮'.repeat(filled)}{'▯'.repeat(5 - filled)} {pct}%</span>;
}

export function RtuInfoPanel() {
  const id = useScadaStore((s) => s.rtuPanelId);
  const close = useScadaStore((s) => s.closeRtu);
  const focusOn = useViewStore((s) => s.focusOn);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const [tick, setTick] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let last = 0;
    const loop = (t: number) => { if (t - last > 300) { last = t; setTick((n) => n + 1); } raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  if (!id || selectedId || routeActive) return null;
  const r = RTU_BY_ID[id];
  if (!r) return null;
  const st = STATUS_LABEL[r.status];
  // Live poll countdown (0..poll) + animated packet count derived from time.
  const since = ((Date.now() / 1000) % 3).toFixed(1);
  const packets = 42000 + Math.floor((Date.now() / 1000) % 86400) * 3 + (tick % 7);
  const solar = useViewStore.getState().timeOfDay === 'day';

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-7rem)] w-72 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>⬡ Remote Terminal Unit</div>
          <h3 className="text-base font-bold leading-tight">{r.id}</h3>
          <div className="text-[11px] text-adani-muted">Adani Total Gas — {r.asset}</div>
        </div>
        <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[11px] leading-snug text-adani-muted">
        Collects pressure, flow, temperature and equipment-status data from field instruments and transmits it to the SCADA control centre for remote monitoring and control.
      </p>

      <Section title="Communication" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
        <Row label="Link" value={r.comms} />
        <Row label="Protocol" value={r.protocol} />
        <Row label="Signal" node={<Bars pct={r.signalPct} />} accent={r.status === 'online' ? undefined : '#e0a23c'} />
        <Row label="Poll Interval" value="3 s" />
        <Row label="Last Tx" value={`${since} s ago`} />
        <Row label="Packets Today" value={packets.toLocaleString()} />
        <Row label="Packet Loss" value={r.status === 'degraded' ? '6.4%' : '0.02%'} accent={r.status === 'degraded' ? '#e0a23c' : undefined} />
        <Row label="Instruments" value={`${r.instruments}`} />
      </div>

      <Section title="Power" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
        <Row label="Source" value="Solar + battery" />
        <Row label="Battery" node={<Bars pct={r.battery} />} />
        <Row label="Solar" value={solar ? '● ACTIVE (day)' : '○ IDLE (night)'} accent={solar ? BRAND.tealCng : undefined} />
        <Row label="Enclosure" value={`${r.encTemp} °C`} />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-md bg-white/[0.04] px-2.5 py-2">
        <span className="text-[12px] font-bold" style={{ color: st.color }}>{st.text}</span>
        <button
          onClick={() => { const f = rtuFocus(r); focusOn(f.position, f.target); }}
          className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-adani-muted hover:bg-white/20 hover:text-white"
        >
          Fly to asset
        </button>
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return <div className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-adani-muted">{title}</div>;
}
function Row({ label, value, node, accent }: { label: string; value?: string; node?: React.ReactNode; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold" style={accent ? { color: accent } : undefined}>{node ?? value}</div>
    </div>
  );
}
