import * as THREE from 'three';
import { create } from 'zustand';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { closeAllPanels } from '@/state/panels';

/**
 * Section 17 §C.2 — a small Adani Total Gas maintenance van parked beside the
 * under-inspection DRS-01. Placed on hard standing off the carriageway (respects
 * the §16 exclusion mask). Clickable → a simple maintenance info panel. Plus a
 * toolbox on the ground beside the open kiosk.
 */
interface VanState { open: boolean; setOpen: (v: boolean) => void }
export const useVanStore = create<VanState>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

const white = new THREE.MeshStandardMaterial({ color: '#eef1f4', roughness: 0.5, metalness: 0.3 });
const blue = new THREE.MeshStandardMaterial({ color: '#0B74B0', roughness: 0.5, metalness: 0.3 });
const glass = new THREE.MeshStandardMaterial({ color: '#20303a', roughness: 0.1, metalness: 0.4 });
const tyre = new THREE.MeshStandardMaterial({ color: '#14171b', roughness: 0.9 });
const rim = new THREE.MeshStandardMaterial({ color: '#8f969d', roughness: 0.4, metalness: 0.85 });
const black = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.6, metalness: 0.3 });
const wheelG = (() => { const g = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 16); g.rotateX(Math.PI / 2); return g; })();

export function MaintenanceVehicle({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); useVanStore.getState().setOpen(true); };
  const cursor = (v: string) => (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = v; };
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group onClick={onClick} onPointerOver={cursor('pointer')} onPointerOut={() => (document.body.style.cursor = 'auto')}>
        {/* cargo box body */}
        <mesh position={[-0.3, 0.85, 0]} castShadow material={white}><boxGeometry args={[2.2, 1.2, 1.5]} /></mesh>
        {/* blue lower band */}
        <mesh position={[-0.3, 0.42, 0]} material={blue}><boxGeometry args={[2.22, 0.36, 1.52]} /></mesh>
        {/* cab */}
        <mesh position={[1.1, 0.7, 0]} castShadow material={white}><boxGeometry args={[0.7, 0.9, 1.46]} /></mesh>
        <mesh position={[1.46, 0.75, 0]} rotation={[0, 0, -0.35]} material={glass}><boxGeometry args={[0.04, 0.5, 1.3]} /></mesh>
        <mesh position={[0.75, 0.9, 0.74]} material={glass}><boxGeometry args={[0.5, 0.4, 0.02]} /></mesh>
        {/* bumper + lights */}
        <mesh position={[1.5, 0.35, 0]} material={black}><boxGeometry args={[0.1, 0.2, 1.5]} /></mesh>
        {/* wheels */}
        {[[0.9, 0.62], [0.9, -0.62], [-0.9, 0.62], [-0.9, -0.62]].map((w, i) => (
          <group key={i} position={[w[0], 0.28, w[1]]}>
            <mesh geometry={wheelG} material={tyre} /><mesh geometry={wheelG} scale={0.5} material={rim} />
          </group>
        ))}
        {/* livery */}
        <LogoDecal position={[-0.3, 0.9, 0.76]} width={1.0} backing={false} />
        <SignPlane text="ADANI TOTAL GAS" width={1.6} position={[-0.3, 0.5, 0.77]} options={{ fg: '#fff', bg: '#0B74B0', fontWeight: 800 }} />
        <SignPlane text="MAINTENANCE · MV-07" width={1.2} position={[-1.4, 0.85, 0.05]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#0b2545', bg: '#eef1f4', fontWeight: 700 }} />
      </group>
      {/* toolbox on the ground beside the kiosk */}
      <mesh position={[-1.6, 0.18, 1.1]} castShadow material={new THREE.MeshStandardMaterial({ color: '#c23b3b', roughness: 0.5 })}><boxGeometry args={[0.5, 0.3, 0.3]} /></mesh>
    </group>
  );
}
