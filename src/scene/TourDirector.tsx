import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useTourStore } from '@/state/useTourStore';

/**
 * Cinematic camera behaviour during the guided tour. While a stop is being
 * narrated, the OrbitControls gently auto-orbit the target for a filmic feel;
 * auto-orbit is suppressed during the ~1.2s fly-in so it doesn't fight the
 * CameraRig tween. Restores manual control on exit.
 */

export function TourDirector() {
  const active = useTourStore((s) => s.active);
  const index = useTourStore((s) => s.index);
  const controls = useThree((s) => s.controls) as
    | { autoRotate: boolean; autoRotateSpeed: number }
    | null;
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!controls) return;
    window.clearTimeout(timer.current);
    if (!active) {
      controls.autoRotate = false;
      return;
    }
    // Wait out the fly-in, then start a slow orbit.
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.35;
    timer.current = window.setTimeout(() => {
      if (useTourStore.getState().active) controls.autoRotate = true;
    }, 1250);
    return () => window.clearTimeout(timer.current);
  }, [active, index, controls]);

  // Ensure it's off when unmounted.
  useEffect(
    () => () => {
      if (controls) controls.autoRotate = false;
    },
    [controls],
  );

  return null;
}
