import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { glass, concrete } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';
import { closeAllPanels } from '@/state/panels';
import { useScadaStore } from '@/state/useScadaStore';
import type { RtuDef, CommsStatus } from '@/config/scadaLayout';

/**
 * Section 09 §2 — Remote Terminal Unit cabinet. A weatherproof beige enclosure on
 * two galvanised channel posts, with a hinged door (barrel hinges, 3-point latch,
 * padlock hasp), rain hood, sun-shield standoff panel, louvred vents, a poly
 * viewing window, a whip antenna + coax gland + lightning arrestor, a tilted solar
 * panel, a battery box, cable glands + conduit into the ground, an earthing rod,
 * signage, and an external status LED (green online / amber degraded / red lost).
 * Clickable → RTU info panel. Geometry is static; only the LED animates.
 */
const beige = new THREE.MeshStandardMaterial({ color: '#c4c0b8', roughness: 0.55, metalness: 0.35 });
const beigeDark = new THREE.MeshStandardMaterial({ color: '#a9a59c', roughness: 0.6, metalness: 0.35 });
const galv = new THREE.MeshStandardMaterial({ color: '#9aa1a8', roughness: 0.45, metalness: 0.85 });
const black = new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.6, metalness: 0.4 });
const copper = new THREE.MeshStandardMaterial({ color: '#b5732e', roughness: 0.45, metalness: 0.7 });
const cellMat = new THREE.MeshStandardMaterial({ color: '#12213b', roughness: 0.25, metalness: 0.5, emissive: new THREE.Color('#0a1830'), emissiveIntensity: 0.15 });

function ledColor(status: CommsStatus): string {
  return status === 'online' ? '#39d98a' : status === 'degraded' ? '#ffb020' : '#ff3b3b';
}

