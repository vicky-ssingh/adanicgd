import { useDaughterStore, daughterView, boosterView } from '@/state/useDaughterStore';
import { useViewStore } from '@/state/useViewStore';
import { CAMERA_PRESETS } from '@/config/cameraPresets';
import { BRAND } from '@/theme/tokens';

/**
 * Section 04 Part C — station-type comparison. A launcher button opens a table of
 * all four CNG station types (rows fly the camera) and a live side-by-side of the
 * Daughter vs Booster showing the constant-200-Bar advantage in real time.
 */
const TABLE: { label: string; preset: string; pipeline: string; comp: string; cascade: string; press: string; util: string }[] = [
  { label: 'Online CNG', preset: 'cng', pipeline: '✓', comp: 'Main', cascade: 'Buffer', press: '200 Bar', util: 'n/a' },
  { label: 'Mother Station', preset: 'mother', pipeline: '✓', comp: '3× Large', cascade: 'HP + Fill', press: '200 Bar', util: 'n/a' },
  { label: 'Daughter', preset: 'daughter', pipeline: '✗', comp: 'NONE', cascade: 'Trailer', press: 'DECLINES', util: '45%' },
  { label: 'Daughter Boost', preset: 'booster', pipeline: '✗', comp: 'Booster', cascade: 'Trailer', press: '200 Bar', util: '85%' },
];

export function ComparisonPanel() {
  const open = useDaughterStore((s) => s.compareOpen);
  const setOpen = useDaughterStore((s) => s.setCompareOpen);
  const focusOn = useViewStore((s) => s.focusOn);
  useDaughterStore((s) => s.elapsed); // live

  const fly = (presetId: string) => {
    const p = CAMERA_PRESETS.find((x) => x.id === presetId);
    if (p) focusOn(p.position, p.target);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="adani-panel pointer-events-auto flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.primary})` }}
      >
        ⇄ <span className="hidden sm:inline">Compare Stations</span>
      </button>
    );
  }

  const d = daughterView(useDaughterStore.getState().d);
  const b = boosterView(useDaughterStore.getState().b);
  const warn = '#e0a23c';

  return (
    <div className="adani-panel pointer-events-auto w-[min(92vw,720px)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold tracking-wide">CNG STATION TYPE COMPARISON</span>
        <button onClick={() => setOpen(false)} className="rounded-md px-1.5 text-adani-muted hover:text-white" aria-label="Close">✕</button>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="text-adani-muted">
              {['Station Type', 'Pipeline', 'Compressor', 'Cascade', 'Fill Press', 'Utilisation'].map((h) => (
                <th key={h} className="border-b border-white/10 px-2 py-1.5 text-left font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE.map((r) => (
              <tr key={r.label} onClick={() => fly(r.preset)} className="cursor-pointer hover:bg-white/10">
                <td className="border-b border-white/5 px-2 py-1.5 font-bold">{r.label}</td>
                <td className="border-b border-white/5 px-2 py-1.5" style={{ color: r.pipeline === '✓' ? BRAND.tealCng : BRAND.alert }}>{r.pipeline}</td>
                <td className="border-b border-white/5 px-2 py-1.5">{r.comp}</td>
                <td className="border-b border-white/5 px-2 py-1.5">{r.cascade}</td>
                <td className="border-b border-white/5 px-2 py-1.5" style={{ color: r.press === 'DECLINES' ? warn : BRAND.tealCng }}>{r.press}</td>
                <td className="border-b border-white/5 px-2 py-1.5">{r.util}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1 text-[9px] text-adani-muted">Click a row to fly the camera to that station.</div>

      {/* Live side-by-side */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SideCard title="DAUGHTER STATION" accent={d.status === 'OPTIMAL' ? BRAND.tealCng : warn}>
          <Line k="Cascade" v={`${Math.round(d.cascade)} Bar`} />
          <Line k="Dispensing" v={`${Math.round(d.dispensing)} Bar`} warn={d.quality !== 'NORMAL'} />
          <Line k="Fill Time" v={`${Math.floor(d.fillMin)}m ${Math.round((d.fillMin % 1) * 60).toString().padStart(2, '0')}s`} />
          <Line k="Tank Fill" v={`${d.tankFill}%`} warn={d.tankFill < 100} />
          <Line k="Stranded" v={`${d.stranded} SCM`} warn />
          <Line k="Status" v={d.status} warn={d.status !== 'OPTIMAL'} />
        </SideCard>
        <SideCard title="DAUGHTER BOOSTER" accent={BRAND.tealCng}>
          <Line k="Cascade" v={`${Math.round(b.cascade)} Bar`} />
          <Line k="Dispensing" v={`${Math.round(b.dispensing)} Bar`} ok />
          <Line k="Fill Time" v="4m 00s" ok />
          <Line k="Tank Fill" v={`${b.tankFill}%`} ok />
          <Line k="Stranded" v={`${Math.round((40 / 250) * 8000 * 0.55)} SCM`} ok />
          <Line k="Status" v={b.status} ok={b.status === 'OPTIMAL'} />
        </SideCard>
      </div>
    </div>
  );
}

function SideCard({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white/[0.04] p-2.5">
      <div className="mb-1.5 text-[11px] font-bold" style={{ color: accent }}>{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Line({ k, v, warn, ok }: { k: string; v: string; warn?: boolean; ok?: boolean }) {
  const color = warn ? '#e0a23c' : ok ? BRAND.tealCng : undefined;
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-adani-muted">{k}</span>
      <span className="font-semibold tabular-nums" style={color ? { color } : undefined}>{v} {warn ? '⚠' : ok ? '✓' : ''}</span>
    </div>
  );
}
