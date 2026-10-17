import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useViewStore } from '@/state/useViewStore';
import { LogoDecal, SignPlane } from '@/components3d/branding/Branding';
import { BRAND } from '@/theme/tokens';
import { useTrailerStore } from '@/state/useTrailerStore';

/**
 * Section 03 §2 — heavy tractor unit. Not a box: chamfered/raked cab, slatted
 * grille + badge, recessed headlights, full bumper with fog cutouts, mirror arms,
 * a chrome exhaust stack, air horns, roof marker lamps, a fifth-wheel coupling
 * plate, air/fuel tanks and 10 wheels (front single + twin rear dual). Adani
 * white/blue livery. Self-drives from the fleet snapshot at `index`: it positions
 * itself (articulated) and rolls its wheels imperatively — no per-frame re-render.
 */

const bodyMat = new THREE.MeshStandardMaterial({ color: '#f2f4f6', roughness: 0.4, metalness: 0.3 });
const bandMat = new THREE.MeshStandardMaterial({ color: BRAND.primary, roughness: 0.45, metalness: 0.35 });
const chassisMat = new THREE.MeshStandardMaterial({ color: '#2f343a', roughness: 0.6, metalness: 0.7 });
const chromeMat = new THREE.MeshStandardMaterial({ color: '#c9ced3', roughness: 0.25, metalness: 0.95 });
const tyreMat = new THREE.MeshStandardMaterial({ color: '#14171b', roughness: 0.9, metalness: 0.0 });
const rimMat = new THREE.MeshStandardMaterial({ color: '#8f969d', roughness: 0.4, metalness: 0.85 });
const glassMat = new THREE.MeshStandardMaterial({ color: '#0f1620', roughness: 0.08, metalness: 0.3 });
const bumperMat = new THREE.MeshStandardMaterial({ color: '#3a4048', roughness: 0.5, metalness: 0.5 });
const darkMat = new THREE.MeshStandardMaterial({ color: '#20252b', roughness: 0.7, metalness: 0.4 });

const tyreGeom = (() => { const g = new THREE.CylinderGeometry(0.55, 0.55, 0.34, 20); g.rotateX(Math.PI / 2); return g; })();
const rimGeom = (() => { const g = new THREE.CylinderGeometry(0.28, 0.28, 0.36, 12); g.rotateX(Math.PI / 2); return g; })();

const REAR = [0.2, -0.55];
const REAR_Z = [1.0, 1.34, -1.0, -1.34];

