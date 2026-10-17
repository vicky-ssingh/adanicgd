import { useMemo } from 'react';
import * as THREE from 'three';
import { steel, paintedMetal } from '@/materials/materials';

/**
 * Industrial fittings (spec §2.3 / §2.4): flange with bolt ring, valve with
 * actuator/handwheel, pressure gauge, and a small instrument sensor. All are
 * axis-agnostic groups you position/rotate at connection points.
 */

/** Bolted flange disc. */
export function Flange({
  radius = 0.28,
  thickness = 0.08,
  bolts = 8,
  seed = 3,
}: {
  radius?: number;
  thickness?: number;
  bolts?: number;
  seed?: number;
}) {
  const mat = useMemo(() => steel({ color: '#8b9299', roughness: 0.45, seed }), [seed]);
  const boltMat = useMemo(() => steel({ color: '#5c6167', roughness: 0.5, seed: seed + 1 }), [seed]);
  const boltPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < bolts; i++) {
      const a = (i / bolts) * Math.PI * 2;
      arr.push([Math.cos(a) * radius * 0.74, 0, Math.sin(a) * radius * 0.74]);
    }
    return arr;
  }, [bolts, radius]);

  return (
    <group>
      <mesh castShadow receiveShadow material={mat}>
        <cylinderGeometry args={[radius, radius, thickness, 24]} />
      </mesh>
      {boltPositions.map((p, i) => (
        <mesh key={i} position={[p[0], 0, p[2]]} castShadow material={boltMat}>
          <cylinderGeometry args={[0.03, 0.03, thickness + 0.05, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Ball/gate valve: body + two flanges + rising actuator or handwheel. */
export function Valve({
  size = 0.34,
  color = '#b23a3a',
  handwheel = true,
  seed = 5,
}: {
  size?: number;
  color?: string;
  handwheel?: boolean;
  seed?: number;
}) {
  const bodyMat = useMemo(() => paintedMetal(color, seed), [color, seed]);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: seed + 2 }), [seed]);

  return (
    <group>
      {/* body */}
      <mesh castShadow receiveShadow material={bodyMat}>
        <sphereGeometry args={[size, 20, 16]} />
      </mesh>
      {/* end flanges along X */}
      <group position={[size * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Flange radius={size * 0.85} thickness={0.07} bolts={6} seed={seed + 3} />
      </group>
      <group position={[-size * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Flange radius={size * 0.85} thickness={0.07} bolts={6} seed={seed + 4} />
      </group>
      {/* bonnet + stem */}
      <mesh position={[0, size * 0.9, 0]} castShadow material={steelMat}>
        <cylinderGeometry args={[size * 0.35, size * 0.45, size * 0.9, 12]} />
      </mesh>
      {handwheel ? (
        <group position={[0, size * 1.5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={steelMat}>
            <torusGeometry args={[size * 0.6, 0.035, 8, 20]} />
          </mesh>
          <mesh castShadow material={steelMat}>
            <cylinderGeometry args={[0.04, 0.04, size * 0.5, 8]} />
          </mesh>
        </group>
      ) : (
        // pneumatic actuator
        <mesh position={[0, size * 1.6, 0]} castShadow material={steel({ color: '#d8d3c2', seed: seed + 6 })}>
          <cylinderGeometry args={[size * 0.55, size * 0.55, size * 0.8, 16]} />
        </mesh>
      )}
    </group>
  );
}

/** Round pressure gauge on a short stem (dial faces +Z by default). */
export function Gauge({
  radius = 0.16,
  seed = 7,
}: {
  radius?: number;
  seed?: number;
}) {
  const caseMat = useMemo(() => steel({ color: '#d8dadd', roughness: 0.35, metalness: 0.6, seed }), [seed]);
  const face = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
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
    // needle
    ctx.strokeStyle = '#b23a3a';
    ctx.lineWidth = 4;
    const na = -Math.PI / 2 + 2.1;
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.lineTo(64 + Math.cos(na) * 44, 64 + Math.sin(na) * 44);
    ctx.stroke();
    ctx.fillStyle = '#1a2530';
    ctx.beginPath();
    ctx.arc(64, 64, 5, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={caseMat}>
        <cylinderGeometry args={[radius, radius, 0.06, 20]} />
      </mesh>
      <mesh position={[0, 0, 0.031]}>
        <circleGeometry args={[radius * 0.85, 20]} />
        <meshStandardMaterial map={face} roughness={0.4} metalness={0} />
      </mesh>
      {/* stem */}
      <mesh position={[0, -radius - 0.05, 0]} castShadow material={caseMat}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 8]} />
      </mesh>
    </group>
  );
}

/** Small instrument / sensor transmitter box. */
export function Sensor({ color = '#e8e2d2', seed = 9 }: { color?: string; seed?: number }) {
  const mat = useMemo(() => paintedMetal(color, seed), [color, seed]);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: seed + 1 }), [seed]);
  return (
    <group>
      <mesh castShadow material={mat}>
        <boxGeometry args={[0.18, 0.24, 0.14]} />
      </mesh>
      <mesh position={[0, -0.2, 0]} castShadow material={steelMat}>
        <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
      </mesh>
    </group>
  );
}
