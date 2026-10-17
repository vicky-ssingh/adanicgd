import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

/**
 * Branded loading screen (spec §0.1). Driven by drei's asset-load progress so
 * it covers the scene until HDRI/textures/models are ready, then fades out.
 * If nothing is loading (e.g. before any Suspense asset registers), it dismisses
 * itself after a short grace window so it never hangs at 0%.
 */
export function LoadingScreen() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    // Once loading finishes (or nothing ever loads), fade out and unmount.
    if (!active && progress >= 100) {
      const t = setTimeout(() => setFaded(true), 150);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [active, progress]);

  // Grace window: if no assets have started loading, dismiss.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!active && progress === 0) setFaded(true);
    }, 600);
    return () => clearTimeout(t);
  }, [active, progress]);

  useEffect(() => {
    if (!faded) return;
    const t = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(t);
  }, [faded]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center transition-opacity duration-500"
      style={{
        opacity: faded ? 0 : 1,
        background:
          'radial-gradient(1200px 800px at 50% 30%, var(--adani-navy), var(--adani-navy-deep) 70%)',
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="rounded-xl bg-white/95 px-5 py-3" style={{ lineHeight: 0 }}>
          <img
            src="/assets/branding/adani_logo.png"
            alt="Adani"
            style={{ width: 200, height: 'auto', display: 'block' }}
            draggable={false}
          />
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold tracking-[0.2em]">ADANI SHANTIGRAM</div>
          <div className="mt-1 text-xs font-medium text-adani-muted">
            City Gas Distribution Network — Digital Twin
          </div>
          <div className="mt-2 text-[13px] italic text-[color:var(--adani-primary-soft)]">
            Shantigram — Where The Good Life Begins
          </div>
        </div>
        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{
              width: `${Math.max(progress, 6)}%`,
              background: 'linear-gradient(90deg, var(--adani-teal-cng), var(--adani-primary))',
            }}
          />
        </div>
      </div>
    </div>
  );
}
