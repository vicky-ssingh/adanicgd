/**
 * Adani wordmark lockup (spec §0.1 / Shantigram §2). Uses the real Adani logo
 * PNG from /assets/branding, sized ~120px wide, never stretched. A subtle light
 * plate keeps the gradient wordmark legible on the dark glass panel.
 */
export function BrandLockup() {
  return (
    <div className="pointer-events-none flex items-center gap-3">
      <div className="rounded-md bg-white/90 px-2 py-1" style={{ lineHeight: 0 }}>
        <img
          src="/assets/branding/adani_logo.png"
          alt="Adani"
          style={{ width: 104, height: 'auto', display: 'block' }}
          draggable={false}
        />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-wide text-[color:var(--hud-text)]">
          SHANTIGRAM
        </div>
        <div className="text-[11px] font-medium text-adani-muted">
          City Gas Distribution · Digital Twin
        </div>
      </div>
    </div>
  );
}