export function RtuCabinet({ rtu }: { rtu: RtuDef }) {
  const [x, z] = rtu.pos;
  const led = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color(ledColor(rtu.status)), emissiveIntensity: 1.4 }),
    [rtu.status],
  );
  // A short cluster of interior indicator LEDs behind the window.
  const winGlow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 0.8 }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (rtu.status === 'online') {
      led.emissiveIntensity = 1.4; // steady
    } else if (rtu.status === 'degraded') {
      led.emissiveIntensity = 0.5 + (Math.sin(t * 3) * 0.5 + 0.5) * 1.3; // slow breathe
    } else {
      led.emissiveIntensity = Math.floor(t * 3) % 2 ? 1.8 : 0.1; // hard flash
    }
  });

  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); useScadaStore.getState().openRtu(rtu.id); };
  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };

  const seed = (x * 7 + z) | 0;

  return (
    <group position={[x, 0, z]} rotation={[0, rtu.rotation, 0]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {/* concrete plinth */}
      <mesh position={[0, 0.06, 0]} material={concrete('#b3afa6', 1200 + seed)}><boxGeometry args={[1.1, 0.12, 0.7]} /></mesh>

      {/* two channel posts */}
      {([-0.38, 0.38] as const).map((px, i) => (
        <mesh key={i} position={[px, 0.75, -0.02]} material={galv}><boxGeometry args={[0.07, 1.5, 0.07]} /></mesh>
      ))}

      {/* main enclosure (1.0 tall × 0.7 wide × 0.32 deep) centred ~1.7 up */}
      <group position={[0, 1.72, 0]}>
        <mesh castShadow material={beige}><boxGeometry args={[0.7, 1.0, 0.32]} /></mesh>
        {/* dust on top */}
        <mesh position={[0, 0.505, 0]} material={beigeDark}><boxGeometry args={[0.72, 0.02, 0.34]} /></mesh>
        {/* rain hood */}
        <mesh position={[0, 0.55, 0.05]} rotation={[0.12, 0, 0]} material={beigeDark}><boxGeometry args={[0.82, 0.03, 0.44]} /></mesh>
        {/* door seam + door face */}
        <mesh position={[0, 0, 0.162]} material={beigeDark}><boxGeometry args={[0.6, 0.9, 0.01]} /></mesh>
        {/* barrel hinges (left) */}
        {([-0.32, 0.32] as const).map((hy, i) => (
          <mesh key={i} position={[-0.3, hy, 0.17]} material={black}><cylinderGeometry args={[0.02, 0.02, 0.1, 8]} /></mesh>
        ))}
        {/* 3-point latch handle (right) */}
        <mesh position={[0.26, 0, 0.18]} material={black}><boxGeometry args={[0.03, 0.22, 0.04]} /></mesh>
        <mesh position={[0.26, -0.13, 0.2]} material={galv}><boxGeometry args={[0.02, 0.08, 0.02]} /></mesh>
        {/* padlock hasp */}
        <mesh position={[0.18, 0.02, 0.18]} material={galv}><boxGeometry args={[0.05, 0.04, 0.02]} /></mesh>
        {/* viewing window with interior LEDs */}
        <mesh position={[-0.05, 0.28, 0.166]} material={glass('#0e1a12', 0.35)}><boxGeometry args={[0.16, 0.12, 0.01]} /></mesh>
        <mesh position={[-0.09, 0.28, 0.168]} material={winGlow}><boxGeometry args={[0.01, 0.02, 0.005]} /></mesh>
        <mesh position={[-0.05, 0.28, 0.168]} material={winGlow}><boxGeometry args={[0.01, 0.02, 0.005]} /></mesh>
        {/* louvred vents: bottom + filtered top */}
        {[-0.34, -0.3, -0.26].map((ly, i) => (
          <mesh key={i} position={[0, ly, 0.163]} material={beigeDark}><boxGeometry args={[0.4, 0.015, 0.008]} /></mesh>
        ))}
        <mesh position={[0.18, 0.4, 0.163]} material={beigeDark}><boxGeometry args={[0.14, 0.08, 0.01]} /></mesh>
        {/* external status LED */}
        <mesh position={[0.26, 0.38, 0.17]} material={led}><cylinderGeometry args={[0.02, 0.02, 0.015, 10]} /></mesh>
        {/* data plate + hazard label */}
        <mesh position={[-0.22, -0.42, 0.166]} material={galv}><boxGeometry args={[0.14, 0.06, 0.005]} /></mesh>
        <SignPlane text={rtu.id} width={0.5} position={[0, 0.16, 0.172]} options={{ fg: '#0b2545', bg: '#e9e6df', fontWeight: 800, radius: 3 }} />
        <SignPlane text="ADANI TOTAL GAS" width={0.5} position={[0, 0.04, 0.172]} options={{ fg: '#0B74B0', bg: '#e9e6df', fontWeight: 700, radius: 3 }} />

        {/* sun-shield standoff panel on the sun-facing (+X) side with an air gap */}
        <mesh position={[0.4, 0.05, 0]} material={beigeDark}><boxGeometry args={[0.03, 0.9, 0.3]} /></mesh>

        {/* cable glands on the underside + conduit into the ground */}
        {[-0.2, -0.1, 0, 0.1, 0.2].map((gx, i) => (
          <mesh key={i} position={[gx, -0.52, 0]} material={galv}><cylinderGeometry args={[0.018, 0.018, 0.06, 8]} /></mesh>
        ))}
      </group>

      {/* conduit running from cabinet down a post into the ground */}
      <mesh position={[0.3, 1.0, -0.04]} material={galv}><cylinderGeometry args={[0.03, 0.03, 1.5, 8]} /></mesh>
      <mesh position={[0.3, 0.12, 0.25]} rotation={[Math.PI / 2, 0, 0]} material={galv}><cylinderGeometry args={[0.03, 0.03, 0.6, 8]} /></mesh>

      {/* antenna (whip) + coax gland + lightning arrestor on the cabinet top */}
      <mesh position={[-0.2, 2.55, 0]} material={galv}><cylinderGeometry args={[0.012, 0.012, 0.6, 6]} /></mesh>
      <mesh position={[-0.2, 2.86, 0]} material={black}><sphereGeometry args={[0.02, 8, 8]} /></mesh>
      <mesh position={[-0.2, 2.25, 0.02]} material={black}><cylinderGeometry args={[0.02, 0.02, 0.06, 8]} /></mesh>
      <mesh position={[0.05, 2.45, 0]} material={copper}><cylinderGeometry args={[0.008, 0.008, 0.4, 6]} /></mesh>

      {/* solar panel on an adjustable tilt bracket (~25°, facing south/−Z) */}
      <group position={[0, 2.35, -0.35]}>
        <mesh position={[0, -0.18, 0]} material={galv}><cylinderGeometry args={[0.02, 0.02, 0.35, 6]} /></mesh>
        <mesh position={[0.1, -0.05, -0.05]} rotation={[0, 0, -0.6]} material={galv}><cylinderGeometry args={[0.012, 0.012, 0.3, 6]} /></mesh>
        <group rotation={[-Math.PI / 2 + 0.44, 0, 0]}>
          <mesh material={galv}><boxGeometry args={[0.82, 0.52, 0.02]} /></mesh>
          <mesh position={[0, 0, 0.012]} material={cellMat}><boxGeometry args={[0.76, 0.46, 0.008]} /></mesh>
          {/* cell grid */}
          {[-0.24, 0, 0.24].map((cx, i) => (
            <mesh key={i} position={[cx, 0, 0.017]} material={galv}><boxGeometry args={[0.006, 0.46, 0.002]} /></mesh>
          ))}
        </group>
      </group>

      {/* battery box below the cabinet */}
      <mesh position={[0, 0.9, -0.02]} material={beigeDark}><boxGeometry args={[0.5, 0.4, 0.3]} /></mesh>
      <SignPlane text="BATTERY" width={0.3} position={[0, 0.9, 0.14]} options={{ fg: '#333', bg: '#c9c5bc', fontWeight: 700 }} />

      {/* earthing conductor to a ground rod with a bolted connection */}
      <mesh position={[-0.5, 0.5, 0.1]} rotation={[0, 0, 0.15]} material={copper}><cylinderGeometry args={[0.01, 0.01, 1.0, 6]} /></mesh>
      <mesh position={[-0.54, 0.02, 0.12]} material={copper}><boxGeometry args={[0.05, 0.05, 0.05]} /></mesh>
    </group>
  );
}
