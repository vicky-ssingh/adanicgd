import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { DynGauge } from './DynGauge';
import { Valve } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal, concrete } from '@/materials/materials';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import {
  onlineSource,
  barFrac,
  BANK3,
  BANK_COLOR3,
  type CascadeSource,
  type Bank3,
} from '@/state/cascadeSources';

/**
 * Section 05 §6 — Priority Panel, full geometry, built at every station. A
 * brushed-stainless cabinet on a stand + plinth: rain hood, barrel hinges, latch
 * + padlock hasp, louvres, corner lugs; a logo plate + PP-01 nameplate; an
 * emissive digital display (ACTIVE BANK + OUTLET, flashes on a switch event); 3
 * live pressure gauges with needles that rotate in real time; 3 indicator LEDs
 * (active pulses); 3 solenoid valve bodies with actuator coils; colour-matched
 * inlet tubes + isolation valves; an outlet tube with a check valve + gauge; and
 * conduit into the ground. Driven by a CascadeSource (defaults to the Online
 * station), so every station shows its own live LOW→MEDIUM→HIGH sequencing.
 * Front faces +Z; local origin at ground.
 */

/** Self-updating display: ACTIVE BANK + OUTLET, with a switch-event flash. */
function PriorityDisplay({ source }: { source: CascadeSource }) {
  const { tex, ctx } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 96;
    const x = c.getContext('2d')!;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, ctx: x };
  }, []);
  const acc = useRef(0);
  const prev = useRef<Bank3 | null>(source.active());
  const flashUntil = useRef(0);
  const flashText = useRef('');

  useFrame((_, delta) => {
    const now = performance.now();
    const a = source.active();
    if (a !== prev.current) {
      if (prev.current && a) { flashText.current = `SWITCHING ${prev.current} → ${a}`; flashUntil.current = now + 900; }
      prev.current = a;
    }
    acc.current += delta;
    if (acc.current < 0.1) return;
    acc.current = 0;
    ctx.fillStyle = '#06120f'; ctx.fillRect(0, 0, 256, 96);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    if (now < flashUntil.current) {
      ctx.fillStyle = Math.floor(now / 150) % 2 ? '#ffd27a' : '#8ef3d6';
      ctx.font = '800 22px Inter, sans-serif';
      ctx.fillText(flashText.current, 12, 48);
    } else {
      ctx.fillStyle = '#7be3c0'; ctx.font = '700 16px Inter, sans-serif';
      ctx.fillText('ACTIVE BANK', 12, 26);
      ctx.fillText('OUTLET', 12, 66);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8ef3d6'; ctx.font = '800 24px Inter, monospace';
      ctx.fillText(a ?? 'IDLE', 244, 26);
      ctx.fillStyle = '#eaf6ff';
      ctx.fillText(`${Math.round(source.outlet())} Bar`, 244, 66);
    }
    tex.needsUpdate = true;
  });

  return (
    <mesh position={[0, 0, 0.001]}>
      <planeGeometry args={[0.6, 0.22]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export function PriorityPanel({ source, id = 'PP-01' }: { source?: CascadeSource; id?: string }) {
  const src = useMemo(() => source ?? onlineSource(), [source]);
  const cabMat = useMemo(() => steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 240 }), []);
  const doorMat = useMemo(() => steel({ color: '#b6bbc0', roughness: 0.3, metalness: 0.9, seed: 241 }), []);
  const standMat = useMemo(() => steel({ color: '#6f757c', seed: 242 }), []);
  const darkMat = useMemo(() => steel({ color: '#10161d', roughness: 0.4, metalness: 0.3, seed: 243 }), []);
  const hoodMat = useMemo(() => paintedMetal('#aeb3b8', 244), []);

  // Per-LED + per-solenoid-coil materials (mutated each frame).
  const ledMats = useMemo(() => BANK3.map((b) => new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color(BANK_COLOR3[b]), emissiveIntensity: 0.3 })), []);
  const coilMats = useMemo(() => BANK3.map((b) => new THREE.MeshStandardMaterial({ color: BANK_COLOR3[b], emissive: new THREE.Color(BANK_COLOR3[b]), emissiveIntensity: 0.15, roughness: 0.5 })), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = src.active();
    const r = src.refill();
    BANK3.forEach((b, i) => {
      const isActive = a === b;
      const isFill = r === b;
      ledMats[i].emissiveIntensity = isActive ? 1.2 + Math.sin(t * 6) * 0.7 : 0.28;
      coilMats[i].emissiveIntensity = isActive ? 1.3 : isFill ? 0.6 + Math.sin(t * 4) * 0.4 : 0.15;
    });
  });

  const W = 0.8, H = 1.2, D = 0.4;
  const standH = 0.5, plinthH = 0.2;
  const cy = plinthH + standH + H / 2;
  const front = D / 2 + 0.001;
  const cols = [-0.24, 0, 0.24];

  return (
    <group>
      {/* plinth */}
      <mesh position={[0, plinthH / 2, 0]} receiveShadow material={concrete('#b9b5ac', 245)}>
        <boxGeometry args={[1.1, plinthH, 0.7]} />
      </mesh>
      {/* stand: 4 legs + cross brace + base plates */}
      {([[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]] as const).map((p, i) => (
        <group key={i}>
          <mesh position={[p[0], plinthH + standH / 2, p[1]]} castShadow material={standMat}><boxGeometry args={[0.05, standH, 0.05]} /></mesh>
          <mesh position={[p[0], plinthH + 0.02, p[1]]} material={standMat}><boxGeometry args={[0.12, 0.04, 0.12]} /></mesh>
        </group>
      ))}
      <mesh position={[0, plinthH + 0.2, 0]} material={standMat}><boxGeometry args={[0.62, 0.03, 0.03]} /></mesh>

      {/* cabinet body */}
      <mesh position={[0, cy, 0]} castShadow receiveShadow material={cabMat}><boxGeometry args={[W, H, D]} /></mesh>
      {/* corner mounting lugs */}
      {([[-W / 2, H / 2], [W / 2, H / 2], [-W / 2, -H / 2], [W / 2, -H / 2]] as const).map((p, i) => (
        <mesh key={i} position={[p[0], cy + p[1], -D / 2 + 0.02]} material={standMat}><boxGeometry args={[0.06, 0.06, 0.03]} /></mesh>
      ))}
      {/* recessed front door + seam */}
      <mesh position={[0, cy, front]} material={doorMat}><boxGeometry args={[W - 0.08, H - 0.1, 0.02]} /></mesh>
      {/* rain hood */}
      <mesh position={[0, cy + H / 2 + 0.03, front - 0.02]} rotation={[-0.25, 0, 0]} castShadow material={hoodMat}><boxGeometry args={[W + 0.06, 0.03, 0.16]} /></mesh>
      {/* 3 barrel hinges (left) + latch handle + padlock hasp (right) */}
      {[cy + 0.42, cy, cy - 0.42].map((hy, i) => (
        <mesh key={i} position={[-W / 2 + 0.02, hy, front - 0.005]} material={standMat}><cylinderGeometry args={[0.02, 0.02, 0.09, 8]} /></mesh>
      ))}
      <mesh position={[W / 2 - 0.06, cy - 0.05, front + 0.01]} material={standMat}><boxGeometry args={[0.05, 0.12, 0.03]} /></mesh>
      <mesh position={[W / 2 - 0.06, cy - 0.18, front + 0.02]} material={darkMat}><boxGeometry args={[0.04, 0.05, 0.03]} /></mesh>
      {/* lower-door louvres (4 slots) + drain weep holes */}
      {[-0.48, -0.54, -0.6, -0.66].map((dy, i) => (
        <mesh key={i} position={[0, cy + dy, front + 0.005]} material={darkMat}><boxGeometry args={[W * 0.5, 0.02, 0.01]} /></mesh>
      ))}

      {/* nameplate + logo (top) */}
      <LogoDecal position={[-0.16, cy + 0.5, front + 0.02]} width={0.34} backing backingColor="#ffffff" />
      <SignPlane text={`PRIORITY PANEL — ${id}`} width={0.66} position={[0, cy + 0.36, front + 0.02]} options={{ fg: '#16202b', bg: '#d6dade', fontWeight: 800, letterSpacing: 0 }} />

      {/* digital display */}
      <mesh position={[0, cy + 0.18, front + 0.01]} material={darkMat}><boxGeometry args={[0.64, 0.24, 0.02]} /></mesh>
      <group position={[0, cy + 0.18, front + 0.02]}><PriorityDisplay source={src} /></group>

      {/* 3 live gauges + labels */}
      {BANK3.map((b, i) => (
        <group key={b}>
          <group position={[cols[i], cy - 0.06, front + 0.02]} scale={0.42}>
            <DynGauge radius={0.14} getValue={() => barFrac(b, src.banks()[b])} seed={246 + i} />
          </group>
          <SignPlane text={b} width={0.2} position={[cols[i], cy - 0.19, front + 0.02]} options={{ fg: '#16202b', fontWeight: 700 }} />
        </group>
      ))}

      {/* 3 indicator LEDs */}
      {BANK3.map((b, i) => (
        <mesh key={b} position={[cols[i], cy - 0.3, front + 0.015]} material={ledMats[i]}><cylinderGeometry args={[0.025, 0.025, 0.02, 10]} /></mesh>
      ))}

      {/* 3 solenoid valve bodies with actuator coils */}
      {BANK3.map((b, i) => (
        <group key={b} position={[cols[i], cy - 0.46, front - 0.01]}>
          <mesh material={darkMat}><boxGeometry args={[0.1, 0.12, 0.08]} /></mesh>
          <mesh position={[0, 0.12, 0]} material={coilMats[i]}><cylinderGeometry args={[0.045, 0.045, 0.07, 12]} /></mesh>
        </group>
      ))}

      {/* colour-matched inlet tubes + isolation valves (from below) */}
      {BANK3.map((b, i) => (
        <group key={b}>
          <mesh position={[cols[i], plinthH + standH * 0.5, -0.05]} material={paintedMetal(BANK_COLOR3[b], 250 + i)}><cylinderGeometry args={[0.025, 0.025, standH + 0.3, 8]} /></mesh>
          <group position={[cols[i], plinthH + 0.18, -0.05]} scale={0.24}><Valve size={0.28} color={BANK_COLOR3[b]} handwheel seed={253 + i} /></group>
        </group>
      ))}
      {/* outlet tube (grey) + check valve + outlet gauge */}
      <mesh position={[0.32, plinthH + standH * 0.5, -0.1]} material={steel({ color: '#b0b6bd', seed: 256 })}><cylinderGeometry args={[0.03, 0.03, standH + 0.2, 8]} /></mesh>
      <group position={[0.32, cy - 0.35, -0.12]} rotation={[Math.PI / 2, 0, 0]} scale={0.4}>
        <DynGauge radius={0.14} getValue={() => src.outlet() / 250} color="#1a2530" seed={257} />
      </group>
      {/* electrical conduit into the ground */}
      <mesh position={[-0.32, standH * 0.4, -0.12]} material={standMat}><cylinderGeometry args={[0.02, 0.02, standH + 0.4, 8]} /></mesh>

      {/* signage */}
      <SignPlane text="CAUTION — HIGH PRESSURE 250 BAR" width={0.72} position={[0, cy - 0.56, front + 0.02]} options={{ fg: '#7a1020', bg: '#f2d21e', fontWeight: 800, radius: 3, paddingX: 8 }} />
      {/* schematic decal on the door side */}
      <SignPlane text="H | M | L  AUTO" width={0.5} position={[-W / 2 - 0.001, cy + 0.2, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#16202b', bg: '#c9ccd0', fontWeight: 700 }} />
      <SignPlane text="AUTOMATIC OPERATION — DO NOT OPERATE MANUALLY" width={0.78} position={[W / 2 + 0.001, cy, 0]} rotation={[0, Math.PI / 2, 0]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 700, paddingX: 6 }} />
    </group>
  );
}
