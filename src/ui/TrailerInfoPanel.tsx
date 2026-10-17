import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useTrailerStore, type TrailerStatus } from '@/state/useTrailerStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';

/**
 * Section 03 §6 — bespoke cascade-trailer info panel. Live pressure / fill / per-
 * bank readout, journey status with ETA + distance, and a FOLLOW TRAILER toggle
 * (which also highlights the route path). Yields to a generic node selection or
 * an active supply-route highlight.
 */
const STATUS_COLOR: Record<TrailerStatus, string> = {
  EMPTY: '#9fb2c8',
  FILLING: BRAND.tealCng,
  FULL: BRAND.tealCng,
  IN_TRANSIT: BRAND.primarySoft,
  DISCHARGING: '#e0a23c',
  RETURNING: '#9fb2c8',
};

export function TrailerInfoPanel() {
  const id = useTrailerInfoStore((s) => s.id);
  const close = useTrailerInfoStore((s) => s.close);
  const followId = useTrailerStore((s) => s.followId);
  const setFollow = useTrailerStore((s) => s.setFollow);
  useTrailerStore((s) => s.elapsed); // re-render each tick for live values
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);

  if (!id || selectedId || routeActive) return null;
  const snap = useTrailerStore.getState().snapshots().find((s) => s.id === id);
  if (!snap) return null;

  const pressure = Math.round((snap.fillPercent / 100) * 250);
  const eta = snap.etaSec > 0 ? `${Math.floor(snap.etaSec / 60)}:${Math.floor(snap.etaSec % 60).toString().padStart(2, '0')}` : '—';
  const following = followId === id;

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.tealCng }}>
            CNG · Cascade Logistics
          </div>
          <h3 className="text-base font-bold leading-tight">Cascade Trailer — {snap.id}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/85 px-1 py-0.5" style={{ lineHeight: 0 }}>
            <img src="/assets/branding/adani_logo.png" alt="Adani" style={{ width: 40, height: 'auto', display: 'block', opacity: 0.9 }} draggable={false} />
          </span>
          <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
        </div>
      </div>

      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        Transports CNG at 250 Bar from the Mother Station to Daughter / Daughter-Booster stations with no pipeline connection.
      </p>

      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[snap.status] }} />
        <span className="font-semibold">{snap.status.replace('_', ' ')}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Fleet ID" value={snap.id} />
        <Row label="Cylinders" value="32 (4×8)" />
        <Row label="Water Cap." value="8000 L" />
        <Row label="Max Pressure" value="250 Bar" />
        <Row label="Pressure" value={`${pressure} Bar`} accent={BRAND.tealCng} />
        <Row label="Fill Level" value={`${fmt(snap.fillPercent, 0)}%`} accent={BRAND.tealCng} />
      </div>

      {/* Fill bar */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${snap.fillPercent}%`, background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.tealCng})` }} />
      </div>

      {/* Bank bars */}
      <div className="mt-3 space-y-1.5">
        {(['A', 'B', 'C', 'D'] as const).map((b) => (
          <div key={b}>
            <div className="flex justify-between text-[10px] text-adani-muted">
              <span>BANK {b}</span>
              <span className="tabular-nums">{snap.bank[b]} Bar</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${(snap.bank[b] / 250) * 100}%`, background: BRAND.tealCng }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Origin" value="Mother Station" />
        <Row label="Destination" value="D. Booster" />
        <Row label="ETA" value={eta} />
        <Row label="Dist. Left" value={`${fmt(snap.distanceRemaining, 1)} km`} />
        <Row label="Last Hydro" value="14 Jun" />
        <Row label="Next Insp." value="14 Dec" />
      </div>

      <button
        onClick={() => setFollow(following ? null : id)}
        className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white"
        style={{ background: following ? BRAND.alert : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}
      >
        {following ? '■ Stop Following' : '🎥 Follow Trailer'}
      </button>
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
