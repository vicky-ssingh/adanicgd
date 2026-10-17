import { useEffect, useRef, useState } from 'react';
import { onlineSource, motherSource, daughterSource, boosterSource, barFrac, type CascadeSource, type Bank3 } from '@/state/cascadeSources';
import { useViewStore } from '@/state/useViewStore';
import { CAMERA_PRESETS } from '@/config/cameraPresets';
import { BRAND } from '@/theme/tokens';

/**
 * Section 05 §10 — dashboard cascade summary for all stations. Shows each
 * station's HIGH/MEDIUM/LOW bank fill as mini bars and the active bank; each row
 * flies the camera to that cascade.
 */
const ROWS: { label: string; preset: string; src: CascadeSource }[] = [
  { label: 'Online CNG', preset: 'cng', src: onlineSource() },
  { label: 'Mother Station', preset: 'mother', src: motherSource() },
  { label: 'Daughter', preset: 'daughter', src: daughterSource() },
  { label: 'Daughter Boost', preset: 'booster', src: boosterSource() },
];
const SHORT: Record<Bank3, string> = { HIGH: 'H', MEDIUM: 'M', LOW: 'L' };

function MiniBar({ frac }: { frac: number }) {
  return (
    <span className="inline-flex h-2 w-6 overflow-hidden rounded-sm bg-white/10 align-middle">
      <span className="h-full rounded-sm" style={{ width: `${Math.max(6, frac * 100)}%`, background: BRAND.tealCng }} />
    </span>
  );
}

export function CascadeSummary() {
  const [open, setOpen] = useState(true);
  const [, force] = useState(0);
  const raf = useRef(0);
  const focusOn = useViewStore((s) => s.focusOn);

  // Light rAF tick (~10fps) so the live bank levels refresh.
  useEffect(() => {
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 100) { last = t; force((n) => n + 1); }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const fly = (preset: string) => {
    const p = CAMERA_PRESETS.find((x) => x.id === preset);
    if (p) focusOn(p.position, p.target);
  };

  return (
    <div className="adani-panel pointer-events-auto w-56 p-3 sm:w-64">
      <button onClick={() => setOpen((o) => !o)} className="mb-2 flex w-full items-center gap-1.5" aria-expanded={open}>
        <span className="text-xs font-bold tracking-wide">CASCADE STATUS</span>
        <span className="text-[10px] text-adani-muted">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-1">
          {ROWS.map((r) => {
            const banks = r.src.banks();
            const active = r.src.active();
            return (
              <button key={r.label} onClick={() => fly(r.preset)} className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1.5 text-left text-[10px] hover:bg-white/10">
                <span className="w-[68px] shrink-0 font-bold">{r.label}</span>
                <span className="flex items-center gap-1">
                  {(['HIGH', 'MEDIUM', 'LOW'] as Bank3[]).map((b) => (
                    <span key={b} className="flex items-center gap-0.5">
                      <span className="text-adani-muted">{SHORT[b]}</span>
                      <MiniBar frac={barFrac(b, banks[b])} />
                    </span>
                  ))}
                </span>
                <span className="ml-auto w-9 text-right font-semibold" style={{ color: active ? BRAND.tealCng : undefined }}>
                  {active ? SHORT[active] : '—'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