export function TruckTractor({ index }: { index: number }) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const headMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#fff8e6', emissive: new THREE.Color('#fff2cf'), emissiveIntensity: 0.2, roughness: 0.3 }),
    [],
  );
  const markerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a2f10', emissive: new THREE.Color('#ffb020'), emissiveIntensity: 0.3, roughness: 0.4 }),
    [],
  );

  useFrame(() => {
    const snap = useTrailerStore.getState().snapshots()[index];
    if (!snap || !root.current) return;
    const t = snap.tractor;
    root.current.position.set(t.pos[0], t.pos[1], t.pos[2]);
    root.current.rotation.y = t.rot;
    for (const w of wheels.current) if (w) w.rotation.z = snap.wheelSpin;
    const on = night || snap.moving;
    headMat.emissiveIntensity = on ? 1.4 : 0.2;
    markerMat.emissiveIntensity = night ? 1.3 : snap.moving ? 0.7 : 0.25;
  });

  const addWheel = (el: THREE.Group | null, i: number) => { if (el) wheels.current[i] = el; };
  let wi = 0;
  const wheel = (x: number, z: number) => {
    const i = wi++;
    return (
      <group key={`${x}-${z}-${i}`} ref={(el) => addWheel(el, i)} position={[x, 0.55, z]}>
        <mesh castShadow geometry={tyreGeom} material={tyreMat} />
        <mesh geometry={rimGeom} material={rimMat} />
      </group>
    );
  };

  return (
    <group ref={root}>
      {/* Chassis rails + cross members */}
      {([-1.0, 1.0] as const).map((z) => (
        <mesh key={z} position={[1.7, 0.75, z * 0.5]} material={chassisMat}>
          <boxGeometry args={[6.4, 0.18, 0.1]} />
        </mesh>
      ))}
      {[-1.2, 0, 1.2, 2.6, 4.0].map((x, i) => (
        <mesh key={i} position={[x, 0.75, 0]} material={chassisMat}>
          <boxGeometry args={[0.1, 0.14, 1.0]} />
        </mesh>
      ))}
      {/* fifth-wheel plate + kingpin jaw */}
      <mesh position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow material={chromeMat}>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 24]} />
      </mesh>
      <mesh position={[-0.35, 0.98, 0]} material={darkMat}>
        <boxGeometry args={[0.4, 0.06, 0.14]} />
      </mesh>
      {/* air + fuel tanks, battery box */}
      <mesh position={[1.3, 0.5, 1.05]} rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
        <cylinderGeometry args={[0.28, 0.28, 1.6, 16]} />
      </mesh>
      {[-0.4, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.55, -1.05]} rotation={[Math.PI / 2, 0, 0]} material={chassisMat}>
          <cylinderGeometry args={[0.18, 0.18, 0.9, 14]} />
        </mesh>
      ))}
      <mesh position={[2.4, 0.55, 1.05]} material={chassisMat}>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
      </mesh>

      {/* Cab */}
      <group position={[3.1, 0, 0]}>
        <RoundedBox args={[2.3, 1.5, 2.5]} radius={0.14} smoothness={4} position={[0, 1.7, 0]} castShadow receiveShadow material={bodyMat} />
        <mesh position={[-0.1, 2.75, 0]} rotation={[0, 0, 0.12]} castShadow material={bodyMat}>
          <boxGeometry args={[2.0, 0.9, 2.5]} />
        </mesh>
        {([1.26, -1.26] as const).map((z, i) => (
          <mesh key={i} position={[0, 1.15, z]} material={bandMat}>
            <boxGeometry args={[2.3, 0.5, 0.02]} />
          </mesh>
        ))}
        {/* raked windscreen + wipers */}
        <mesh position={[1.02, 2.55, 0]} rotation={[0, 0, -0.32]} material={glassMat}>
          <boxGeometry args={[0.06, 0.95, 2.2]} />
        </mesh>
        {[-0.5, 0.5].map((z, i) => (
          <mesh key={i} position={[1.1, 2.25, z]} rotation={[0, 0, -0.32]} material={darkMat}>
            <boxGeometry args={[0.03, 0.5, 0.03]} />
          </mesh>
        ))}
        {([1, -1] as const).map((s) => (
          <group key={s}>
            <mesh position={[0.1, 2.05, s * 1.26]} material={glassMat}>
              <boxGeometry args={[1.1, 0.7, 0.02]} />
            </mesh>
            <mesh position={[-0.75, 2.0, s * 1.26]} material={glassMat}>
              <boxGeometry args={[0.35, 0.6, 0.02]} />
            </mesh>
            <mesh position={[-0.2, 1.45, s * 1.27]} material={darkMat}>
              <boxGeometry args={[0.02, 1.2, 0.02]} />
            </mesh>
            <mesh position={[0.4, 1.7, s * 1.28]} material={chromeMat}>
              <boxGeometry args={[0.18, 0.05, 0.03]} />
            </mesh>
            <mesh position={[-0.85, 1.0, s * 1.2]} material={chassisMat}>
              <boxGeometry args={[0.4, 0.06, 0.2]} />
            </mesh>
            <mesh position={[0.9, 2.3, s * 1.35]} rotation={[s * 0.3, 0, 0]} material={darkMat}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
            </mesh>
            <mesh position={[0.95, 2.05, s * 1.55]} material={darkMat}>
              <boxGeometry args={[0.08, 0.5, 0.18]} />
            </mesh>
          </group>
        ))}
        <LogoDecal position={[-0.1, 1.75, 1.27]} width={0.9} backing={false} />
        <SignPlane text="ADANI TOTAL GAS" width={1.3} position={[-0.1, 1.4, 1.27]} options={{ fg: BRAND.primary, fontWeight: 800, letterSpacing: 1 }} />
        <SignPlane text="CNG TRANSPORT" width={0.8} position={[0.55, 2.05, 1.27]} options={{ fg: '#16202b', fontWeight: 700 }} />

        {/* Front grille / badge / headlights / bumper */}
        <mesh position={[1.16, 1.55, 0]} material={darkMat}>
          <boxGeometry args={[0.05, 0.9, 1.8]} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[1.19, 1.25 + i * 0.16, 0]} material={chromeMat}>
            <boxGeometry args={[0.03, 0.05, 1.7]} />
          </mesh>
        ))}
        <LogoDecal position={[1.2, 1.95, 0]} rotation={[0, Math.PI / 2, 0]} width={0.6} backing={false} />
        {([1, -1] as const).map((s) => (
          <mesh key={s} position={[1.19, 1.05, s * 0.7]} material={headMat}>
            <boxGeometry args={[0.04, 0.24, 0.4]} />
          </mesh>
        ))}
        <mesh position={[1.28, 0.7, 0]} castShadow material={bumperMat}>
          <boxGeometry args={[0.25, 0.35, 2.4]} />
        </mesh>
        {([1, -1] as const).map((s) => (
          <mesh key={s} position={[1.36, 0.65, s * 0.85]} material={darkMat}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
          </mesh>
        ))}

        {/* Roof: sun visor, air horns, marker lamps */}
        <mesh position={[0.95, 3.25, 0]} rotation={[0, 0, 0.3]} material={darkMat}>
          <boxGeometry args={[0.5, 0.05, 2.2]} />
        </mesh>
        {[-0.4, 0.4].map((z, i) => (
          <mesh key={i} position={[0.2, 3.28, z]} rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 10]} />
          </mesh>
        ))}
        {[-0.9, -0.3, 0.3, 0.9].map((z, i) => (
          <mesh key={i} position={[0.9, 3.24, z]} material={markerMat}>
            <boxGeometry args={[0.08, 0.05, 0.1]} />
          </mesh>
        ))}
      </group>

      {/* Exhaust stack */}
      <mesh position={[1.9, 1.9, 1.35]} castShadow material={chromeMat}>
        <cylinderGeometry args={[0.09, 0.09, 2.6, 12]} />
      </mesh>
      <mesh position={[1.9, 3.25, 1.35]} material={darkMat}>
        <cylinderGeometry args={[0.11, 0.11, 0.1, 12]} />
      </mesh>

      {/* Wheels: front single + twin rear dual */}
      {wheel(4.4, 1.15)}
      {wheel(4.4, -1.15)}
      {REAR.map((x) => REAR_Z.map((z) => wheel(x, z)))}
      {[-1.15, 1.15].map((z, i) => (
        <mesh key={i} position={[-1.0, 0.35, z]} material={darkMat}>
          <boxGeometry args={[0.03, 0.5, 0.6]} />
        </mesh>
      ))}
    </group>
  );
}
