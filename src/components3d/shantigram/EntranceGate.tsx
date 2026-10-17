import { useMemo } from 'react';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { concrete, paintedMetal, steel, glass, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { useViewStore } from '@/state/useViewStore';

/**
 * Shantigram Main Entrance Gate (spec §3.4). Gate pillars with "SHANTIGRAM"
 * lettering + Adani logo, a security booth, boom barrier and lighting — placed
 * on the SG-Highway side where the transmission pipeline enters the township.
 */
export function EntranceGate({
  position = [0, 0, 0],
  rotation = 0,
}: {
  position?: [number, number, number];
  rotation?: number;
}) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const pillarMat = useMemo(() => concrete('#eae4d6', 240), []);
  const capMat = useMemo(() => paintedMetal(BRAND.primary, 241), []);
  const beamMat = useMemo(() => paintedMetal('#f2efe7', 242), []);
  const boothMat = useMemo(() => paintedMetal('#e6dcc6', 243), []);
  const barrierMat = useMemo(() => paintedMetal('#d23b3b', 244), []);
  const lightMat = useMemo(() => emissive('#fff2d6', night ? 2.2 : 0.15), [night]);

  const span = 12;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Two gate pillars */}
      {[-span / 2, span / 2].map((px, i) => (
        <group key={i} position={[px, 0, 0]}>
          <mesh position={[0, 2.4, 0]} castShadow receiveShadow material={pillarMat}>
            <boxGeometry args={[1.6, 4.8, 1.6]} />
          </mesh>
          <mesh position={[0, 4.95, 0]} castShadow material={capMat}>
            <boxGeometry args={[2.0, 0.4, 2.0]} />
          </mesh>
          <mesh position={[0, 5.35, 0]} material={lightMat}>
            <boxGeometry args={[0.6, 0.25, 0.6]} />
          </mesh>
        </group>
      ))}

      {/* Header beam across the top with SHANTIGRAM + logo */}
      <mesh position={[0, 5.4, 0]} castShadow material={beamMat}>
        <boxGeometry args={[span + 1.2, 1.7, 0.5]} />
      </mesh>
      {([1, -1] as const).map((s) => (
        <group key={s} position={[0, 5.4, s * 0.28]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <LogoDecal position={[-4.6, 0.15, 0]} width={2.4} backing={false} />
          <SignPlane text="SHANTIGRAM" width={7.5} position={[1.4, 0.15, 0]} options={{ fg: BRAND.primary, fontWeight: 800, letterSpacing: 6 }} />
          <SignPlane text="AN ADANI REALTY TOWNSHIP" width={6} position={[1.2, -0.5, 0]} options={{ fg: '#7a8698', fontWeight: 600, letterSpacing: 3 }} />
        </group>
      ))}

      {/* Security booth */}
      <group position={[span / 2 + 3.4, 0, 2.5]}>
        <mesh position={[0, 1.3, 0]} castShadow receiveShadow material={boothMat}>
          <boxGeometry args={[2.4, 2.6, 2.4]} />
        </mesh>
        <mesh position={[0, 2.75, 0]} castShadow material={capMat}>
          <boxGeometry args={[2.8, 0.3, 2.8]} />
        </mesh>
        <mesh position={[0, 1.6, 1.21]} material={glass('#9fc4d8')}>
          <boxGeometry args={[1.6, 1.1, 0.05]} />
        </mesh>
      </group>

      {/* Boom barrier */}
      <group position={[span / 2 + 1.5, 0, 1]}>
        <mesh position={[0, 0.5, 0]} castShadow material={steel({ color: '#c9a227', seed: 245 })}>
          <boxGeometry args={[0.3, 1.0, 0.3]} />
        </mesh>
        <mesh position={[-2.6, 1.0, 0]} rotation={[0, 0, 0]} castShadow material={barrierMat}>
          <boxGeometry args={[5.2, 0.16, 0.16]} />
        </mesh>
        {[-4.6, -3.4, -2.2, -1.0].map((bx, i) => (
          <mesh key={i} position={[bx, 1.0, 0.09]}>
            <boxGeometry args={[0.5, 0.16, 0.02]} />
            <meshStandardMaterial color={i % 2 ? '#ffffff' : '#d23b3b'} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
