import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useDaughterStore, daughterView, boosterView } from '@/state/useDaughterStore';

/**
 * Section 04 — a dispenser fill-status panel that shows the whole point of the
 * two station types. Daughter: FILL PRESSURE follows the cascade down (NORMAL →
 * REDUCED → LOW → OUT OF SERVICE). Booster: FILL PRESSURE stays a constant
 * 200 Bar with a rising booster load. Imperative canvas — no re-render.
 */
export function DispenserStatusSign({ mode }: { mode: 'daughter' | 'booster' }) {
  const { tex, ctx, canvas } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 128;
    const x = c.getContext('2d')!;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, ctx: x, canvas: c };
  }, []);
  const acc = useRef(0);

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < 0.15) return;
    acc.current = 0;
    ctx.fillStyle = '#06120f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    if (mode === 'daughter') {
      const v = daughterView(useDaughterStore.getState().d);
      if (v.status === 'OFFLINE' && !v.swapping) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '800 26px Inter, sans-serif';
        ctx.fillText('⛔ OUT OF SERVICE', 16, 44);
        ctx.fillStyle = '#c99';
        ctx.font = '600 18px Inter, sans-serif';
        ctx.fillText('CASCADE DEPLETED', 16, 84);
      } else if (v.swapping) {
        ctx.fillStyle = '#8ad0ff';
        ctx.font = '800 24px Inter, sans-serif';
        ctx.fillText('SWAPPING TRAILER…', 16, 64);
      } else {
        const q = v.quality;
        const col = q === 'NORMAL' ? '#8ef3d6' : q === 'REDUCED' ? '#ffd27a' : '#ff9a6b';
        ctx.fillStyle = '#7be3c0';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.fillText('FILL PRESSURE', 16, 30);
        ctx.fillStyle = col;
        ctx.font = '800 34px Inter, monospace';
        ctx.fillText(`${Math.round(v.dispensing)} Bar`, 16, 66);
        ctx.font = '800 20px Inter, sans-serif';
        ctx.fillText(q === 'NORMAL' ? '● NORMAL FILL' : q === 'REDUCED' ? '⚠ REDUCED FILL' : '⚠ LOW PRESSURE', 16, 102);
      }
    } else {
      const v = boosterView(useDaughterStore.getState().b);
      if (v.status === 'OFFLINE' && !v.swapping) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '800 22px Inter, sans-serif';
        ctx.fillText('⛔ CASCADE EXHAUSTED', 16, 64);
      } else if (v.swapping) {
        ctx.fillStyle = '#8ad0ff';
        ctx.font = '800 24px Inter, sans-serif';
        ctx.fillText('SWAPPING TRAILER…', 16, 64);
      } else {
        ctx.fillStyle = '#7be3c0';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.fillText('FILL PRESSURE', 16, 30);
        ctx.fillStyle = '#8ef3d6';
        ctx.font = '800 34px Inter, monospace';
        ctx.fillText('200 Bar', 16, 66);
        ctx.font = '800 18px Inter, sans-serif';
        ctx.fillText('● NORMAL FILL', 16, 100);
        const load = v.load >= 90 ? 'MAX' : v.load >= 70 ? 'HIGH' : v.load >= 45 ? 'MED' : 'LIGHT';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd27a';
        ctx.fillText(`Booster: ${load} LOAD`, 304, 100);
        ctx.textAlign = 'left';
      }
    }
    tex.needsUpdate = true;
  });

  return (
    <mesh>
      <planeGeometry args={[1.1, 0.44]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}
