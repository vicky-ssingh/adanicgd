import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { steel, paintedMetal, glass, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { LogoDecal, SignPlane } from '@/components3d/branding/Branding';
import { useMotherStore, fillProgress } from '@/state/useMotherStore';

/**
 * Mobile CNG cascade trailer / daughter-station transport (spec §2.18 / §02 §7).
 * Tractor unit + trailer chassis on multiple axles, a protective frame enclosing
 * a bank of horizontal high-pressure cylinders, a rear manifold cabinet, and
 * Adani livery. Local length ≈ 13 along X (cab at -X). When `animated`, the
 * cylinders glow progressively (front → back) as the Mother Station fills it.
 */
export function CascadeTrailer(props: { position?: [number, number, number]; rotation?: number; animated?: boolean }) {
  const { position = [0, 0, 0], rotation = 0, animated = false } = props;
  const cabMat = useMemo(() => paintedMetal(BRAND.primary, 160), []);
  const chassisMat = useMemo(() => steel({ color: '#3a3f45', roughness: 0.55, metalness: 0.8, seed: 161 }), []);
  const frameMat = useMemo(() => steel({ color: '#c9a227', roughness: 0.5, metalness: 0.7, seed: 162 }), []);
  const cylMat = useMemo(() => steel({ color: '#c2c7cc', roughness: 0.36, metalness: 0.92, seed: 163 }), []);
  const tyreMat = useMemo(() => steel({ color: '#15181c', roughness: 0.85, metalness: 0.1, seed: 164 }), []);
  const liveryMat = useMemo(() => emissive(BRAND.tealCng, 0.3), []);

  // Per-cylinder emissive materials for the progressive-fill animation.
  const PER_ROW = 6;
  const glowMats = useMemo(
    () =>
      animated
        ? Array.from({ length: 18 }, () => new THREE.MeshStandardMaterial({ color: '#c2c7cc', emissive: new THREE.Color('#14b8a6'), emissiveIntensity: 0, roughness: 0.36, metalness: 0.9 }))
        : null,
    [animated],
  );
  useFrame(() => {
    if (!glowMats) return;
    const { elapsed, stage } = useMotherStore.getState();
    const p = fillProgress(elapsed, stage) * PER_ROW; // columns filled front→back
    glowMats.forEach((m, i) => {
      const col = i % PER_ROW; // 0 = front
      const lit = Math.max(0, Math.min(1, p - col));
      m.emissiveIntensity = lit * 1.3;
    });
  });

  const wheel = (x: number, z: number) => (
    <mesh position={[x, 0.55, z]} rotation={[Math.PI / 2, 0, 0]} castShadow material={tyreMat}>
      <cylinderGeometry args={[0.55, 0.55, 0.34, 16]} />
    </mesh>
  );

  const cylinders = useMemo(() => {
    const arr: [number, number, number][] = [];
    const rows = 3;
    const perRow = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < perRow; c++) {
        arr.push([-2.4 + c * 0.95, 1.5 + r * 0.62, 0]);
      }
    }
    return arr;
  }, []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* ---- Tractor unit ---- */}
      <group position={[-5.4, 0, 0]}>
        {/* chassis */}
        <mesh position={[0, 0.8, 0]} castShadow material={chassisMat}>
          <boxGeometry args={[3, 0.4, 2.2]} />
        </mesh>
        {/* cab */}
        <RoundedBox args={[1.6, 1.8, 2.2]} radius={0.15} smoothness={3} position={[-0.7, 1.9, 0]} castShadow material={cabMat} />
        <mesh position={[-1.45, 2.1, 0]} material={glass('#1b2530', 0.1)}>
          <boxGeometry args={[0.1, 0.9, 1.9]} />
        </mesh>
        {/* grille */}
        <mesh position={[-1.5, 1.2, 0]} material={chassisMat}>
          <boxGeometry args={[0.12, 0.7, 1.9]} />
        </mesh>
        {wheel(-1.0, -1.1)}
        {wheel(-1.0, 1.1)}
        {wheel(0.9, -1.1)}
        {wheel(0.9, 1.1)}
      </group>

      {/* ---- Trailer ---- */}
      <group position={[1.5, 0, 0]}>
        {/* deck */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow material={chassisMat}>
          <boxGeometry args={[8.4, 0.35, 2.4]} />
        </mesh>
        {/* protective frame uprights + top rails */}
        {[-3.9, 3.9].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 2.0, -1.1]} castShadow material={frameMat}>
              <boxGeometry args={[0.12, 2, 0.12]} />
            </mesh>
            <mesh position={[x, 2.0, 1.1]} castShadow material={frameMat}>
              <boxGeometry args={[0.12, 2, 0.12]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 3.0, -1.1]} castShadow material={frameMat}>
          <boxGeometry args={[8, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0, 3.0, 1.1]} castShadow material={frameMat}>
          <boxGeometry args={[8, 0.1, 0.1]} />
        </mesh>

        {/* cylinder bank (horizontal along X) */}
        {cylinders.map((c, i) => (
          <group key={i} position={[c[0], c[1], c[2]]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={glowMats ? glowMats[i] : cylMat}>
              <cylinderGeometry args={[0.28, 0.28, 1.8, 18]} />
            </mesh>
          </group>
        ))}

        {/* livery panel on trailer side */}
        <mesh position={[0, 1.9, 1.22]} material={liveryMat}>
          <boxGeometry args={[6, 0.9, 0.03]} />
        </mesh>
        {/* Adani livery — logo + wordmark on both sides (spec §2) */}
        {([1, -1] as const).map((s) => (
          <group key={s} position={[0, 1.9, s * 1.24]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
            <LogoDecal position={[-1.9, 0.05, 0]} width={1.9} backing={false} />
            <SignPlane text="TOTAL GAS" width={2.6} position={[1.4, 0.05, 0]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 2 }} />
          </group>
        ))}

        {/* rear manifold cabinet */}
        <mesh position={[4.3, 1.5, 0]} castShadow material={cabMat}>
          <boxGeometry args={[0.5, 1.4, 1.6]} />
        </mesh>
        <mesh position={[4.56, 1.7, 0]} material={emissive(BRAND.tealCng, 1.2)}>
          <boxGeometry args={[0.02, 0.1, 1.2]} />
        </mesh>

        {/* trailer bogies */}
        {wheel(-3.2, -1.25)}
        {wheel(-3.2, 1.25)}
        {wheel(-2.1, -1.25)}
        {wheel(-2.1, 1.25)}
        {wheel(3.2, -1.25)}
        {wheel(3.2, 1.25)}
        {wheel(2.1, -1.25)}
        {wheel(2.1, 1.25)}
      </group>
    </group>
  );
}
