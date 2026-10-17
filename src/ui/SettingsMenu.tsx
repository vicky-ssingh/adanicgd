import { useState } from 'react';
import { useSettingsStore, type Quality } from '@/state/useSettingsStore';
import { BRAND } from '@/theme/tokens';

const OPTS: { value: Quality; label: string; hint: string }[] = [
  { value: 'low', label: 'Low', hint: 'No AA/AO · fastest' },
  { value: 'medium', label: 'Medium', hint: 'Balanced' },
  { value: 'high', label: 'High', hint: 'Full effects' },
];

/** Graphics-quality menu (performance). Persists the choice to localStorage. */
export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="adani-panel grid h-9 w-9 place-items-center text-sm text-[color:var(--hud-text)]"
        aria-label="Graphics quality"
        title="Graphics quality"
      >
        ⚙
      </button>
      {open && (
        <div className="adani-panel absolute right-0 mt-1.5 w-44 overflow-hidden p-1.5">
          <div className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-adani-muted">
            Graphics Quality
          </div>
          {OPTS.map((o) => {
            const active = o.value === quality;
            return (
              <button
                key={o.value}
                onClick={() => {
                  setQuality(o.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/10"
                style={{ background: active ? `${BRAND.primary}33` : 'transparent' }}
              >
                <span className="text-xs font-semibold" style={{ color: active ? '#fff' : 'var(--hud-text)' }}>
                  {o.label}
                </span>
                <span className="text-[10px] text-adani-muted">{o.hint}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
