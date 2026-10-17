import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Car } from '@/components3d/city/Vehicles';
import { PartPicker } from './PartPicker';
import { paintedMetal, steel, glass } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';

/**
 * Section 01 §3.8 — CNG vehicles at the station: two cars at the dispensers, a
 * queued auto-rickshaw (ubiquitous CNG vehicle in Gujarat), a light commercial
 * tempo and a city bus. Each carries a visible CNG filler point + a CNG sticker
 * and is clickable for its own info panel.
 */

const glassMat = () => glass('#141c26', 0.2);

/** A small recessed CNG filler + sticker on a vehicle's rear (local +? side). */
function CngFiller({ position }: { position: [number, number, number] }) {
  const capMat = useMemo(() => steel({ color: '#c2c7cc', roughness: 0.4, metalness: 0.9, seed: 360 }), []);
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={capMat}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
      </mesh>
    </group>
  );
}

function AutoRickshaw({ position = [0, 0, 0], rotation = 0 }: { position?: [number, number, number]; rotation?: number }) {
  const bodyMat = useMemo(() => paintedMetal('#e5c518', 361), []);
  const hoodMat = useMemo(() => paintedMetal('#1c1f22', 362), []);
  const tyreMat = useMemo(() => steel({ color: '#14171b', roughness: 0.85, metalness: 0.05, seed: 363 }), []);
  const wheel = (x: number, z: number) => (
    <mesh position={[x, 0.28, z]} rotation={[Math.PI / 2, 0, 0]} castShadow material={tyreMat}>
      <cylinderGeometry args={[0.28, 0.28, 0.12, 16]} />
    </mesh>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* cabin */}
      <RoundedBox args={[1.2, 1.0, 1.1]} radius={0.22} smoothness={4} position={[0, 0.9, 0]} castShadow receiveShadow material={bodyMat} />
      {/* black hood/roof */}
      <RoundedBox args={[1.1, 0.5, 1.0]} radius={0.2} smoothness={3} position={[0, 1.5, 0]} castShadow material={hoodMat} />
      {/* windshield */}
      <mesh position={[0.55, 1.0, 0]} material={glassMat()}>
        <boxGeometry args={[0.04, 0.5, 0.8]} />
      </mesh>
      {/* single front wheel + 2 rear */}
      {wheel(0.62, 0)}
      {wheel(-0.5, 0.5)}
      {wheel(-0.5, -0.5)}
      <CngFiller position={[-0.62, 0.5, 0.3]} />
      <SignPlane text="CNG" width={0.32} position={[-0.61, 0.7, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#0a7d3a', bg: '#ffffff', fontWeight: 800, radius: 4, paddingX: 12 }} />
    </group>
  );
}

function Tempo({ position = [0, 0, 0], rotation = 0 }: { position?: [number, number, number]; rotation?: number }) {
  const cabMat = useMemo(() => paintedMetal('#2f6f8f', 364), []);
  const boxMat = useMemo(() => paintedMetal('#e7e3d8', 365), []);
  const tyreMat = useMemo(() => steel({ color: '#14171b', roughness: 0.85, metalness: 0.05, seed: 366 }), []);
  const wheel = (x: number, z: number) => (
    <mesh position={[x, 0.34, z]} rotation={[Math.PI / 2, 0, 0]} castShadow material={tyreMat}>
      <cylinderGeometry args={[0.34, 0.34, 0.16, 16]} />
    </mesh>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* cab */}
      <RoundedBox args={[1.1, 1.1, 1.6]} radius={0.1} smoothness={3} position={[1.3, 0.85, 0]} castShadow receiveShadow material={cabMat} />
      <mesh position={[1.86, 1.0, 0]} material={glassMat()}>
        <boxGeometry args={[0.04, 0.5, 1.2]} />
      </mesh>
      {/* cargo box */}
      <mesh position={[-0.4, 1.05, 0]} castShadow receiveShadow material={boxMat}>
        <boxGeometry args={[2.4, 1.5, 1.7]} />
      </mesh>
      {wheel(1.2, 0.85)}
      {wheel(1.2, -0.85)}
      {wheel(-0.8, 0.85)}
      {wheel(-0.8, -0.85)}
      <CngFiller position={[0.6, 0.5, 0.85]} />
      <SignPlane text="CNG" width={0.4} position={[-1.61, 1.0, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#0a7d3a', bg: '#ffffff', fontWeight: 800, radius: 4, paddingX: 12 }} />
    </group>
  );
}

function Bus({ position = [0, 0, 0], rotation = 0 }: { position?: [number, number, number]; rotation?: number }) {
  const bodyMat = useMemo(() => paintedMetal('#1f6f4a', 367), []);
  const bandMat = useMemo(() => paintedMetal('#e6b422', 368), []);
  const tyreMat = useMemo(() => steel({ color: '#14171b', roughness: 0.85, metalness: 0.05, seed: 369 }), []);
  const winMat = useMemo(() => glass('#141c26', 0.2), []);
  const wheel = (x: number, z: number) => (
    <mesh position={[x, 0.42, z]} rotation={[Math.PI / 2, 0, 0]} castShadow material={tyreMat}>
      <cylinderGeometry args={[0.42, 0.42, 0.2, 18]} />
    </mesh>
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[8, 2.4, 2.4]} radius={0.2} smoothness={4} position={[0, 1.6, 0]} castShadow receiveShadow material={bodyMat} />
      {/* window band both sides */}
      {[1.21, -1.21].map((z, i) => (
        <mesh key={i} position={[0, 2.0, z]} material={winMat}>
          <boxGeometry args={[7.2, 0.7, 0.04]} />
        </mesh>
      ))}
      <mesh position={[0, 1.1, 1.21]} material={bandMat}>
        <boxGeometry args={[8, 0.2, 0.04]} />
      </mesh>
      {wheel(2.6, 1.1)}
      {wheel(2.6, -1.1)}
      {wheel(-2.6, 1.1)}
      {wheel(-2.6, -1.1)}
      <mesh position={[4.01, 1.7, 0]} material={winMat}>
        <boxGeometry args={[0.04, 1.0, 2.0]} />
      </mesh>
      <CngFiller position={[-3.6, 0.7, 1.2]} />
      <SignPlane text="CNG" width={0.6} position={[-4.01, 1.2, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#0a7d3a', bg: '#ffffff', fontWeight: 800, radius: 4, paddingX: 14 }} />
    </group>
  );
}

export function StationVehicles() {
  return (
    <group>
      {/* two cars at the dispensers (car A is the active refuel vehicle) */}
      <PartPicker part="vehicle-car">
        <group position={[-10.5, 0, -3.4]} rotation={[0, Math.PI / 2, 0]}>
          <Car type="sedan" color="#c9ccd1" />
          <CngFiller position={[0, 0.6, 2.0]} />
          <SignPlane text="CNG" width={0.34} position={[0, 0.55, -2.05]} rotation={[0, Math.PI, 0]} options={{ fg: '#0a7d3a', bg: '#ffffff', fontWeight: 800, radius: 4, paddingX: 12 }} />
        </group>
      </PartPicker>
      <PartPicker part="vehicle-car">
        <group position={[-10.5, 0, 3.4]} rotation={[0, Math.PI / 2, 0]}>
          <Car type="suv" color="#26506e" />
        </group>
      </PartPicker>

      {/* queued auto-rickshaw near the entrance */}
      <PartPicker part="vehicle-auto">
        <AutoRickshaw position={[-14, 0, 8]} rotation={-Math.PI / 2} />
      </PartPicker>

      {/* light commercial tempo */}
      <PartPicker part="vehicle-tempo">
        <Tempo position={[-6.5, 0, 9.5]} rotation={Math.PI} />
      </PartPicker>

      {/* city bus at a side bay */}
      <PartPicker part="vehicle-bus">
        <Bus position={[10, 0, -10]} rotation={0} />
      </PartPicker>
    </group>
  );
}
