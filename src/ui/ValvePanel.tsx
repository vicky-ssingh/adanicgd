import { useValveStore } from '@/state/useValveStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useSvStore } from '@/state/useSvStore';
import { LINE_VALVES, LINE_VALVE_BY_ID } from '@/config/lineValves';
import { BRAND } from '@/theme/tokens';
import { ScadaTag } from './ScadaTag';

const KIND_LABEL = { au: 'Actuator Operating Valve', ball: 'Ball valve', small: 'Small-bore ball valve' } as const;

/**
 * Line-valve panel (2D reference parity). Shows the valve's role, rating and
 * live position; Close (with confirmation for isolation valves) / Open, plus
 * the network-wide "ESD — close every isolation valve" and "Open all" commands.
 */
export function ValvePanel() {
  const panelId = useValveStore((s) => s.panelId);
  const confirmId = useValveStore((s) => s.confirmId);
  const rtAll = useValveStore((s) => s.rt);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const svPanel = useSvStore((s) => s.panelId);
  if (!panelId || selectedId || svPanel) return null;

  const st = useValveStore.getState();
  const def = LINE_VALVE_BY_ID[panelId];
  const rt = rtAll[panelId];
  const closed = rt.closed;
  const moving = Math.abs(rt.ind - (closed ? 1 : 0)) > 0.01;
  const position = moving ? (closed ? '◐ CLOSING…' : '◐ OPENING…') : closed ? '● CLOSED' : '● OPEN';
  const anyClosed = LINE_VALVES.some((v) => rtAll[v.id].closed);

  return (
    <div className="adani-panel pointer-events-auto max-h-[calc(100vh-11rem)] w-64 overflow-y-auto p-4 sm:w-72" onMouseEnter={() => st.setHover(panelId)} onMouseLeave={() => st.setHover(null)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.primarySoft }}>{def.kicker}</div>
          <h3 className="text-base font-bold leading-tight">{def.name}</h3>
        </div>
        <button onClick={st.closePanel} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-adani-muted">{def.desc}</p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <Row label="Valve ID" value={def.id} />
        <Row label="Type" value={KIND_LABEL[def.kind]} />
        <Row label="Pressure" value={def.pressure} />
        <Row label="Size" value={def.size} />
        <Row label="Position" value={position} accent={closed ? BRAND.alert : BRAND.tealCng} />
        <Row label="Mode" value={def.kind === 'au' ? 'REMOTE / ESD' : 'MANUAL'} />
      </div>

      <ul className="mt-3 list-disc space-y-0.5 pl-4 text-[11px] leading-snug text-adani-muted">
        {def.facts.map((f, i) => <li key={i}>{f}</li>)}
      </ul>

      {confirmId === panelId ? (
        <div className="mt-3 rounded-lg p-2.5" style={{ background: `${BRAND.alert}1f`, border: `1px solid ${BRAND.alert}55` }}>
          <div className="text-[11px] font-semibold text-white">Closing {def.id} will isolate {def.affected}. Continue?</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => st.setClosed(panelId, true)} className="flex-1 rounded-md px-2 py-1.5 text-xs font-bold text-white" style={{ background: BRAND.alert }}>Confirm</button>
            <button onClick={st.cancelConfirm} className="flex-1 rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Cancel</button>
          </div>
        </div>
      ) : closed ? (
        <button onClick={() => st.setClosed(panelId, false)} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.tealCng})` }}>⊙ Open Valve</button>
      ) : (
        <button onClick={() => (def.esd ? st.requestClose(panelId) : st.setClosed(panelId, true))} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: BRAND.alert }}>⊗ Close Valve</button>
      )}
      {closed && (
        <div className="mt-2 rounded-md px-2 py-1.5 text-[11px] font-semibold" style={{ background: `${BRAND.alert}26`, color: '#f7b7c6' }}>
          ⛔ {def.affected.toUpperCase()} ISOLATED
        </div>
      )}

      <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
        <button onClick={st.esdCloseAll} className="flex-1 rounded-md px-2 py-1.5 text-[11px] font-bold text-white" style={{ background: `${BRAND.alert}cc` }} title="Emergency shutdown — close every isolation valve">⛔ ESD all</button>
        <button onClick={st.openAll} disabled={!anyClosed} className="flex-1 rounded-md bg-white/10 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 disabled:opacity-40">Open all</button>
      </div>
      <ScadaTag tag={def.kind === 'au' ? `ZSC-${def.tag.slice(3)}` : def.tag} rtu={def.id.startsWith('V-4') ? 'RTU-16' : 'RTU-01'} />
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
