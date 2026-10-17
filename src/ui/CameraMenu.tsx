import { useState } from 'react';
import { CAMERA_PRESETS } from '@/config/cameraPresets';
import { useViewStore } from '@/state/useViewStore';
import { useTrailerStore } from '@/state/useTrailerStore';
import { BRAND } from '@/theme/tokens';

/**
 * Camera preset menu (spec §2.29). Selecting a location smoothly flies the
 * camera there via CameraRig.
 */
export function CameraMenu() {
  const [open, setOpen] = useState(false);
  const active = useViewStore((s) => s.cameraPreset);
  const setPreset = useViewStore((s) => s.setCameraPreset);
  const focusOn = useViewStore((s) => s.focusOn);

  const go = (id: string, position: [number, number, number], target: [number, number, number]) => {
    setPreset(id);
    // The "Follow" preset engages the tracking camera on the in-transit trailer;
    // any other preset leaves follow mode.
    if (id === 'trailer-follow') {
      useTrailerStore.getState().setFollow('CT-07');
    } else {
      useTrailerStore.getState().setFollow(null);
      focusOn(position, target);
    }
    setOpen(false);
  };

  const activeLabel = CAMERA_PRESETS.find((p) => p.id === active)?.label ?? 'Views';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="adani-panel flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[color:var(--hud-text)]"
      >
        <span aria-hidden>🎥</span>
        <span className="max-w-[120px] truncate">{activeLabel}</span>
        <span className="text-adani-muted">▾</span>
      </button>
      {open && (
        <div className="adani-panel absolute right-0 mt-1.5 w-52 overflow-hidden p-1">
          {CAMERA_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => go(p.id, p.position, p.target)}
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors hover:bg-white/10"
              style={{
                color: active === p.id ? '#fff' : 'var(--adani-muted)',
                background: active === p.id ? `${BRAND.primary}33` : 'transparent',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
