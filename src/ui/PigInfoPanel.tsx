import { usePigStore, pigView } from '@/state/usePigStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useSvStore } from '@/state/useSvStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/**
 * Section 07 §B.3 — pig launcher/receiver info panel with the RUN PIGGING
 * OPERATION control. Yields to any other open panel.
 */
export function PigInfoPanel() {
  const panelId = usePigStore((s) => s.panelId);
  const close = usePigStore((s) => s.closePanel);
  const start = usePigStore((s) => s.start);
  const running = usePigStore((s) => s.running);
  usePigStore((s) => s.elapsed); // live refresh
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  const svPanel = useSvStore((s) => s.panelId);
  const stationPart = useStationInfoStore((s) => s.part);
  const motherPart = useMotherInfoStore((s) => s.part);

  if (!panelId || selectedId || routeActive || svPanel || stationPart || motherPart) return null;
  const isLauncher = panelId === 'PL-01';
  const v = pigView();

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>Common · Pig Trap</div>
          <h3 className="text-base font-bold leading-tight">{isLauncher ? 'Pig Launcher — PL-01' : 'Pig Receiver — PR-01'}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/85 px-1 py-0.5" style={{ lineHeight: 0 }}>
            <img src="/assets/branding/adani_logo.png" alt="Adani" style={{ width: 40, height: 'auto', display: 'block', opacity: 0.9 }} draggable={false} />
          </span>
          <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        {isLauncher
          ? 'Launches pipeline inspection gauges (pigs) for internal cleaning and inspection, without interrupting supply.'
          : 'Receives pigs at the far end of the pipeline after cleaning / inspection runs.'}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Barrel Size" value="DN600 × 3.5 m" />
        <Row label="Line Size" value="DN300" />
        <Row label="Barrel Press." value={v.pressurised ? '~20 Bar' : '0.0 Bar'} accent={v.pressurised ? '#e0a23c' : undefined} />
        <Row label="Closure" value={(isLauncher ? v.launcherDoor : v.receiverDoor) > 0.5 ? '● LOCKED' : '○ OPEN'} accent={BRAND.tealCng} />
        <Row label="Main Valve" value="● OPEN" accent={BRAND.tealCng} />
        <Row label="Kicker Valve" value={v.traveling ? '● OPEN' : '○ CLOSED'} />
        <Row label="Pig Type" value="Cleaning (foam)" />
        <Row label={isLauncher ? 'Receiver' : 'Launcher'} value={isLauncher ? 'PR-01 · 8.6 km' : 'PL-01'} />
      </div>

      {v.traveling && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-adani-muted"><span>PIG IN TRANSIT</span><span className="tabular-nums">{Math.round(v.progress * 100)}%</span></div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${v.progress * 100}%`, background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.tealCng})` }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="h-2 w-2 rounded-full" style={{ background: running ? '#e0a23c' : BRAND.tealCng }} />
        <span className="font-semibold">{running ? 'PIGGING RUN ACTIVE' : 'IDLE'}</span>
      </div>

      {isLauncher && (
        <button onClick={start} disabled={running} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}>
          ▶ Run Pigging Operation
        </button>
      )}
      {v.logActive && (
        <div className="mt-2 rounded-md bg-white/[0.06] px-2 py-1.5 text-[11px] font-semibold text-adani-muted">✓ PIGGING RUN COMPLETE — PL-01 → PR-01 — 8.6 km</div>
      )}
      <ScadaTag tag={isLauncher ? 'PT-1051' : 'PT-1052'} rtu={isLauncher ? 'RTU-01' : 'RTU-05'} />
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
