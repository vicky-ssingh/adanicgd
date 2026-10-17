import { useMarkerStore } from '@/state/useMarkerStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useSvStore } from '@/state/useSvStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';

/** Section 07 §C.5 — pipeline route-marker info panel. */
export function MarkerInfoPanel() {
  const info = useMarkerStore((s) => s.info);
  const close = useMarkerStore((s) => s.close);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const svPanel = useSvStore((s) => s.panelId);
  if (!info || selectedId || routeActive || svPanel) return null;

  return (
    <div className="adani-panel pointer-events-auto w-60 p-4 sm:w-64">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#f5c400' }}>Pipeline Route Marker</div>
          <h3 className="text-base font-bold leading-tight">{info.id}</h3>
        </div>
        <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        Marks the route of a buried gas pipeline to prevent third-party damage during excavation.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Pipeline" value={info.pipeline} />
        <Row label="Material" value={info.material} />
        <Row label="Depth" value={info.depth} />
        <Row label="Chainage" value={`${fmt(info.chainageKm, 1)} km`} />
        <Row label="Pressure" value={info.pressure} />
        <Row label="Direction" value={info.direction} />
        <Row label="Nearest SV" value={info.nearestSv} />
        <Row label="Status" value="● IN SERVICE" accent={BRAND.tealCng} />
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-adani-muted">{label}</div>
      <div className="font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
