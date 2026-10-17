import { useMemo } from 'react';
import * as THREE from 'three';
import { SignPlane } from '@/components3d/branding/Branding';
import { concrete, paintedMetal, steel } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Community amenities (spec §3.6): a temple, a box-cricket cage, EV bus-stop
 * shelters, MYBYK cycle stands and park benches. Small recognisable objects that
 * reinforce the Shantigram township character. Cosmetic only.
 */

/** A small Derasar / temple with a stepped shikhara. */
function Temple({ position }: { position: [number, number, number] }) {
  const stone = useMemo(() => concrete('#efe3cf', 260), []);
  const gold = useMemo(() => paintedMetal('#d8a93a', 261), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow material={stone}>
        <boxGeometry args={[5, 0.4, 5]} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow material={stone}>
        <boxGeometry args={[3.6, 2, 3.6]} />
      </mesh>
      {/* stepped shikhara */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 2.6 + i * 0.7, 0]} castShadow material={stone}>
          <boxGeometry args={[2.6 - i * 0.55, 0.7, 2.6 - i * 0.55]} />
        </mesh>
      ))}
      <mesh position={[0, 5.7, 0]} castShadow material={gold}>
        <sphereGeometry args={[0.35, 16, 12]} />
      </mesh>
      <mesh position={[0, 6.1, 0]} material={gold}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
      </mesh>
      {/* entrance */}
      <mesh position={[0, 0.9, 1.81]} material={paintedMetal('#8a5a2a', 262)}>
        <boxGeometry args={[1.0, 1.6, 0.1]} />
      </mesh>
    </group>
  );
}

/** Netted box-cricket enclosure on a green. */
function BoxCricket({ position }: { position: [number, number, number] }) {
  const green = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4f7d3f', roughness: 0.95 }), []);
  const post = useMemo(() => steel({ color: '#5b6068', seed: 263 }), []);
  const net = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c9d2c4', transparent: true, opacity: 0.18, side: THREE.DoubleSide, roughness: 0.9 }),
    [],
  );
  const W = 12;
  const D = 8;
  const H = 4;
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={green}>
        <planeGeometry args={[W, D]} />
      </mesh>
      {/* corner posts */}
      {[
        [-W / 2, -D / 2],
        [W / 2, -D / 2],
        [-W / 2, D / 2],
        [W / 2, D / 2],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], H / 2, p[1]]} castShadow material={post}>
          <cylinderGeometry args={[0.08, 0.08, H, 6]} />
        </mesh>
      ))}
      {/* net planes on 4 sides */}
      {[
        { pos: [0, H / 2, -D / 2], size: [W, H] as [number, number], rot: 0 },
        { pos: [0, H / 2, D / 2], size: [W, H] as [number, number], rot: 0 },
        { pos: [-W / 2, H / 2, 0], size: [D, H] as [number, number], rot: Math.PI / 2 },
        { pos: [W / 2, H / 2, 0], size: [D, H] as [number, number], rot: Math.PI / 2 },
      ].map((n, i) => (
        <mesh key={i} position={n.pos as [number, number, number]} rotation={[0, n.rot, 0]} material={net}>
          <planeGeometry args={n.size} />
        </mesh>
      ))}
    </group>
  );
}

/** EV bus-stop shelter with branded sign. */
function BusStop({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const frame = useMemo(() => steel({ color: '#8a9199', seed: 264 }), []);
  const roof = useMemo(() => paintedMetal(BRAND.primary, 265), []);
  const bench = useMemo(() => paintedMetal('#3a4048', 266), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-1.8, 1.8].map((x, i) => (
        <mesh key={i} position={[x, 1.2, -0.6]} castShadow material={frame}>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 2.45, -0.2]} castShadow material={roof}>
        <boxGeometry args={[4.2, 0.14, 1.6]} />
      </mesh>
      <mesh position={[0, 0.5, -1.0]} castShadow material={bench}>
        <boxGeometry args={[3.4, 0.12, 0.5]} />
      </mesh>
      {/* back panel + sign */}
      <mesh position={[0, 1.4, -1.28]} material={frame}>
        <boxGeometry args={[4.0, 1.6, 0.05]} />
      </mesh>
      <SignPlane text="SHANTIGRAM EV BUS" width={3.6} position={[0, 1.6, -1.24]} doubleSide options={{ fg: '#ffffff', bg: BRAND.tealCng, fontWeight: 800, radius: 8, paddingX: 30, letterSpacing: 2 }} />
    </group>
  );
}

/** MYBYK yellow cycle stand. */
function CycleStand({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const rack = useMemo(() => paintedMetal('#e6b422', 267), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.05, 0]} receiveShadow material={concrete('#c9c6bd', 268)}>
        <boxGeometry args={[3.4, 0.1, 1.2]} />
      </mesh>
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={rack}>
          <torusGeometry args={[0.35, 0.04, 6, 16, Math.PI]} />
        </mesh>
      ))}
      <SignPlane text="MYBYK" width={1.4} position={[0, 0.9, -0.55]} doubleSide options={{ fg: '#2a2a2a', bg: '#e6b422', fontWeight: 800, radius: 6, paddingX: 24 }} />
    </group>
  );
}

/** Simple park bench. */
function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const wood = useMemo(() => paintedMetal('#8a5a2a', 269), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow material={wood}>
        <boxGeometry args={[1.6, 0.1, 0.5]} />
      </mesh>
      <mesh position={[0, 0.75, -0.22]} rotation={[0.3, 0, 0]} castShadow material={wood}>
        <boxGeometry args={[1.6, 0.4, 0.08]} />
      </mesh>
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 0]} material={wood}>
          <boxGeometry args={[0.1, 0.44, 0.5]} />
        </mesh>
      ))}
    </group>
  );
}

export function Amenities() {
  return (
    <group>
      <Temple position={[-52, 0, -6]} />
      <BoxCricket position={[-34, 0, 10]} />
      <BusStop position={[-18, 0, -63]} rotation={0} />
      <BusStop position={[22, 0, 30]} rotation={Math.PI} />
      <CycleStand position={[-13, 0, -63]} rotation={0} />
      <CycleStand position={[15, 0, 62]} rotation={0} />
      <Bench position={[-50, 0, 4]} rotation={0} />
      <Bench position={[-40, 0, -4]} rotation={Math.PI / 2} />
      <Bench position={[-44, 0, 6]} rotation={0.6} />
    </group>
  );
}
