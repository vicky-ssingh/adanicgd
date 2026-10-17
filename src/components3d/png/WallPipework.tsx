import { useMemo } from 'react';
import * as THREE from 'three';
import { type ThreeEvent } from '@react-three/fiber';
import { SignPlane } from '@/components3d/branding/Branding';
import { useMeterStore } from '@/state/useMeterStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { BUILDING_ROUTES } from '@/config/routes';
import { wallPipeLocal } from '@/config/wallPipework';
import { BRAND } from '@/theme/tokens';
import type { BuildingCategory } from '@/components3d/city/Building';

/**
 * Realistic Adani-Shantigram PNG external wall pipework (reference-photo based).
 * A bright-yellow vertical service riser with black wall clamps, per-floor branch
 * elbows, a white PNG meter box (clickable → service panel + route highlight), a
 * blue isolation valve, and a charcoal planter with tropical plants at the base.
 * Mounted on the building's +X side wall (not the street facade), in the
 * building's local frame. Cosmetic overlay — no CGD sim/routing changed.
 */
export function WallPipework({
  width,
  depth,
  height,
  category,
}: {
  width: number;
  depth: number;
  height: number;
  category: Exclude<BuildingCategory, 'industrial' | 'institutional'>;
}) {
  const commercial = category === 'commercial';
  const setRoute = useRouteStore((s) => s.setRoute);
  const clearSelection = useSelectionStore((s) => s.clear);
  const openMeter = useMeterStore((s) => s.open);

  const flow = commercial ? 42 : 2.4;

  // Mount on +X wall, ~1.5u from the +Z (front) corner (shared placement).
  const { x: pipeX, z: zPos, R } = wallPipeLocal(width, depth, category);
  const wallX = width / 2;
  const pipeH = height - 0.1;
  const pipeCY = 0.1 + pipeH / 2;

  const mats = useMemo(() => {
    return {
      yellow: new THREE.MeshStandardMaterial({
        color: '#f5c400',
        metalness: 0.6,
        roughness: 0.3,
        emissive: new THREE.Color('#f5c400'),
        emissiveIntensity: 0.15,
      }),
      black: new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.8, roughness: 0.4 }),
      white: new THREE.MeshStandardMaterial({ color: '#f0f0f0', metalness: 0.1, roughness: 0.7 }),
      frame: new THREE.MeshStandardMaterial({ color: '#3a3f45', metalness: 0.3, roughness: 0.6 }),
      blue: new THREE.MeshStandardMaterial({ color: '#1d4ed8', metalness: 0.7, roughness: 0.3 }),
      handle: new THREE.MeshStandardMaterial({ color: '#2a2d31', metalness: 0.6, roughness: 0.5 }),
      planter: new THREE.MeshStandardMaterial({ color: '#2d2d2d', roughness: 0.8, metalness: 0.1 }),
      trunk: new THREE.MeshStandardMaterial({ color: '#6b5236', roughness: 0.9 }),
      leafDark: new THREE.MeshStandardMaterial({ color: '#1a5c2a', roughness: 0.85, flatShading: true }),
      hedge: new THREE.MeshStandardMaterial({ color: '#2d8c2d', roughness: 0.9, flatShading: true }),
      accent: new THREE.MeshStandardMaterial({ color: BRAND.primary, roughness: 0.5, metalness: 0.2 }),
    };
  }, []);

  const clampYs = useMemo(() => {
    const arr: number[] = [];
    for (let y = 0.6; y < height - 0.3; y += 1.2) arr.push(y);
    return arr;
  }, [height]);

  const floorYs = useMemo(() => {
    const arr: number[] = [];
    const step = 3.1;
    for (let y = step; y < height - 0.5; y += step) arr.push(y);
    return arr.slice(0, 8);
  }, [height]);

  // Meter box dimensions (commercial slightly larger).
  const mw = commercial ? 0.34 : 0.25;
  const mh = commercial ? 0.26 : 0.18;
  const md = commercial ? 0.16 : 0.12;
  const meterY = 1.6;
  const meterX = pipeX + R + md / 2;

  const onMeterClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    clearSelection();
    const def = BUILDING_ROUTES[category];
    setRoute({ edges: new Set(def.edges), chain: def.chain, title: def.title, flow: def.flow });
    openMeter({
      connectionType: commercial ? 'Commercial PNG' : 'Residential PNG',
      meterType: commercial ? 'Commercial Gas Meter' : 'Domestic Gas Meter',
      flow,
      label: commercial ? 'COMMERCIAL PNG METER' : 'PNG METER',
    });
  };
  const cursor = (v: string) => () => (document.body.style.cursor = v);

  return (
    <group>
      {/* Vertical service riser */}
      <mesh position={[pipeX, pipeCY, zPos]} castShadow material={mats.yellow}>
        <cylinderGeometry args={[R, R, pipeH, 12]} />
      </mesh>

      {/* Black wall clamps */}
      {clampYs.map((y, i) => (
        <group key={i}>
          <mesh position={[pipeX, y, zPos]} material={mats.black}>
            <boxGeometry args={[R * 2.4, 0.05, R * 2.4]} />
          </mesh>
          <mesh position={[wallX + 0.02, y, zPos]} material={mats.black}>
            <boxGeometry args={[0.03, 0.08, 0.1]} />
          </mesh>
        </group>
      ))}

      {/* Per-floor branch elbows (branch along -Z toward the wall) */}
      {floorYs.map((y, i) => (
        <group key={i}>
          <mesh position={[pipeX, y, zPos]} material={mats.yellow}>
            <sphereGeometry args={[R * 1.3, 10, 8]} />
          </mesh>
          <mesh position={[pipeX, y, zPos - 0.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.yellow}>
            <cylinderGeometry args={[R, R, 0.4, 10]} />
          </mesh>
          <mesh position={[pipeX, y, zPos - 0.4]} material={mats.yellow}>
            <sphereGeometry args={[R * 1.1, 8, 6]} />
          </mesh>
          <mesh position={[wallX + 0.02, y, zPos - 0.4]} material={mats.black}>
            <boxGeometry args={[0.03, 0.07, 0.08]} />
          </mesh>
        </group>
      ))}

      {/* Blue isolation valve above the meter */}
      <group position={[pipeX, meterY + mh / 2 + 0.22, zPos]}>
        <mesh material={mats.blue}>
          <sphereGeometry args={[0.05, 12, 10]} />
        </mesh>
        <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handle}>
          <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
        </mesh>
      </group>

      {/* PNG meter box (clickable) */}
      <group position={[meterX, meterY, zPos]} onClick={onMeterClick} onPointerOver={cursor('pointer')} onPointerOut={cursor('auto')}>
        <mesh castShadow material={mats.white}>
          <boxGeometry args={[md, mh, mw]} />
        </mesh>
        {/* dark frame */}
        <mesh position={[md / 2 + 0.002, 0, 0]} material={mats.frame}>
          <boxGeometry args={[0.01, mh * 0.98, mw * 0.98]} />
        </mesh>
        {/* recessed window */}
        <mesh position={[md / 2 + 0.006, -mh * 0.12, 0]} material={mats.frame}>
          <boxGeometry args={[0.008, mh * 0.38, mw * 0.5]} />
        </mesh>
        {/* blue accent stripe on top */}
        <mesh position={[md / 2 + 0.004, mh / 2 - 0.02, 0]} material={mats.accent}>
          <boxGeometry args={[0.008, 0.03, mw]} />
        </mesh>
        {/* labels (face +X) */}
        <SignPlane text="ADANI TOTAL GAS" width={mw * 0.9} position={[md / 2 + 0.01, mh * 0.24, 0]} rotation={[0, Math.PI / 2, 0]} options={{ fg: BRAND.primary, fontWeight: 800, letterSpacing: 1 }} />
        <SignPlane text={commercial ? 'COMMERCIAL PNG' : 'PNG METER'} width={mw * 0.7} position={[md / 2 + 0.01, mh * 0.04, 0]} rotation={[0, Math.PI / 2, 0]} options={{ fg: '#3a3f45', fontWeight: 700, letterSpacing: 1 }} />
      </group>

      {/* Ground planter + tropical plants */}
      <group position={[wallX + 0.28, 0, zPos]}>
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow material={mats.planter}>
          <boxGeometry args={[0.4, 0.3, 1.6]} />
        </mesh>
        {/* Frangipani ×2 */}
        {[-0.4, 0.45].map((oz, i) => (
          <group key={i} position={[0, 0, oz]}>
            <mesh position={[0, 0.55, 0]} castShadow material={mats.trunk}>
              <cylinderGeometry args={[0.03, 0.04, 0.7, 6]} />
            </mesh>
            <mesh position={[0, 1.0, 0]} scale={[1, 0.8, 1.1]} castShadow material={mats.leafDark}>
              <sphereGeometry args={[0.26, 10, 8]} />
            </mesh>
          </group>
        ))}
        {/* Hedge shrubs */}
        {[-0.55, -0.15, 0.2, 0.6].map((oz, i) => (
          <mesh key={i} position={[0.02, 0.36, oz]} scale={[1, 0.7, 1]} castShadow material={mats.hedge}>
            <sphereGeometry args={[0.22, 8, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
