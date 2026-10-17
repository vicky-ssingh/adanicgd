import * as THREE from 'three';
import { paintedMetal, glass, concrete } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';

/**
 * Section 08 Part C — fire-protection equipment. Extinguisher cabinets, a free-
 * standing extinguisher, a hose-reel cabinet, a hydrant, a sand-bucket stand
 * (4 conical buckets — characteristic of Indian fuel stations), a break-glass
 * call point, an assembly-point sign, and (Mother Station) a fire-water tank +
 * pump house. Static props; strobes live in EsdKit.
 */
const red = new THREE.MeshStandardMaterial({ color: '#c01a1a', roughness: 0.5, metalness: 0.2 });
const redDark = new THREE.MeshStandardMaterial({ color: '#9a1414', roughness: 0.5, metalness: 0.2 });
const st = new THREE.MeshStandardMaterial({ color: '#9aa1a8', roughness: 0.5, metalness: 0.7 });
const black = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.7, metalness: 0.3 });
const green = new THREE.MeshStandardMaterial({ color: '#1f7a44', roughness: 0.5, metalness: 0.2 });

function ExtinguisherCabinet({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 0.75, 0]} castShadow material={red}><boxGeometry args={[0.35, 0.6, 0.25]} /></mesh>
      <mesh position={[0, 0.75, 0.13]} material={glass('#cfe0ea', 0.4)}><boxGeometry args={[0.28, 0.5, 0.02]} /></mesh>
      <mesh position={[0, 0.75, 0]} material={redDark}><cylinderGeometry args={[0.06, 0.06, 0.4, 12]} /></mesh>
      <SignPlane text="FIRE" width={0.28} position={[0, 1.02, 0.13]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 800 }} />
    </group>
  );
}

function FreeExtinguisher({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 0.05, 0]} material={black}><boxGeometry args={[0.3, 0.05, 0.3]} /></mesh>
      <mesh position={[0, 0.35, 0]} castShadow material={red}><cylinderGeometry args={[0.075, 0.075, 0.55, 16]} /></mesh>
      <mesh position={[0, 0.66, 0]} material={black}><cylinderGeometry args={[0.04, 0.04, 0.1, 10]} /></mesh>
      <mesh position={[0.06, 0.7, 0]} material={st}><boxGeometry args={[0.1, 0.02, 0.04]} /></mesh>
    </group>
  );
}

function HoseReel({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 0.85, 0]} castShadow material={red}><boxGeometry args={[0.7, 0.7, 0.25]} /></mesh>
      <mesh position={[0, 0.85, 0.14]} rotation={[Math.PI / 2, 0, 0]} material={redDark}><torusGeometry args={[0.22, 0.06, 8, 20]} /></mesh>
      <SignPlane text="FIRE HOSE REEL" width={0.6} position={[0, 1.15, 0.13]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 800 }} />
    </group>
  );
}

function Hydrant({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 0.05, 0]} material={concrete('#b9b5ac', 1140)}><cylinderGeometry args={[0.3, 0.3, 0.1, 12]} /></mesh>
      <mesh position={[0, 0.55, 0]} castShadow material={red}><cylinderGeometry args={[0.1, 0.1, 0.9, 12]} /></mesh>
      <mesh position={[0, 1.05, 0]} material={red}><cylinderGeometry args={[0.06, 0.08, 0.12, 12]} /></mesh>
      {([-1, 1] as const).map((s, i) => (
        <mesh key={i} position={[s * 0.12, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} material={st}><cylinderGeometry args={[0.04, 0.04, 0.1, 10]} /></mesh>
      ))}
    </group>
  );
}

function SandBuckets({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      {([-0.5, 0.5] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]} material={st}><boxGeometry args={[0.06, 1.0, 0.06]} /></mesh>
      ))}
      <mesh position={[0, 1.0, 0]} material={st}><boxGeometry args={[1.2, 0.06, 0.06]} /></mesh>
      {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.72, 0]} rotation={[Math.PI, 0, 0]} material={red}><coneGeometry args={[0.11, 0.24, 12]} /></mesh>
      ))}
      <SignPlane text="FIRE BUCKETS" width={0.9} position={[0, 1.12, 0]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 700 }} />
    </group>
  );
}

function CallPoint({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 0.7, 0]} material={st}><cylinderGeometry args={[0.03, 0.03, 1.4, 6]} /></mesh>
      <mesh position={[0, 1.35, 0.03]} material={red}><boxGeometry args={[0.12, 0.15, 0.05]} /></mesh>
      <mesh position={[0, 1.35, 0.06]} material={glass('#cfe0ea', 0.4)}><boxGeometry args={[0.08, 0.1, 0.01]} /></mesh>
      <SignPlane text="FIRE · BREAK GLASS" width={0.4} position={[0, 1.15, 0.05]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 700 }} />
    </group>
  );
}

function AssemblyPoint({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 1.0, 0]} material={st}><cylinderGeometry args={[0.04, 0.04, 2.0, 8]} /></mesh>
      <mesh position={[0, 2.1, 0]} material={green}><boxGeometry args={[0.7, 0.7, 0.05]} /></mesh>
      <SignPlane text="ASSEMBLY POINT" width={0.66} position={[0, 2.1, 0.03]} options={{ fg: '#ffffff', bg: '#1f7a44', fontWeight: 800 }} doubleSide />
    </group>
  );
}

export function FireWaterSystem({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.15, 0]} material={concrete('#b9b5ac', 1141)}><cylinderGeometry args={[1.7, 1.7, 0.3, 20]} /></mesh>
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow material={paintedMetal('#c0392b', 1142)}><cylinderGeometry args={[1.5, 1.5, 3.5, 24]} /></mesh>
      <mesh position={[0, 3.85, 0]} material={paintedMetal('#a5311f', 1143)}><cylinderGeometry args={[1.5, 1.1, 0.4, 24]} /></mesh>
      {/* ladder */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[1.5, 0.6 + i * 0.4, 0]} material={st}><boxGeometry args={[0.06, 0.04, 0.4]} /></mesh>
      ))}
      <SignPlane text="FIRE WATER — 50,000 L" width={2.4} position={[0, 2.2, 1.52]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 1 }} />
      {/* pump house */}
      <group position={[4.5, 0, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow material={paintedMetal('#e7e3d8', 1144)}><boxGeometry args={[4, 2.8, 3]} /></mesh>
        <mesh position={[0, 3.0, 0]} material={paintedMetal('#0b74b0', 1145)}><boxGeometry args={[4.2, 0.2, 3.2]} /></mesh>
        <SignPlane text="FIRE PUMP HOUSE" width={3} position={[0, 2.4, 1.52]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 800, radius: 4, paddingX: 12 }} />
      </group>
    </group>
  );
}

/** A standard fire kit placed at a facility anchor. */
export function FireKit({ anchor, big = false }: { anchor: [number, number]; big?: boolean }) {
  const [x, z] = anchor;
  return (
    <group>
      <ExtinguisherCabinet p={[x, z]} />
      <FreeExtinguisher p={[x + 0.7, z]} />
      <SandBuckets p={[x + 1.8, z]} />
      <CallPoint p={[x - 0.8, z]} />
      {big && <HoseReel p={[x + 3, z]} />}
    </group>
  );
}

export { Hydrant, AssemblyPoint };
