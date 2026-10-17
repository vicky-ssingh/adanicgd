import { useCpStore } from '@/state/useCpStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/** Section 08 §D.4 — CP transformer-rectifier / test-point info panel. */
export function CpInfoPanel() {
  const info = useCpStore((s) => s.info);
  const close = useCpStore((s) => s.closeInfo);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  if (!info || selectedId || routeActive) return null;
  const isTr = info.kind === 'tr';
  const marginal = info.assessment?.includes('MARGINAL');

  return (
    <div className="adani-panel pointer-events-auto w-64 p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#e87722' }}>Cathodic Protection</div>
          <h3 className="text-base font-bold leading-tight">{isTr ? `Transformer Rectifier — ${info.id}` : `CP Test Point — ${info.id}`}</h3>
        </div>
        <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        {isTr
          ? 'Supplies impressed DC current to buried steel pipelines, preventing electrochemical corrosion and extending asset life.'
          : 'Monitoring point for pipe-to-soil potential, verifying that cathodic protection is effective here.'}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        {isTr ? (
          <>
            <Row label="Output V" value={info.outputV ?? ''} />
            <Row label="Output A" value={info.outputA ?? ''} />
            <Row label="Protected" value={`${fmt(info.protectedKm ?? 0, 1)} km`} />
            <Row label="Anode Bed" value="Deep well · 12" />
            <Row label="Chainage" value={`${fmt(info.chainageKm ?? 0, 1)} km`} />
            <Row label="Status" value="● ENERGISED" accent={BRAND.tealCng} />
          </>
        ) : (
          <>
            <Row label="Pipe-Soil" value={info.potential ?? ''} accent={marginal ? '#e0a23c' : BRAND.tealCng} />
            <Row label="Criterion" value="< -0.85 V" />
            <Row label="Pipeline" value="Primary PL-02" />
            <Row label="Chainage" value={`${fmt(info.chainageKm ?? 0, 1)} km`} />
            <Row label="Assessment" value={info.assessment ?? ''} accent={marginal ? '#e0a23c' : BRAND.tealCng} />
            <Row label="Status" value={marginal ? '● MARGINAL' : '● PROTECTED'} accent={marginal ? '#e0a23c' : BRAND.tealCng} />
          </>
        )}
      </div>
      {marginal && (
        <div className="mt-2 rounded-md px-2 py-1.5 text-[10px]" style={{ background: '#e0a23c22', color: '#f2d199' }}>
          ⚠ CP survey: marginal protection at chainage 5.2–5.8 km — investigation scheduled.
        </div>
      )}
      <ScadaTag tag={isTr ? `EI-${info.id}` : `EP-${info.id}`} rtu={isTr ? 'RTU-01' : 'RTU-02'} scan="15 min" />
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
