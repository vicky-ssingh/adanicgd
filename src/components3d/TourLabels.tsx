import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { TOUR, type TourLabel } from '@/config/tour';
import { useTourStore } from '@/state/useTourStore';
import { useSimStore } from '@/state/useSimStore';
import { useStationStore } from '@/state/useStationStore';
import { useMotherStore, fillProgress } from '@/state/useMotherStore';
import { useDaughterStore, daughterView, boosterView } from '@/state/useDaughterStore';
import { useSvStore } from '@/state/useSvStore';
import { odorView } from '@/state/useOdorStore';
import { useGasStore, gasLevel } from '@/state/useGasStore';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { telemetryStats } from '@/state/useScadaStore';
import { fmt } from '@/utils/format';

/**
 * Section 13 Part A — reusable billboard tour labels. Each active tour stop's
 * primary label (and any sub-labels) is rendered as a DOM overlay projected from
 * the component's world position via drei <Html>, so it ALWAYS faces the camera,
 * stays upright (no roll), keeps a fixed on-screen size (12–20px), and renders
 * above scene geometry. A connector line points down to the component; live
 * values update in real time; labels fade in/out on stop entry/exit; sub-labels
 * are emphasised in process order. This is a SEPARATE, lighter-weight display —
 * clicking a component still opens its full info panel exactly as before.
 */

/** Resolve a label's live-value line from the live stores (§A.3). */
function resolveLive(key?: string): string | undefined {
  if (!key) return undefined;
  try {
    const v = useSimStore.getState().values;
    switch (key) {
      case 'transmission': return `${fmt(v.citygate?.flow ?? 0)} SCMH · ${fmt(v.citygate?.pressure ?? 0, 1)} Bar`;
      case 'citygate': return `${fmt(v.citygate?.flow ?? 0)} SCMH · ${fmt(v.citygate?.pressure ?? 0, 1)} Bar`;
      case 'metering': return `${fmt(v.metering?.flow ?? 0)} SCMH · ${fmt(v.metering?.pressure ?? 0, 1)} Bar`;
      case 'prs': return `Out ${fmt(v.prs?.pressure ?? 0, 1)} Bar · ${fmt(v.prs?.flow ?? 0)} SCMH`;
      case 'primary': return `${fmt(v.drs1?.pressure ?? 0, 1)} Bar · ${fmt(v.drs1?.flow ?? 0)} SCMH`;
      case 'drs3': return `Out ${fmt(v.drs3?.pressure ?? 0, 1)} Bar · ${fmt(v.drs3?.flow ?? 0)} SCMH`;
      case 'cng': return `${fmt(v['cng-station']?.flow ?? 0)} SCMH inlet`;
      case 'odor': { const o = odorView(); return `${fmt(o.dosingRate, 1)} mg/SCM · Tank ${Math.round(o.tankPct)}%`; }
      case 'cp': return '18.5 V · 4.2 A · energised';
      case 'sv': { const closed = useSvStore.getState().rt['SV-02'].closed; return closed ? '● CLOSED — section isolated' : '● OPEN'; }
      case 'cascade': { const st = useStationStore.getState(); return `Active bank: ${st.activeBank}`; }
      case 'priority': { const st = useStationStore.getState(); return `${st.lastSwitch} · ${st.switchesToday} today`; }
      case 'dispenser': { const st = useStationStore.getState(); return `${fmt(st.dispensedKg, 2)} kg · ₹${fmt(st.amount, 0)}`; }
      case 'mother': { const m = useMotherStore.getState(); return `${m.stage.toUpperCase()} · ${Math.round(fillProgress(m.elapsed, m.stage) * 100)}%`; }
      case 'trailer': return '250 Bar · 100%';
      case 'daughter': { const d = daughterView(useDaughterStore.getState().d); return `Cascade ${fmt(d.cascade, 0)} Bar · ${d.status}`; }
      case 'booster': { const b = boosterView(useDaughterStore.getState().b); return `Dispensing ${fmt(b.dispensing ?? 200, 0)} Bar ✓`; }
      case 'res': case 'res-meter': { const f = usePngConsumerStore.getState().flow.residential; return `${fmt(f, 1)} SCMH`; }
      case 'comm': { const f = usePngConsumerStore.getState().flow.commercial; return `${fmt(f, 1)} SCMH`; }
      case 'ind': { const f = usePngConsumerStore.getState().flow.industrial; return `${fmt(f, 0)} SCMH`; }
      case 'gas': { const g = useGasStore.getState(); const lvl = g.active ? gasLevel(g.reading) : 'normal'; return `${g.active ? Math.round(g.reading) : 0}% LEL · ${lvl === 'high' ? 'ALARM' : lvl === 'low' ? 'WARNING' : 'NORMAL'}`; }
      case 'scada': { const s = telemetryStats(); return `${s.online}/${s.total} RTU · ${s.availability.toFixed(1)}%`; }
      default: return undefined;
    }
  } catch {
    return undefined;
  }
}

