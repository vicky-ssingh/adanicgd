import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { paintedMetal, glass, concrete, steel } from '@/materials/materials';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { useViewStore } from '@/state/useViewStore';
import { closeAllPanels } from '@/state/panels';
import { useScadaStore } from '@/state/useScadaStore';
import { CONTROL_CENTRE } from '@/config/scadaLayout';

/**
 * Section 09 §4 — SCADA Control Centre. A modern single-storey building
 * (12 × 8 × 4) with a glass frontage glowing from an interior video wall, an
 * Adani-blue accent band + branded signage, a rooftop comms mast (3 sector
 * antennas + dish), AC condensers, a lightning rod, an entrance canopy + security
 * barrier + flagpole, a boundary wall + gate + security cabin, and a generator +
 * transformer yard. Clickable → control-centre info panel. Interior glow lifts
 * gently at night.
 */
const wall = new THREE.MeshStandardMaterial({ color: '#eef1f4', roughness: 0.6, metalness: 0.1 });
const panelGrey = new THREE.MeshStandardMaterial({ color: '#c8cdd3', roughness: 0.55, metalness: 0.2 });
const galv = new THREE.MeshStandardMaterial({ color: '#9aa1a8', roughness: 0.45, metalness: 0.85 });
const black = new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.6, metalness: 0.4 });
const blueBand = new THREE.MeshStandardMaterial({ color: '#0B74B0', roughness: 0.5, metalness: 0.3 });

