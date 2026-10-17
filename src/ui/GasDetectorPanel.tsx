import { useGasStore, gasLevel } from '@/state/useGasStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

/**
 * Section 08 §B.4 — gas-detector info panel with a SIMULATE GAS LEAK control that
 * demonstrates the rising-reading → 20% warning → 40% auto-ESD sequence.
 */
export function GasDetectorPanel() {
  const panelId = useGasStore((s) => s.panelId);
  const close = useGasStore((s) => s.closePanel);
  const start = useGasStore((s) => s.start);
  const stop = useGasStore((s) => s.stop);
  const active = useGasStore((s) => s.active);
  const reading = useGasStore((s) => s.reading);
  const autoTripped = useGasStore((s) => s.autoTripped);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const routeActive = useRouteStore((s) => s.edges !== null);
  if (!panelId || selectedId || routeActive) return null;

  const flame = panelId.startsWith('FD');
  const shown = active ? reading : 0;
  const lvl = gasLevel(shown);
  const col = lvl === 'high' ? BRAND.alert : lvl === 'low' ? '#e0a23c' : BRAND.tealCng;

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.tealCng }}>Safety · Gas Detection</div>
          <h3 className="text-base font-bold leading-tight">{flame ? 'Flame Detector' : 'Gas Detector'} — {panelId}</h3>
        </div>
        <button onClick={close} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">
        {flame ? 'Detects flame radiation at the dispenser/compressor areas and triggers alarm/ESD.' : 'Continuously monitors for methane accumulation and triggers alarms or automatic shutdown if gas is detected.'}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Type" value={flame ? 'IR/UV flame' : 'Infrared point'} />
        <Row label="Reading" value={`${fmt(shown, 0)}% LEL`} accent={col} />
        <Row label="Low Alarm" value="20% LEL" />
        <Row label="High Alarm" value="40% (auto-ESD)" />
        <Row label="Status" value={lvl === 'high' ? '⛔ HIGH ALARM' : lvl === 'low' ? '⚠ GAS DETECTED' : '● NORMAL'} accent={col} />
        <Row label="Last Cal." value="21 Aug" />
      </div>

      {active && (
        <div className="mt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${(shown / 40) * 100}%`, background: col }} /></div>
          {autoTripped && <div className="mt-2 rounded-md px-2 py-1.5 text-[11px] font-semibold" style={{ background: `${BRAND.alert}26`, color: '#f7b7c6' }}>⛔ AUTO-ESD — HIGH GAS CONCENTRATION</div>}
        </div>
      )}

      {!active ? (
        <button onClick={() => start('online-cng')} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: BRAND.alert }}>▶ Simulate Gas Leak</button>
      ) : (
        <button onClick={stop} className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20">■ Clear Leak</button>
      )}
      <ScadaTag tag={`GD-${panelId.replace(/\D/g, '') || '1005'}`} rtu="RTU-07" />
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
