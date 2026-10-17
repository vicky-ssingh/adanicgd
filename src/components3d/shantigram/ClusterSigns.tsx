import { useMemo } from 'react';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { concrete, paintedMetal } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Named residential-cluster entrance signboard (spec §3.5): a low masonry wall
 * with the cluster name + Adani logo, placed at the entrance of a residential
 * block. Cosmetic only.
 */
export function ClusterSign({
  name,
  position,
  rotation = 0,
  color = BRAND.primary,
}: {
  name: string;
  position: [number, number, number];
  rotation?: number;
  color?: string;
}) {
  const wallMat = useMemo(() => concrete('#efe8d8', 250), []);
  const bandMat = useMemo(() => paintedMetal(color, 251), [color]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* low wall */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[6, 1.5, 0.5]} />
      </mesh>
      {/* colour band */}
      <mesh position={[0, 1.15, 0.28]} material={bandMat}>
        <boxGeometry args={[6, 0.7, 0.06]} />
      </mesh>
      {/* end pillars */}
      {[-3.1, 3.1].map((px, i) => (
        <mesh key={i} position={[px, 0.95, 0]} castShadow material={wallMat}>
          <boxGeometry args={[0.7, 1.9, 0.7]} />
        </mesh>
      ))}
      {/* name + logo (both faces) */}
      {([1, -1] as const).map((s) => (
        <group key={s} position={[0, 0, s * 0.3]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <SignPlane text={name} width={4.6} position={[0.5, 1.15, 0]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 5 }} />
          <LogoDecal position={[-2.2, 1.15, 0]} width={1.2} backing={false} />
        </group>
      ))}
    </group>
  );
}

/** Places the three named cluster signs at residential-block entrances. */
export function ClusterSigns() {
  return (
    <group>
      <ClusterSign name="ELYSIUM" position={[-45, 0, -71]} rotation={0} color={BRAND.primary} />
      <ClusterSign name="LA MARINA" position={[-45, 0, 26]} rotation={0} color={BRAND.accent} />
      <ClusterSign name="PAARIJAT" position={[-64, 0, 71]} rotation={Math.PI / 2} color={BRAND.tealCng} />
    </group>
  );
}
