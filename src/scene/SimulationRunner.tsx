import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '@/state/useSimStore';

/**
 * Headless simulation driver. Advances the sim store at a fixed ~10 Hz cadence
 * (independent of render FPS) so dashboard numbers update smoothly without
 * re-running the engine every frame. Lives inside the Canvas to use useFrame.
 */
export function SimulationRunner() {
  const acc = useRef(0);
  const advance = useSimStore((s) => s.advance);

  useFrame((_, delta) => {
    acc.current += delta;
    const step = 0.1;
    // Clamp catch-up after tab-switch stalls.
    let guard = 0;
    while (acc.current >= step && guard < 5) {
      advance(step);
      acc.current -= step;
      guard++;
    }
    if (acc.current > step) acc.current = 0;
  });

  return null;
}
