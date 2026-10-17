import { useEffect } from 'react';
import { useRouteStore } from '@/state/useRouteStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useMeterStore } from '@/state/useMeterStore';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { fmt } from '@/utils/format';
import { BRAND } from '@/theme/tokens';

/**
 * Gas-supply route panel (Fix Problem 2D). Shows the full source→consumer chain
 * for the clicked building/station while the 3D route is highlighted. Clears on
 * close or Escape.
 */
export function RoutePanel() {
  const title = useRouteStore((s) => s.title);
  const chain = useRouteStore((s) => s.chain);
  const flow = useRouteStore((s) => s.flow);
  const edges = useRouteStore((s) => s.edges);
  const clearRoute = useRouteStore((s) => s.clear);
  const clearSelection = useSelectionStore((s) => s.clear);
  const meterActive = useMeterStore((s) => s.active);
  const consumerPanel = usePngConsumerStore((s) => s.panel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearRoute();
        clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearRoute, clearSelection]);

  // The meter / PNG-consumer panels take the right slot and carry the route
  // chain themselves, so the standalone route panel yields to them.
  if (meterActive || consumerPanel) return null;
  if (!edges) return null;

  return (
    <div className="adani-panel pointer-events-auto absolute right-4 top-20 w-64 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-bold leading-tight" style={{ color: BRAND.tealCng }}>
          {title}
        </h3>
        <button onClick={clearRoute} className="rounded px-1.5 text-adani-muted hover:text-white" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="mt-1 text-[11px] text-adani-muted">
        Live flow along route · <span className="font-semibold text-white">{fmt(flow)} SCMH</span>
      </div>

      <div className="mt-3 flex flex-col">
        {chain.map((stage, i) => (
          <div key={i} className="flex flex-col items-start">
            <div
              className="w-full rounded-md px-2.5 py-1.5 text-[12px] font-semibold"
              style={{
                background: i === chain.length - 1 ? `${BRAND.tealCng}2a` : 'rgba(255,255,255,0.05)',
                color: i === chain.length - 1 ? '#bff3ef' : 'var(--hud-text)',
                border: i === chain.length - 1 ? `1px solid ${BRAND.tealCng}66` : '1px solid transparent',
              }}
            >
              {stage}
            </div>
            {i < chain.length - 1 && (
              <div className="py-0.5 pl-3 text-[11px] text-adani-muted">↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