export function ControlCentre() {
  const [x, z] = CONTROL_CENTRE.pos;
  // Emissive interior "video wall" seen through the glass.
  const videoWall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a1420', emissive: new THREE.Color('#2a6ca8'), emissiveIntensity: 0.7, roughness: 0.4 }), []);
  const frontGlass = useMemo(() => glass('#8fb8d6', 0.28), []);

  useFrame((state) => {
    const night = useViewStore.getState().timeOfDay === 'night';
    // gentle flicker suggesting live screens; brighter at night
    const base = night ? 1.4 : 0.7;
    videoWall.emissiveIntensity = base + Math.sin(state.clock.elapsedTime * 2.3) * 0.12;
  });

  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); useScadaStore.getState().openCentre(); };
  const onOver = (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };

  return (
    <group position={[x, 0, z]} rotation={[0, CONTROL_CENTRE.rotation, 0]}>
      {/* site pad */}
      <mesh position={[0, 0.04, 0]} receiveShadow material={concrete('#b9b5ac', 1300)}><boxGeometry args={[20, 0.08, 15]} /></mesh>

      {/* main building 12 × 4 × 8, clickable */}
      <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        <mesh position={[0, 2.0, 0]} castShadow receiveShadow material={wall}><boxGeometry args={[12, 4, 8]} /></mesh>
        {/* parapet */}
        <mesh position={[0, 4.1, 0]} material={panelGrey}><boxGeometry args={[12.3, 0.35, 8.3]} /></mesh>
        {/* facade panel joints */}
        {[-4, -2, 0, 2, 4].map((px, i) => (
          <mesh key={i} position={[px, 2.6, 4.01]} material={panelGrey}><boxGeometry args={[0.05, 3, 0.02]} /></mesh>
        ))}
        {/* glass frontage (−? front faces +Z in local space) with interior video wall */}
        <mesh position={[0, 1.7, 4.02]} material={frontGlass}><boxGeometry args={[9, 2.6, 0.06]} /></mesh>
        <mesh position={[0, 1.7, 3.7]} material={videoWall}><boxGeometry args={[8.4, 2.2, 0.1]} /></mesh>
        {/* Adani-blue accent band above the glazing */}
        <mesh position={[0, 3.3, 4.03]} material={blueBand}><boxGeometry args={[12.05, 0.5, 0.04]} /></mesh>
        {/* signage + logo on the facade */}
        <SignPlane text="ADANI TOTAL GAS — SCADA CONTROL CENTRE" width={9} position={[0, 3.3, 4.06]} options={{ fg: '#ffffff', bg: '#0B74B0', fontWeight: 800, letterSpacing: 1 }} />
        <LogoDecal position={[-4.6, 3.3, 4.07]} width={1.6} backing={false} emissiveAtNight />
      </group>

      {/* entrance canopy + glass doors */}
      <mesh position={[0, 2.4, 4.9]} material={blueBand}><boxGeometry args={[3.2, 0.14, 1.8]} /></mesh>
      {([-0.7, 0.7] as const).map((cx, i) => (
        <mesh key={i} position={[cx, 1.9, 4.0]} material={galv}><cylinderGeometry args={[0.07, 0.07, 3.7, 8]} /></mesh>
      ))}
      <mesh position={[0, 0.9, 4.06]} material={glass('#a9c8dc', 0.2)}><boxGeometry args={[2.2, 1.8, 0.05]} /></mesh>

      {/* security barrier + flagpole + visitor parking markings */}
      <mesh position={[3.2, 0.5, 6.4]} rotation={[0, 0, Math.PI / 2]} material={black}><cylinderGeometry args={[0.05, 0.05, 3, 8]} /></mesh>
      <mesh position={[-6, 3, 5]} material={galv}><cylinderGeometry args={[0.06, 0.06, 6, 8]} /></mesh>
      <SignPlane text="ADANI" width={1} position={[-5.6, 5.4, 5]} options={{ fg: '#fff', bg: '#0B74B0', fontWeight: 800 }} doubleSide />
      {[-3.2, -1.6].map((px, i) => (
        <mesh key={i} position={[px, 0.09, 6.4]} material={paintedMetal('#e8e4d8', 1310 + i)}><boxGeometry args={[0.1, 0.02, 2.4]} /></mesh>
      ))}

      {/* rooftop plant: comms mast (3 sector antennas + dish), AC units, arrestor */}
      <group position={[-3, 4.3, -2]}>
        <mesh position={[0, 4, 0]} material={galv}><cylinderGeometry args={[0.1, 0.14, 8, 8]} /></mesh>
        {[0, 2.1, 4.2].map((r, i) => (
          <mesh key={i} position={[0, 5.5, 0]} rotation={[0, r, 0]}>
            <group>
              <mesh position={[0.4, 0, 0]} material={panelGrey}><boxGeometry args={[0.1, 1.1, 0.35]} /></mesh>
            </group>
          </mesh>
        ))}
        {/* dish */}
        <mesh position={[0.5, 6.8, 0]} rotation={[0, 0, -0.5]} material={wall}><cylinderGeometry args={[0.6, 0.6, 0.12, 20]} /></mesh>
        <mesh position={[0.85, 6.8, 0]} material={black}><sphereGeometry args={[0.06, 8, 8]} /></mesh>
        {/* lightning arrestor rod */}
        <mesh position={[0, 8.3, 0]} material={galv}><cylinderGeometry args={[0.015, 0.015, 0.6, 6]} /></mesh>
      </group>
      {/* satellite dish on a separate mount */}
      <mesh position={[3, 4.5, -2.4]} rotation={[0.6, 0.4, 0]} material={wall}><cylinderGeometry args={[0.6, 0.6, 0.1, 20]} /></mesh>
      {/* 4 AC condensers */}
      {[[-4, -3], [-4, 0], [4, -3], [4, 0]].map((p, i) => (
        <group key={i} position={[p[0], 4.35, p[1]]}>
          <mesh material={panelGrey}><boxGeometry args={[1.1, 0.6, 1.1]} /></mesh>
          <mesh position={[0, 0.31, 0]} material={black}><cylinderGeometry args={[0.4, 0.4, 0.05, 16]} /></mesh>
        </group>
      ))}

      {/* boundary wall + gate + security cabin */}
      {([[0, -7.2, 20, 0], [0, 7.2, 20, 0], [-9.8, 0, 14.4, Math.PI / 2], [9.8, 0, 14.4, Math.PI / 2]] as const).map((w, i) => (
        <mesh key={i} position={[w[0], 0.6, w[1]]} rotation={[0, w[3], 0]} material={concrete('#c3bfb5', 1320 + i)}><boxGeometry args={[w[2], 1.2, 0.2]} /></mesh>
      ))}
      <mesh position={[7.5, 1.1, 7.0]} material={panelGrey}><boxGeometry args={[1.6, 2.2, 1.6]} /></mesh>
      <SignPlane text="SECURITY" width={1.2} position={[7.5, 2.0, 7.81]} options={{ fg: '#fff', bg: '#0b2545', fontWeight: 700 }} />

      {/* generator enclosure + small transformer yard beside the building */}
      <group position={[-7.5, 0, -4]}>
        <mesh position={[0, 0.8, 0]} material={paintedMetal('#d8c56a', 1330)}><boxGeometry args={[3, 1.6, 1.6]} /></mesh>
        <SignPlane text="DG SET — 250 kVA" width={2.4} position={[0, 0.9, 0.81]} options={{ fg: '#222', bg: '#e7d98a', fontWeight: 700 }} />
        <mesh position={[1.7, 1.2, 0]} material={galv}><cylinderGeometry args={[0.09, 0.09, 2, 10]} /></mesh>
        {/* transformer */}
        <mesh position={[-2.6, 0.7, 0]} material={panelGrey}><boxGeometry args={[1.2, 1.4, 1.2]} /></mesh>
        {[-0.3, 0, 0.3].map((bx, i) => (
          <mesh key={i} position={[-2.6 + bx, 1.5, 0]} material={steel({ color: '#6f757c', seed: 1340 + i })}><cylinderGeometry args={[0.05, 0.05, 0.3, 8]} /></mesh>
        ))}
      </group>
    </group>
  );
}
