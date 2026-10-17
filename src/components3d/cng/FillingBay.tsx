import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CascadeTrailer } from './CascadeTrailer';
import { MotherPartPicker } from './MotherPartPicker';
import { PipeRun } from '@/components3d/primitives/Pipe';
import { Valve, Gauge } from '@/components3d/primitives/Fittings';
import { concrete, steel, paintedMetal, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import {
  useMotherStore,
  fillPressure,
  fillProgress,
  isGrounded,
  isConnected,
  trailerPresent,
  trailerOffsetX,
  MOTHER_TARGET_BAR,
} from '@/state/useMotherStore';

/**
 * Section 02 §7 — Cascade Trailer Filling Bay (THE defining Mother-Station
 * feature). A marked, canopied bay where a cascade trailer parks and connects to
 * a 3-line HP filling panel with an earthing reel. Drives the full 6-stage fill
 * sequence from useMotherStore: arrival → securing (chocks + earth clamp, lamp
 * green) → connection (hoses) → filling (progressive trailer glow, display counts
 * to 250 Bar) → completion → departure. Local origin at bay centre; trailer
 * enters from −X and parks at x=0; the filling panel is at the +X head.
 */

/** Self-updating filling-panel display (imperative canvas — no per-frame re-render). */
function PanelDisplay() {
  const { tex, ctx, canvas } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    const x = c.getContext('2d')!;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, ctx: x, canvas: c };
  }, []);
  const acc = useRef(0);

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < 0.12) return;
    acc.current = 0;
    const { elapsed, stage, trailerId } = useMotherStore.getState();
    const cur = fillPressure(elapsed, stage);
    const pct = Math.round(fillProgress(elapsed, stage) * 100);
    const mm = Math.floor(elapsed / 60);
    const ss = Math.floor(elapsed % 60);
    ctx.fillStyle = '#06120f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7be3c0';
    ctx.font = '700 18px Inter, sans-serif';
    const rows: [string, string][] = [
      ['TARGET', `${MOTHER_TARGET_BAR} Bar`],
      ['CURRENT', `${cur} Bar`],
      ['FILL RATE', '1800 SCMH'],
      ['PROGRESS', `${pct}%`],
      ['ELAPSED', `${mm}:${ss.toString().padStart(2, '0')}`],
      ['TRAILER', trailerId],
    ];
    rows.forEach((r, i) => {
      const y = 20 + i * 26;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#5aa892';
      ctx.fillText(r[0], 14, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = i === 1 || i === 3 ? '#8ef3d6' : '#eaf6ff';
      ctx.font = '800 18px Inter, monospace';
      ctx.fillText(r[1], 306, y);
      ctx.font = '700 18px Inter, sans-serif';
    });
    tex.needsUpdate = true;
  });

  return (
    <mesh position={[0, 0, 0.001]}>
      <planeGeometry args={[0.7, 0.5]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/** The 3-line HP filling panel at the head of the bay (faces −X toward trailer). */
function FillingPanel() {
  const plinthMat = useMemo(() => concrete('#c8c4bc', 540), []);
  const panelMat = useMemo(() => steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 541 }), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 542 }), []);
  const hoodMat = useMemo(() => paintedMetal(BRAND.primary, 543), []);
  const greenMat = useMemo(() => emissive('#39d98a', 1.4), []);
  const redMat = useMemo(() => emissive('#d94f4f', 1.2), []);
  const groundedRef = useRef<boolean>(false);

  useFrame(() => {
    const { stage } = useMotherStore.getState();
    const g = isGrounded(stage);
    groundedRef.current = g;
    greenMat.emissiveIntensity = g ? 1.6 : 0.05;
    redMat.emissiveIntensity = g ? 0.05 : 1.2;
  });

  const front = -0.26; // panel faces −X

  return (
    <group position={[9.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* plinth */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow material={plinthMat}>
        <boxGeometry args={[2.6, 0.4, 0.9]} />
      </mesh>
      {/* open frame panel */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow material={panelMat}>
        <boxGeometry args={[2.2, 2.0, 0.5]} />
      </mesh>
      {/* protective canopy hood */}
      <mesh position={[0, 2.55, -0.15]} rotation={[-0.3, 0, 0]} castShadow material={hoodMat}>
        <boxGeometry args={[2.4, 0.08, 0.9]} />
      </mesh>

      {/* 3 HP quick-connect couplings on stub pipes + dust caps (on chains) */}
      {[-0.6, 0, 0.6].map((z, i) => (
        <group key={i} position={[z, 1.7, front]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={steelMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
          </mesh>
          <mesh position={[0, 0, -0.18]} material={paintedMetal('#e6b422', 544 + i)}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
          </mesh>
        </group>
      ))}

      {/* 3 isolation valves (handwheels) + 3 gauges + master gauge */}
      {[-0.6, 0, 0.6].map((z, i) => (
        <group key={i}>
          <group position={[z, 1.15, front + 0.05]} scale={0.4}>
            <Valve size={0.3} color={BRAND.primary} handwheel seed={548 + i} />
          </group>
          <group position={[z, 0.85, front + 0.06]} scale={0.7}>
            <Gauge radius={0.14} seed={551 + i} />
          </group>
          {/* vent valve + short tube */}
          <mesh position={[z + 0.14, 1.9, front + 0.05]} material={steelMat}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
          </mesh>
        </group>
      ))}
      <group position={[0.85, 1.55, front + 0.06]} scale={0.85}>
        <Gauge radius={0.16} seed={555} />
      </group>

      {/* ESD mushroom in a yellow enclosure */}
      <group position={[-0.85, 1.15, front + 0.04]}>
        <mesh material={paintedMetal('#f2d21e', 556)}>
          <boxGeometry args={[0.24, 0.24, 0.06]} />
        </mesh>
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={paintedMetal('#c01a1a', 557)}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
        </mesh>
      </group>

      {/* control display */}
      <mesh position={[0, 1.55, front + 0.02]} material={steel({ color: '#10161d', roughness: 0.3, seed: 558 })}>
        <boxGeometry args={[0.76, 0.56, 0.03]} />
      </mesh>
      <group position={[0, 1.55, front + 0.04]}>
        <PanelDisplay />
      </group>

      {/* grounding verification lamp (green when earthed, else red) */}
      <mesh position={[0.85, 1.9, front + 0.05]} material={greenMat}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
      </mesh>
      <mesh position={[0.85, 1.78, front + 0.05]} material={redMat}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
      </mesh>

      {/* signage */}
      <SignPlane text="CASCADE FILLING PANEL" width={1.8} position={[0, 0.55, front + 0.02]} options={{ fg: '#ffffff', bg: BRAND.primary, fontWeight: 800, radius: 4, paddingX: 16 }} />
      <SignPlane text="EARTH TRAILER BEFORE CONNECTING" width={2.0} position={[0, 2.15, front + 0.02]} options={{ fg: '#16202b', bg: '#f2d21e', fontWeight: 800, radius: 4, paddingX: 14 }} />
      <SignPlane text="MAX 250 BAR" width={0.9} position={[-0.85, 0.85, front + 0.06]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 800, radius: 4, paddingX: 12 }} />
      <LogoDecal position={[0.7, 0.55, front + 0.02]} width={0.7} backing backingColor="#ffffff" />
    </group>
  );
}

export function FillingBay() {
  const stage = useMotherStore((s) => s.stage);
  const trailerRef = useRef<THREE.Group>(null);
  const chockMat = useMemo(() => paintedMetal('#e6b422', 560), []);
  const slabMat = useMemo(() => concrete('#b4b1a8', 561), []);
  const jointMat = useMemo(() => steel({ color: '#3a4048', roughness: 0.9, metalness: 0.1, seed: 562 }), []);
  const canopyMat = useMemo(() => paintedMetal('#d5d8dc', 563), []);
  const soffitMat = useMemo(() => paintedMetal('#f5f5f5', 564), []);
  const fasciaMat = useMemo(() => paintedMetal(BRAND.primary, 565), []);
  const colMat = useMemo(() => paintedMetal(BRAND.primary, 566), []);
  const lightMat = useMemo(() => emissive('#fff4e0', 0.25), []);

  const present = trailerPresent(stage);
  const connected = isConnected(stage);
  const grounded = isGrounded(stage);
  const chocksIn = stage === 'securing' || stage === 'connection' || stage === 'filling' || stage === 'completion';

  useFrame(() => {
    if (trailerRef.current) {
      const { elapsed, stage: st } = useMotherStore.getState();
      trailerRef.current.position.x = trailerOffsetX(elapsed, st);
    }
  });

  return (
    <group>
      {/* Bay slab (raised) */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow material={slabMat}>
        <boxGeometry args={[18, 0.3, 5]} />
      </mesh>
      {/* expansion joints */}
      {[-6, -2, 2, 6].map((x, i) => (
        <mesh key={i} position={[x, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} material={jointMat}>
          <planeGeometry args={[0.06, 5]} />
        </mesh>
      ))}
      {/* yellow parking rectangle outline + text + wheel guide lines */}
      {([[0, 2.2, 14, 0.12], [0, -2.2, 14, 0.12]] as const).map((r, i) => (
        <mesh key={`gz${i}`} position={[r[0], 0.31, r[1]]} rotation={[-Math.PI / 2, 0, 0]} material={chockMat}>
          <planeGeometry args={[r[2], r[3]]} />
        </mesh>
      ))}
      {([-7, 7] as const).map((x, i) => (
        <mesh key={`gx${i}`} position={[x, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} material={chockMat}>
          <planeGeometry args={[0.12, 4.4]} />
        </mesh>
      ))}
      <SignPlane text="CASCADE FILLING BAY — TRAILER POSITION" width={9} position={[0, 0.32, 1.4]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#e6b422', fontWeight: 800, letterSpacing: 2 }} />
      {([1.4, -1.4] as const).map((z, i) => (
        <mesh key={`wl${i}`} position={[0, 0.315, z]} rotation={[-Math.PI / 2, 0, 0]} material={soffitMat}>
          <planeGeometry args={[13, 0.08]} />
        </mesh>
      ))}

      {/* protective bollards along both long sides */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = -7.5 + i * 2.5;
        return ([2.7, -2.7] as const).map((z) => (
          <group key={`${i}${z}`} position={[x, 0.3, z]}>
            <mesh position={[0, 0.6, 0]} castShadow material={chockMat}>
              <cylinderGeometry args={[0.1, 0.1, 1.2, 10]} />
            </mesh>
            <mesh position={[0, 0.75, 0]} material={steel({ color: '#1c1f22', seed: 568 })}>
              <cylinderGeometry args={[0.105, 0.105, 0.2, 10]} />
            </mesh>
          </group>
        ));
      })}

      {/* wheel chocks (appear once the trailer is secured) */}
      {chocksIn &&
        ([3.4, -3.4] as const).map((x, i) => (
          <mesh key={i} position={[x, 0.42, 1.3]} rotation={[0, 0, 0.5]} castShadow material={chockMat}>
            <boxGeometry args={[0.3, 0.24, 0.5]} />
          </mesh>
        ))}

      {/* lightweight canopy over the bay */}
      {([[-8.5, -2.6], [8.5, -2.6], [-8.5, 2.6], [8.5, 2.6]] as const).map((c, i) => (
        <mesh key={i} position={[c[0], 2.75, c[1]]} castShadow material={colMat}>
          <boxGeometry args={[0.4, 5.5, 0.4]} />
        </mesh>
      ))}
      <mesh position={[0, 5.7, 0]} castShadow receiveShadow material={canopyMat}>
        <boxGeometry args={[20, 0.4, 6]} />
      </mesh>
      <mesh position={[0, 5.5, 0]} material={soffitMat}>
        <boxGeometry args={[19.6, 0.05, 5.6]} />
      </mesh>
      {/* soffit lights */}
      {[-6, -2, 2, 6].map((x, i) => (
        <mesh key={i} position={[x, 5.47, 0]} material={lightMat}>
          <boxGeometry args={[1.4, 0.04, 1.0]} />
        </mesh>
      ))}
      {/* fascia + text */}
      {([1, -1] as const).map((s) => (
        <group key={s} position={[0, 5.7, s * 3.04]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <mesh material={fasciaMat}>
            <boxGeometry args={[20, 0.4, 0.06]} />
          </mesh>
          <SignPlane text="CASCADE FILLING BAY" width={7} position={[0, 0, 0.05]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 3 }} />
        </group>
      ))}

      {/* The filling panel (clickable) */}
      <MotherPartPicker part="filling-panel">
        <FillingPanel />
      </MotherPartPicker>

      {/* earthing reel + cable to the trailer chassis (visible when grounded) */}
      <group position={[8.6, 0.3, 1.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={paintedMetal('#2f6f8f', 569)}>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 16]} />
        </mesh>
        <mesh position={[0, 0.24, 0]} material={paintedMetal('#c01a1a', 570)}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
      </group>
      {grounded && (
        <PipeRun
          points={[[8.6, 0.5, 1.9], [6, 0.4, 1.7], [3.5, 0.9, 1.5], [2.2, 0.9, 1.5]]}
          radius={0.02}
          color="#0f3b12"
          seed={571}
          tension={0.4}
          radialSegments={6}
        />
      )}

      {/* filling hoses panel → trailer rear manifold (visible when connected; trailer at x=0) */}
      {connected &&
        [-0.6, 0, 0.6].map((z, i) => (
          <PipeRun
            key={i}
            points={[
              [8.95, 1.7, z],
              [7.2, 1.2, z * 0.6],
              [5.5, 1.5, 0],
              [4.6, 1.6, 0],
            ]}
            radius={0.035}
            color="#1a1c20"
            roughness={0.85}
            metalness={0.1}
            seed={572 + i}
            tension={0.4}
            radialSegments={8}
          />
        ))}

      {/* The cascade trailer (drives in/out; progressive glow during fill) */}
      {present && (
        <group ref={trailerRef}>
          <MotherPartPicker part="trailer">
            <CascadeTrailer position={[0, 0, 0]} rotation={0} animated />
          </MotherPartPicker>
        </group>
      )}
    </group>
  );
}
