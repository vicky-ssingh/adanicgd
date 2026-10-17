import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { steel } from '@/materials/materials';

/**
 * Section 04 — a live pressure gauge whose needle moves with a value getter
 * (0..1). Used where the reading must visibly change: the discharge-panel master
 * gauge falling as the cascade depletes, and the booster suction/discharge
 * gauges. Dial faces +Z. Imperative canvas redraw (~6 fps) — no re-render.
 */
export function DynGauge({
  radius = 0.16,
  getValue,
  color = '#b23a3a',
  seed = 900,
}: {
  radius?: number;
  getValue: () => number; // 0..1
  color?: string;
  seed?: number;
}) {
  const caseMat = useMemo(() => steel({ color: '#d8dadd', roughness: 0.35, metalness: 0.6, seed }), [seed]);
  const { tex, ctx } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d')!;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, ctx: x };
  }, []);
  const acc = useRef(0);
  const draw = useRef((frac: number) => {
    const f = Math.max(0, Math.min(1, frac));
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#f4f2ea';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a2530';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(a) * 48, 64 + Math.sin(a) * 48);
      ctx.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56);
      ctx.stroke();
    }
    // needle sweeps ~270° from bottom-left (empty) to bottom-right (full)
    const na = Math.PI * 0.75 + f * Math.PI * 1.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.lineTo(64 + Math.cos(na) * 44, 64 + Math.sin(na) * 44);
    ctx.stroke();
    ctx.fillStyle = '#1a2530';
    ctx.beginPath();
    ctx.arc(64, 64, 5, 0, Math.PI * 2);
    ctx.fill();
    tex.needsUpdate = true;
  });

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < 0.16) return;
    acc.current = 0;
    draw.current(getValue());
  });

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={caseMat}>
        <cylinderGeometry args={[radius, radius, 0.06, 20]} />
      </mesh>
      <mesh position={[0, 0, 0.031]}>
        <circleGeometry args={[radius * 0.85, 20]} />
        <meshStandardMaterial map={tex} roughness={0.4} metalness={0} />
      </mesh>
      <mesh position={[0, -radius - 0.05, 0]} castShadow material={caseMat}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 8]} />
      </mesh>
    </group>
  );
}