function LabelCard({ label, opacity }: { label: TourLabel; opacity: number }) {
  const accent = label.accent ?? '#3C9BD1';
  const live = resolveLive(label.live);
  return (
    <Html position={label.anchor} zIndexRange={[140, 0]} style={{ pointerEvents: 'none' }} wrapperClass="tour-label-wrap">
      <div style={{ transform: 'translate(-50%, -100%)', opacity, transition: 'opacity 220ms ease', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))', width: 'max-content', maxWidth: 260 }}>
        <div
          style={{
            background: 'rgba(11,37,69,0.88)', border: `1px solid ${accent}`, borderRadius: 8,
            padding: '6px 10px', color: '#fff', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.3px', lineHeight: 1.2 }}>{label.name}</div>
          {label.purpose && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>{label.purpose}</div>}
          {live && <div style={{ fontSize: 11, marginTop: 2, fontFamily: 'ui-monospace, Menlo, monospace', color: accent }}>{live}</div>}
        </div>
        {/* connector line down to the component */}
        <div style={{ width: 1.5, height: 26, margin: '0 auto', background: `linear-gradient(${accent}, transparent)` }} />
      </div>
    </Html>
  );
}

export function TourLabels() {
  const active = useTourStore((s) => s.active);
  const index = useTourStore((s) => s.index);
  const [shown, setShown] = useState(index);
  const [vis, setVis] = useState(true);
  const [sub, setSub] = useState(0);
  const [, force] = useState(0);

  // Fade out then in when the stop changes (§A.4 lifecycle).
  useEffect(() => {
    if (shown === index) return;
    setVis(false);
    const t = window.setTimeout(() => { setShown(index); setSub(0); setVis(true); }, 200);
    return () => window.clearTimeout(t);
  }, [index, shown]);

  // Lead the eye through sub-components in process order (~3s each).
  useEffect(() => {
    setSub(0);
    const stop = TOUR[shown];
    if (!stop?.subLabels?.length) return;
    const id = window.setInterval(() => setSub((s) => Math.min(stop.subLabels!.length - 1, s + 1)), 3000);
    return () => window.clearInterval(id);
  }, [shown]);

  // Refresh live values ~5 fps.
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  if (!active) return null;
  const stop = TOUR[shown];
  if (!stop) return null;

  return (
    <>
      {stop.label && <LabelCard label={stop.label} opacity={vis ? 1 : 0} />}
      {/* Reveal sub-labels ONE AT A TIME in process order — the others fade fully
         out (opacity 0) instead of lingering dimmed, so a cluster of skids (e.g.
         the City Gate) no longer stacks 4 overlapping cards over the view. Each
         component also has its own dedicated tour stop and a hover label. */}
      {stop.subLabels?.map((sl, i) => (
        <LabelCard key={sl.name} label={sl} opacity={vis && i === sub ? 0.95 : 0} />
      ))}
    </>
  );
}
